import { getAll, getByKey, putAll, deleteByKey } from './local.js';
import { validateBundle } from '../content/bundleNormalizer.js';

export async function listBundles() {
  return getAll('bundles');
}

export async function getBundle(id) {
  return getByKey('bundles', id);
}

// Bundles are authored externally (an outside AI conversation, matching the
// character-JSON-import precedent) — this app's job is import/validate/manage,
// not create-from-scratch. `raw` is kept verbatim alongside the normalized
// content so exportBundle() can always re-share losslessly, even for fields
// the normalizer didn't recognize.
export async function importBundle(rawJson) {
  const { valid, errors, warnings, normalized } = validateBundle(rawJson);
  if (!valid) return { ok: false, errors, warnings: [] };

  const record = {
    id: normalized.id,
    name: normalized.name,
    version: normalized.version,
    author: normalized.author,
    description: normalized.description,
    compatibility: normalized.compatibility,
    dependencies: normalized.dependencies,
    content: normalized.content,
    importedAt: Date.now(),
    raw: rawJson,
  };
  await putAll('bundles', [record]);
  return { ok: true, warnings, bundle: record };
}

// "Replace" = re-import under the same meta.id. IndexedDB's put() on a
// matching keyPath overwrites the whole record — importBundle() always
// builds the new record fresh from rawJson, never spreads the old stored
// record in, so a newer bundle with fewer entries than the old one can't
// leave stale array data behind.
export async function replaceBundle(rawJson) {
  return importBundle(rawJson);
}

export async function deleteBundle(id) {
  return deleteByKey('bundles', id);
}

// "Publish" for MVP = re-export what's already imported, verbatim — there is
// no in-app authoring UI for bundle content.
export function exportBundle(bundle) {
  return bundle.raw;
}
