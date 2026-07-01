// Bundles are authored externally (e.g. via an outside AI conversation, same
// posture as character-JSON import) — this normalizer's job is to tolerate
// whatever shape comes in, not to require an exact schema. Reuses the
// wrapper-flattening approach from content/normalizer.js, but adds one thing
// normalizer.js doesn't need: per-array-entry validation. A single malformed
// character field can be defaulted; a single malformed NPC/encounter/location
// entry inside an otherwise-good bundle should be dropped with a warning, not
// used to reject the whole bundle.

const CONTENT_KEYS = ['adventures', 'encounters', 'npcs', 'locations', 'aiGuidance', 'dmTools'];

// AI-generated bundle JSON sometimes wraps everything under "bundle" or
// "content"/"pack" instead of the top level — fold those up first, same idea
// as normalizer.js's KNOWN_WRAPPERS.
const META_WRAPPERS = ['bundle', 'pack'];

function flattenWrappers(raw) {
  let flat = { ...raw };
  for (const wrapper of META_WRAPPERS) {
    const value = raw[wrapper];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flat = { ...flat, ...value };
    }
  }
  return flat;
}

// Each bundle content array has its own minimal required-field set — anything
// missing that field, or not an object at all, is dropped (with a warning)
// rather than failing the whole bundle.
const REQUIRED_FIELDS = {
  adventures: ['title'],
  encounters: ['name'],
  npcs: ['name'],
  locations: ['name'],
  aiGuidance: ['text'],
  dmTools: ['title'],
};

function normalizeEntry(entry, key, index, warnings) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    warnings.push(`${key}[${index}]: not an object, dropped`);
    return null;
  }
  const required = REQUIRED_FIELDS[key] || [];
  for (const field of required) {
    if (!entry[field] || typeof entry[field] !== 'string' || !entry[field].trim()) {
      warnings.push(`${key}[${index}]: missing required "${field}", dropped`);
      return null;
    }
  }
  const id = entry.id || `${key}_${index}_${(entry.name || entry.title || '').slice(0, 20).replace(/\s+/g, '_').toLowerCase()}`;
  if (key === 'aiGuidance') {
    const scope = typeof entry.scope === 'string' && entry.scope.trim() ? entry.scope.trim() : 'general';
    return { ...entry, id, scope };
  }
  return { ...entry, id };
}

function normalizeContentArray(raw, key, warnings) {
  const list = Array.isArray(raw) ? raw : [];
  const out = [];
  list.forEach((entry, i) => {
    const normalized = normalizeEntry(entry, key, i, warnings);
    if (normalized) out.push(normalized);
  });
  return out;
}

// Returns { valid, errors, warnings, normalized }. Only meta.id/meta.name are
// hard-required — everything else defaults or degrades gracefully so an
// externally-authored bundle with an unexpected shape doesn't get rejected
// outright over one bad field.
export function validateBundle(rawInput) {
  const errors = [];
  const warnings = [];

  if (!rawInput || typeof rawInput !== 'object') {
    return { valid: false, errors: ['Bundle must be a JSON object'], warnings: [], normalized: null };
  }

  const raw = flattenWrappers(rawInput);
  const meta = (raw.meta && typeof raw.meta === 'object') ? raw.meta : raw;

  const id = meta.id || raw.id;
  const name = meta.name || raw.name;
  if (!id || typeof id !== 'string' || !id.trim()) errors.push('meta.id is required');
  if (!name || typeof name !== 'string' || !name.trim()) errors.push('meta.name is required');

  if (errors.length) {
    return { valid: false, errors, warnings, normalized: null };
  }

  const contentRaw = (raw.content && typeof raw.content === 'object') ? raw.content : raw;
  const content = {};
  for (const key of CONTENT_KEYS) {
    content[key] = normalizeContentArray(contentRaw[key], key, warnings);
  }

  const normalized = {
    id: id.trim(),
    name: name.trim(),
    version: (meta.version || raw.version || '1.0.0').toString(),
    author: (meta.author || raw.author || 'Unknown').toString(),
    description: (meta.description || raw.description || '').toString(),
    compatibility: (meta.compatibility && typeof meta.compatibility === 'object') ? meta.compatibility : {},
    dependencies: Array.isArray(meta.dependencies) ? meta.dependencies : [],
    content,
  };

  return { valid: true, errors: [], warnings, normalized };
}
