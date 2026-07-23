import type { Payload, Where } from "payload";

import { CONTENT_SYNC_CONTEXT } from "../lib/publish-state";
import { forceDraftData } from "./force-draft";

/**
 * Marks every write below as a DRAFT write for the publish gate.
 *
 * These calls all pass `draft: true`, but Payload does not forward that into
 * beforeChange hooks, and the Local API carries no `?draft=true` query string
 * to fall back on. Without this marker a propose that lands on an
 * already-published document looks exactly like an editor unpublishing it, and
 * the gate in `access/index.ts` would 403 every legitimate `make propose`.
 */
const SYNC_WRITE_CONTEXT = { [CONTENT_SYNC_CONTEXT]: true } as const;
import {
  COLLECTION_KEYS,
  isDeniedSlug,
  isSyncCollection,
  isSyncGlobal,
  type SyncCollection,
  type UpsertKey,
} from "./keys";
import type {
  ContentPackage,
  MediaRef,
  SyncApplyResult,
} from "./package-types";

type SyncUser = {
  id: number | string;
  roles?: string[] | null;
  divisions?: string[] | null;
};

export const MAX_DOCS = 200;

function whereFromKey(
  key: UpsertKey,
  doc: Record<string, unknown>,
): Where | null {
  if (key.kind === "field") {
    const v = doc[key.field];
    if (v === undefined || v === null) return null;
    return { [key.field]: { equals: v } };
  }
  const clauses = key.fields.map((name): Where | null => {
    const v = doc[name];
    if (v === undefined || v === null) return null;
    return { [name]: { equals: v } };
  });
  if (clauses.some((c) => c === null)) return null;
  return { and: clauses as Where[] };
}

function labelFor(collection: string, doc: Record<string, unknown>): string {
  const key = isSyncCollection(collection) ? COLLECTION_KEYS[collection] : null;
  if (!key) return collection;
  if (key.kind === "field")
    return `${collection}:${String(doc[key.field] ?? "?")}`;
  return `${collection}:${key.fields.map((f) => String(doc[f] ?? "?")).join("+")}`;
}

async function resolveMediaId(
  payload: Payload,
  ref: MediaRef,
  errors: string[],
  context: string,
): Promise<number | string | null> {
  const found = await payload.find({
    collection: "media",
    where: { filename: { equals: ref.filename } },
    limit: 1,
    overrideAccess: true,
  });
  if (found.docs[0]) return found.docs[0].id;
  errors.push(
    `${context}: missing media filename "${ref.filename}" (lookup by filename only; no URL fetch)`,
  );
  return null;
}

async function remapUploads(
  payload: Payload,
  data: Record<string, unknown>,
  errors: string[],
  context: string,
): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === "_status") continue;
    out[key] = await remapValue(payload, value, errors, `${context}.${key}`);
  }
  return out;
}

async function remapValue(
  payload: Payload,
  value: unknown,
  errors: string[],
  context: string,
): Promise<unknown> {
  if (value == null) return value;
  if (Array.isArray(value)) {
    const mapped = [];
    for (let i = 0; i < value.length; i++) {
      mapped.push(
        await remapValue(payload, value[i], errors, `${context}[${i}]`),
      );
    }
    return mapped;
  }
  if (typeof value !== "object") return value;
  const obj = value as Record<string, unknown>;
  if (
    typeof obj.filename === "string" &&
    Object.keys(obj).every((k) => k === "filename" || k === "alt")
  ) {
    return resolveMediaId(payload, obj as MediaRef, errors, context);
  }
  const nested: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    nested[k] = await remapValue(payload, v, errors, `${context}.${k}`);
  }
  return nested;
}

/**
 * Canonical string form for content comparison: keys sorted (Postgres jsonb
 * and hand-edited bundles do not agree on key order), Payload row `id`s
 * dropped (regenerated on every write), null and undefined folded together.
 */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([k]) => k !== "id")
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

/**
 * A proposed write is a no-op when every key the package sets already holds
 * the same value on the target's latest draft-aware state. Skipping these
 * keeps the review queue meaning "things a Head must judge": re-proposing a
 * pulled-but-unedited package used to write one draft version per doc,
 * flooding the queue with rows identical to live.
 */
function isUnchanged(
  data: Record<string, unknown>,
  existing: Record<string, unknown>,
): boolean {
  for (const [key, value] of Object.entries(data)) {
    if (key === "_status") continue;
    if (stableStringify(value) !== stableStringify(existing[key])) return false;
  }
  return true;
}

export async function applyContentPackage(args: {
  payload: Payload;
  user: SyncUser;
  pkg: ContentPackage;
  dryRun?: boolean;
}): Promise<SyncApplyResult> {
  const { payload, user, pkg } = args;
  const dryRun = Boolean(args.dryRun);
  const result: SyncApplyResult = {
    created: [],
    updated: [],
    skipped: [],
    errors: [],
    dryRun,
  };

  const collections = pkg.collections ?? {};
  const globals = pkg.globals ?? {};

  // Fail closed: any denied/unknown slug aborts before the first write.
  for (const slug of Object.keys(collections)) {
    if (isDeniedSlug(slug)) {
      result.errors.push(`denied collection "${slug}"`);
    } else if (!isSyncCollection(slug)) {
      result.errors.push(`unknown or non-allowlisted collection "${slug}"`);
    }
  }
  for (const slug of Object.keys(globals)) {
    if (isDeniedSlug(slug)) {
      result.errors.push(`denied global "${slug}"`);
    } else if (!isSyncGlobal(slug)) {
      result.errors.push(`unknown or non-allowlisted global "${slug}"`);
    }
  }
  if (result.errors.length > 0) {
    return result;
  }

  let docCount = 0;
  for (const docs of Object.values(collections)) docCount += docs.length;
  docCount += Object.keys(globals).length;
  if (docCount > MAX_DOCS) {
    result.errors.push(`package exceeds max docs (${MAX_DOCS})`);
    return result;
  }

  for (const [slug, docs] of Object.entries(collections)) {
    if (!isSyncCollection(slug) || isDeniedSlug(slug)) continue;
    const key = COLLECTION_KEYS[slug as SyncCollection];
    for (const raw of docs) {
      const label = labelFor(slug, raw);
      const where = whereFromKey(key, raw);
      if (!where) {
        result.errors.push(`${label}: missing upsert key fields`);
        continue;
      }

      const errBefore = result.errors.length;
      const remapped = await remapUploads(payload, raw, result.errors, label);
      const mediaMissing = result.errors
        .slice(errBefore)
        .some((e) => e.includes("missing media filename"));
      if (mediaMissing) {
        result.skipped.push(label);
        continue;
      }

      const data = forceDraftData(remapped as Record<string, unknown>);
      // depth 0 keeps upload fields as raw ids, comparable with the remapped
      // package data in the isUnchanged check below.
      const existing = await payload.find({
        collection: slug,
        where,
        limit: 1,
        draft: true,
        depth: 0,
        overrideAccess: false,
        user,
      });

      if (
        existing.docs[0] &&
        isUnchanged(
          data,
          existing.docs[0] as unknown as Record<string, unknown>,
        )
      ) {
        result.skipped.push(`${label} (unchanged)`);
        continue;
      }

      if (dryRun) {
        if (existing.docs[0]) result.updated.push(label);
        else result.created.push(label);
        continue;
      }

      try {
        if (existing.docs[0]) {
          await payload.update({
            collection: slug,
            id: existing.docs[0].id,
            data,
            draft: true,
            overrideAccess: false,
            user,
            context: SYNC_WRITE_CONTEXT,
          });
          result.updated.push(label);
        } else {
          await payload.create({
            collection: slug,
            data,
            draft: true,
            overrideAccess: false,
            user,
            context: SYNC_WRITE_CONTEXT,
          });
          result.created.push(label);
        }
      } catch (err) {
        result.errors.push(
          `${label}: ${err instanceof Error ? err.message : String(err)}`,
        );
        // Fail closed: stop further collection/global writes after a write error.
        return result;
      }
    }
  }

  for (const [slug, raw] of Object.entries(globals)) {
    if (!isSyncGlobal(slug) || isDeniedSlug(slug)) continue;
    const label = `global:${slug}`;
    const errBefore = result.errors.length;
    const remapped = await remapUploads(payload, raw, result.errors, label);
    const mediaMissing = result.errors
      .slice(errBefore)
      .some((e) => e.includes("missing media filename"));
    if (mediaMissing) {
      result.skipped.push(label);
      continue;
    }
    const data = forceDraftData(remapped as Record<string, unknown>);

    const currentGlobal = (await payload.findGlobal({
      slug,
      draft: true,
      depth: 0,
      overrideAccess: false,
      user,
    })) as unknown as Record<string, unknown> | null;
    if (currentGlobal && isUnchanged(data, currentGlobal)) {
      result.skipped.push(`${label} (unchanged)`);
      continue;
    }

    if (dryRun) {
      result.updated.push(label);
      continue;
    }

    try {
      await payload.updateGlobal({
        slug,
        data,
        draft: true,
        overrideAccess: false,
        user,
        context: SYNC_WRITE_CONTEXT,
      });
      result.updated.push(label);
    } catch (err) {
      result.errors.push(
        `${label}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return result;
    }
  }

  return result;
}
