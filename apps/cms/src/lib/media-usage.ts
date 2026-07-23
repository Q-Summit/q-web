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
 * Globals holding media inside an array. Only page-whyq does today; the
 * `logos` arrays on page-home are name registries, not uploads.
 */
export const MEDIA_GLOBAL_FIELDS = [
  {
    slug: "page-whyq",
    label: "Why Q?",
    path: "/whyq/",
    array: "audiences",
    field: "imageFile",
    titleField: "heading",
  },
] as const;

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

      const rows = doc?.[entry.array];
      if (!Array.isArray(rows)) return;

      rows.forEach((row, index) => {
        const item = row as Record<string, unknown>;
        if (idOf(item[entry.field]) !== String(mediaID)) return;
        refs.set(`${entry.slug}:${index}`, {
          label: `${entry.label} (${entry.path})`,
          title: titleOf(item, entry.titleField),
          href: `/globals/${entry.slug}`,
        });
      });
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
