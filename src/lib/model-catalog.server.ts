import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  catalogFromSnapshot,
  hardcodedCatalog,
  type ModelCatalog,
  type StoredSnapshot,
} from "./model-catalog";
import { getLastKnownGoodSnapshot, saveLastKnownGoodSnapshot } from "./scenario-store";

/**
 * Resolves the model catalog, server-side, so the picker never waits on the
 * client:
 *
 *   1. in-memory (per isolate), 1 h TTL
 *   2. OVERSHOOT service binding -> latestSnapshot(), if generated <= 3 days
 *      ago; each new snapshot is copied into BvB's D1
 *   3. newest snapshot held in BvB's D1, if generated <= 14 days ago
 *   4. the hardcoded MODEL_DATA table
 *
 * Deliberately independent of any user or session: every visitor gets the
 * same catalog, and nothing here reads identity.
 */

const CACHE_TTL_MS = 60 * 60 * 1000;
/** A fallback result is re-checked sooner, so recovery doesn't wait an hour. */
const FALLBACK_TTL_MS = 5 * 60 * 1000;
const TRUST_DAYS = 3;
const LAST_KNOWN_GOOD_MAX_DAYS = 14;
const BINDING_TIMEOUT_MS = 2_000;

type OvershootBinding = {
  latestSnapshot(): Promise<StoredSnapshot | null>;
  snapshotById(id: number): Promise<StoredSnapshot | null>;
};

// Plain data only. A promise is NOT shared across requests: Workers ties I/O
// to the request that started it, so concurrent misses each resolve (one
// indexed read each) rather than awaiting another request's binding call.
let cached: { catalog: ModelCatalog; expires: number } | null = null;

export async function getModelCatalog(): Promise<ModelCatalog> {
  if (cached && cached.expires > Date.now()) return cached.catalog;
  const catalog = await resolve();
  const ttl = catalog.provenance.source === "snapshot" ? CACHE_TTL_MS : FALLBACK_TTL_MS;
  cached = { catalog, expires: Date.now() + ttl };
  return catalog;
}

async function resolve(): Promise<ModelCatalog> {
  // 2. Live snapshot over the service binding.
  try {
    const binding = await getBinding();
    if (binding) {
      const snap = await withTimeout(binding.latestSnapshot(), BINDING_TIMEOUT_MS);
      if (snap && ageDays(snap.generated_at) <= TRUST_DAYS) {
        const catalog = catalogFromSnapshot(snap, "snapshot");
        if (catalog) {
          try {
            await saveLastKnownGoodSnapshot(snap.snapshot_id, snap.generated_at, JSON.stringify(snap));
          } catch (e) {
            console.warn("[model-catalog] could not save last-known-good snapshot:", e);
          }
          return catalog;
        }
        console.warn(`[model-catalog] snapshot ${snap.snapshot_id} unusable (schema ${snap.schema_version})`);
      } else if (snap) {
        console.warn(`[model-catalog] snapshot ${snap.snapshot_id} is stale (${snap.generated_at})`);
      }
    }
  } catch (e) {
    console.warn("[model-catalog] service binding failed:", e);
  }

  // 3. Last known good, held in BvB's own D1.
  try {
    const lkg = await getLastKnownGoodSnapshot();
    if (lkg && ageDays(lkg.generatedAt) <= LAST_KNOWN_GOOD_MAX_DAYS) {
      const catalog = catalogFromSnapshot(JSON.parse(lkg.payloadJson) as StoredSnapshot, "last_known_good");
      if (catalog) return catalog;
    }
  } catch (e) {
    console.warn("[model-catalog] last-known-good lookup failed:", e);
  }

  // 4. Hardcoded. Never an empty picker.
  return hardcodedCatalog();
}

async function getBinding(): Promise<OvershootBinding | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return ((env as Record<string, unknown>).OVERSHOOT as OvershootBinding | undefined) ?? null;
  } catch {
    // Plain `next dev` has no Cloudflare context.
    return null;
  }
}

function ageDays(iso: string): number {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? Infinity : (Date.now() - t) / 86_400_000;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out after ${ms} ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}
