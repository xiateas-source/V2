import { createSignal } from 'solid-js';
import { validateBundle } from '../../content/bundleNormalizer.js';
import { importBundle } from '../../data/bundles.js';

const CONTENT_LABELS = {
  adventures: 'Adventures',
  encounters: 'Encounters',
  npcs: 'NPCs',
  locations: 'Locations',
  aiGuidance: 'AI Guidance',
  dmTools: 'DM Tools',
};

// Bundle import flow — mirrors Settings.jsx's handleImportFile()/importGame()
// pattern (hidden file input → parse → validate → confirm → apply), with one
// addition: a content-count + warnings preview before committing, since a
// bundle can be much larger and more varied than a single save file.
export default function ContentImport({ onBack }) {
  const [parsed, setParsed] = createSignal(null); // { valid, errors, warnings, normalized }
  const [rawJson, setRawJson] = createSignal(null);
  const [busy, setBusy] = createSignal(false);
  let fileInput;

  function pickFile() {
    fileInput?.click();
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const result = validateBundle(json);
      setRawJson(json);
      setParsed(result);
    } catch (err) {
      setRawJson(null);
      setParsed({ valid: false, errors: ['Not valid JSON: ' + (err.message || 'parse error')], warnings: [] });
    }
  }

  async function confirmImport() {
    const raw = rawJson();
    if (!raw) return;
    setBusy(true);
    const result = await importBundle(raw);
    setBusy(false);
    if (!result.ok) {
      window.dispatchEvent(new CustomEvent('toast', { detail: { text: 'Import failed: ' + result.errors.join(', '), type: 'error' } }));
      return;
    }
    window.dispatchEvent(new CustomEvent('toast', { detail: { text: `Imported "${result.bundle.name}"` } }));
    onBack?.();
  }

  function reset() {
    setParsed(null);
    setRawJson(null);
  }

  return (
    <div class="settings-page">
      <div class="settings-subheader">
        <button class="btn-back" onClick={onBack}><i class="ph ph-caret-left" /> Back</button>
        <h2 class="settings-heading">Import Bundle</h2>
      </div>

      {!parsed() && (
        <section class="settings-section">
          <p class="settings-hint">Pick a bundle JSON file (adventures, encounters, NPCs, locations, AI guidance, DM tools).</p>
          <button class="btn-import" onClick={pickFile}>Choose Bundle File</button>
          <input ref={fileInput} type="file" accept=".json" class="import-file-input" onChange={handleFile} />
        </section>
      )}

      {parsed() && !parsed().valid && (
        <section class="settings-section">
          <p class="settings-hint" style="color: var(--color-danger, #d33)">Couldn't import this file:</p>
          <ul>
            {parsed().errors.map(e => <li>{e}</li>)}
          </ul>
          <button class="btn-import" onClick={reset}>Try Another File</button>
        </section>
      )}

      {parsed() && parsed().valid && (
        <section class="settings-section">
          <h3 class="settings-label">{parsed().normalized.name}</h3>
          <p class="settings-hint">
            v{parsed().normalized.version} · by {parsed().normalized.author}
          </p>
          {parsed().normalized.description && <p class="settings-hint">{parsed().normalized.description}</p>}

          <ul>
            {Object.entries(CONTENT_LABELS).map(([key, label]) => {
              const count = parsed().normalized.content[key]?.length || 0;
              return count > 0 ? <li>{label}: {count}</li> : null;
            })}
          </ul>

          {parsed().warnings.length > 0 && (
            <>
              <p class="settings-hint">{parsed().warnings.length} item(s) skipped:</p>
              <ul>
                {parsed().warnings.slice(0, 10).map(w => <li>{w}</li>)}
              </ul>
            </>
          )}

          <p class="settings-hint">Imported from your file — review before confirming.</p>
          <button class="btn-export" disabled={busy()} onClick={confirmImport}>
            {busy() ? 'Importing…' : 'Confirm Import'}
          </button>
          <button class="btn-import" onClick={reset}>Choose Different File</button>
        </section>
      )}
    </div>
  );
}
