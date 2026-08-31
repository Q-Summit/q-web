import type { Payload, PayloadRequest } from "payload";

/**
 * Reverse lookup for the media library: which content points at a given file.
 *
 * One loader, three consumers (the "Used on" panel on a media document, the
 * beforeDelete guard, and the /media-usage overview) so they can never
 * disagree about whether a file is in use.
 *
 * Why not a `join` field: Payload's sanitizeJoinField throws "Join fields
 * cannot be added to arrays, blocks or globals" and resolves join targets
 * only against `config.collections`. A join-backed panel therefore cannot see
 * page-whyq → audiences[].imageFile, and a panel that silently misses a
 * reference is worse than no panel at all: it tells an editor a file is
 * unused and licenses the delete. It would also force `index: true` onto six
 * relationship columns, dragging a migration in for nothing.
 *
 * Coverage caveat, repeated in the UI copy: a draft save writes only the
 * version row, so this checks the published row plus the latest draft of each
 * document. Older version rows can still hold the same file id, and deleting
 * the file nulls those too, which breaks "restore this version" for them.
 * That is why nothing here ever renders a bare "Unused" claim.
 */

/** Collections with a top-level `upload` field pointing at media. */
export const MEDIA_UPLOAD_FIELDS = [
  { slug: "partners", field: "logo", label: "Partners", titleField: "name" },
  { slug: "jobs", field: "logo", label: "Jobs", titleField: "title" },
  { slug: "speakers", field: "photo", label: "Speakers", titleField: "name" },
  { slug: "team", field: "photo", label: "Team", titleField: "name" },
  {
    slug: "past-teams",
    field: "photo",
    label: "Past teams",
    titleField: "year",
  },
  {
    slug: "testimonials",
    field: "photo",
    label: "Testimonials",
    titleField: "attribution",
  },
] as const;

/**
 * One upload (or array of uploads) inside a global. `fieldPath` is dotted,
 * with `[]` marking an array walk (e.g. `audiences[].imageFile`).
 * `titleField` reads the row label from that array item; `title` is a
 * fixed label for a single upload.
 */
export type MediaGlobalRef = {
  fieldPath: string;
  titleField?: string;
  title?: string;
};

/**
 * Globals holding media. Fetch each slug once, then walk every ref.
 * The `logos` arrays on page-home are name registries, not uploads.
 */
export const MEDIA_GLOBAL_FIELDS = [
  {
    slug: "page-whyq",
    label: "Why Q?",
    path: "/whyq/",
    refs: [{ fieldPath: "audiences[].imageFile", titleField: "heading" }],
  },
  {
    slug: "page-kickoff",
    label: "Join Q / Kickoff",
    path: "/kickoff/",
    refs: [
      { fieldPath: "hero.image", title: "Hero image" },
      { fieldPath: "kickoff.company.logo", title: "Company logo" },
      { fieldPath: "kickoff.speakers[].image", titleField: "name" },
      { fieldPath: "journey.moments[].image", titleField: "title" },
    ],
  },
] as const satisfies readonly {
  slug: string;
  label: string;
  path: string;
  refs: readonly MediaGlobalRef[];
}[];

export type MediaRef = {
  /** Where the reference lives, e.g. "Partners" or "Why Q?". */
  label: string;
  /** Human name of the referencing entry. */
  title: string;
  /** Admin URL of the referencing document. */
  href: string;
};

function idOf(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  const id = (value as { id?: unknown }).id;
  return id == null ? null : String(id);
}

function titleOf(doc: Record<string, unknown>, field: string): string {
  const raw = doc[field];
  return typeof raw === "string" && raw.trim() ? raw : `Untitled (${doc.id})`;
}

type PathHit = {
  value: unknown;
  item: Record<string, unknown> | null;
  index: number | null;
};

function collectPathHits(root: unknown, fieldPath: string): PathHit[] {
  let nodes: PathHit[] = [
    {
      value: root,
      item:
        root != null && typeof root === "object"
          ? (root as Record<string, unknown>)
          : null,
      index: null,
    },
  ];

  for (const raw of fieldPath.split(".")) {
    const array = raw.endsWith("[]");
    const key = array ? raw.slice(0, -2) : raw;
    const next: PathHit[] = [];

    for (const node of nodes) {
      if (node.value == null || typeof node.value !== "object") continue;
      const child = (node.value as Record<string, unknown>)[key];
      if (array) {
        if (!Array.isArray(child)) continue;
        child.forEach((entry, index) => {
          next.push({
            value: entry,
            item:
              entry != null && typeof entry === "object"
                ? (entry as Record<string, unknown>)
                : null,
            index,
          });
        });
        continue;
      }
      next.push({ value: child, item: node.item, index: node.index });
    }

    nodes = next;
  }

  return nodes;
}

function refTitle(ref: MediaGlobalRef, hit: PathHit): string {
  if (ref.titleField && hit.item) return titleOf(hit.item, ref.titleField);
  if (ref.title) return ref.title;
  return "Untitled";
}

/** Every published-or-draft entry that points at `mediaID`. */
export async function findMediaReferences(
  payload: Payload,
  mediaID: string | number,
): Promise<MediaRef[]> {
  const refs = new Map<string, MediaRef>();

  await Promise.all(
    MEDIA_UPLOAD_FIELDS.map(async (entry) => {
      // Two reads: the live table holds published state, the version table
      // holds pending drafts, and a draft-only reference still counts as use.
      const [live, drafts] = await Promise.all([
        payload.find({
          collection: entry.slug,
          where: { [entry.field]: { equals: mediaID } },
          depth: 0,
          pagination: false,
          overrideAccess: true,
        }),
        payload.find({
          collection: entry.slug,
          where: { [entry.field]: { equals: mediaID } },
          depth: 0,
          draft: true,
          pagination: false,
          overrideAccess: true,
        }),
      ]);

      for (const doc of [...live.docs, ...drafts.docs]) {
        const row = doc as unknown as Record<string, unknown>;
        refs.set(`${entry.slug}:${row.id}`, {
          label: entry.label,
          title: titleOf(row, entry.titleField),
          href: `/collections/${entry.slug}/${row.id}`,
        });
      }
    }),
  );

  await Promise.all(
    MEDIA_GLOBAL_FIELDS.map(async (entry) => {
      const doc = (await payload.findGlobal({
        slug: entry.slug,
        depth: 0,
        draft: true,
        overrideAccess: true,
      })) as unknown as Record<string, unknown>;

      for (const ref of entry.refs) {
        for (const hit of collectPathHits(doc, ref.fieldPath)) {
          if (idOf(hit.value) !== String(mediaID)) continue;
          const key =
            hit.index == null
              ? `${entry.slug}:${ref.fieldPath}`
              : `${entry.slug}:${ref.fieldPath}:${hit.index}`;
          refs.set(key, {
            label: `${entry.label} (${entry.path})`,
            title: refTitle(ref, hit),
            href: `/globals/${entry.slug}`,
          });
        }
      }
    }),
  );

  return [...refs.values()].sort(
    (a, b) => a.label.localeCompare(b.label) || a.title.localeCompare(b.title),
  );
}

export type MediaUsageRow = {
  id: string | number;
  filename: string;
  alt: string;
  refs: MediaRef[];
};

/** Every media file with its references, for the /media-usage overview. */
export async function loadMediaUsage(
  payload: Payload,
  req?: PayloadRequest,
): Promise<MediaUsageRow[]> {
  const media = await payload.find({
    collection: "media",
    depth: 0,
    // Unpaginated on purpose: at the default limit the files belonging to the
    // 11th partner would be reported as used by nothing.
    pagination: false,
    sort: "filename",
    overrideAccess: false,
    ...(req?.user ? { user: req.user } : {}),
  });

  return Promise.all(
    media.docs.map(async (doc) => {
      const row = doc as unknown as Record<string, unknown>;
      return {
        id: row.id as string | number,
        filename: typeof row.filename === "string" ? row.filename : "",
        alt: typeof row.alt === "string" ? row.alt : "",
        refs: await findMediaReferences(payload, row.id as string | number),
      };
    }),
  );
}
