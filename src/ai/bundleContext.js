import { getAll } from '../data/local.js';
import { store } from '../state/index.js';

// Sibling budget to rules.js's MAX_RULES_TOKENS — bundles are optional
// campaign-enrichment content, not core rules, so they get their own,
// smaller cap rather than competing with the rules block for the same one.
const MAX_BUNDLE_TOKENS = 1000;

// Only aiGuidance scoped to the current location/present NPCs, plus the
// matching location/npc detail entries, are auto-injected — encounters,
// adventures, and dmTools stay DM-browsable only (see the Bundles reference
// view), never auto-fed to the AI. This keeps the injected block small and
// predictable rather than dumping a whole bundle into every prompt (Law 5).
export async function buildBundleBlock() {
  try {
    const active = Object.values(store.campaign.activeBundles || {}).filter(b => b.active);
    if (!active.length) return '';

    const all = await getAll('bundles');
    const installed = all.filter(b => active.some(a => a.id === b.id));
    if (!installed.length) return '';

    const loc = store.campaign.location;
    const presentNpcNames = store.campaign.npcs
      .filter(n => n.status === 'active' && n.lastSeen === loc)
      .map(n => n.name);

    // Collect scene-specific entries first, general-scope guidance last, so
    // if the budget runs out, a general entry from some bundle is what gets
    // dropped before a scene-specific one ever would.
    const specific = [];
    const general = [];

    for (const bundle of installed) {
      const content = bundle.content || {};
      const locEntry = (content.locations || []).find(l => l.name === loc);
      if (locEntry) specific.push(`[${bundle.name}] Location detail (${locEntry.name}): ${locEntry.description}`);

      for (const npc of (content.npcs || [])) {
        if (presentNpcNames.includes(npc.name)) {
          specific.push(`[${bundle.name}] NPC detail (${npc.name}): ${npc.description}`);
        }
      }

      for (const g of (content.aiGuidance || [])) {
        const line = `[${bundle.name}] Guidance: ${g.text}`;
        if (g.scope === 'general') {
          general.push(line);
        } else if (g.scope === `location:${loc}` || presentNpcNames.some(n => g.scope === `npc:${n}`)) {
          specific.push(line);
        }
      }
    }

    const ordered = [...specific, ...general];
    if (!ordered.length) return '';

    const lines = ['CAMPAIGN CONTENT (from installed bundles):'];
    let tokens = 0;
    for (const line of ordered) {
      const lineTokens = Math.ceil(line.length / 4);
      if (tokens + lineTokens > MAX_BUNDLE_TOKENS) break;
      lines.push(line);
      tokens += lineTokens;
    }

    return lines.join('\n');
  } catch {
    return '';
  }
}
