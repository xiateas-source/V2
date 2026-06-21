import { getByIndex, getAll } from '../data/local.js';
import { store } from '../state/index.js';

export function detectContext() {
  const contexts = new Set(['any']);
  const c = store.campaign;

  if (c.combatState.active) {
    contexts.add('combat');
  }

  const lastMsg = c.narrative[c.narrative.length - 1];
  if (lastMsg?.role === 'user') {
    const text = lastMsg.content.toLowerCase();
    if (/rest|sleep|camp|recover/.test(text)) contexts.add('rest');
    if (/search|explore|travel|look|check|trap|climb|swim/.test(text)) contexts.add('exploration');
    if (/cast|spell|slot|cantrip|concentrate/.test(text)) contexts.add('spellcasting');
    if (/attack|fight|hit|stab|slash|shoot|bow|sword|ambush/.test(text)) contexts.add('combat');
    if (/persuade|deceive|intimidate|talk|charm|bribe|lie|convince/.test(text)) contexts.add('social');
  }

  return [...contexts];
}

export async function pullRules(contexts) {
  const allRules = await getAll('compendium');
  const rules = allRules.filter(r =>
    r.type !== undefined &&
    r.context &&
    r.context.some(ctx => contexts.includes(ctx))
  );

  const seen = new Set();
  const deduped = [];
  for (const r of rules) {
    if (!seen.has(r.name)) {
      seen.add(r.name);
      deduped.push(r);
    }
  }

  return deduped;
}

export async function buildRulesBlock() {
  const contexts = detectContext();
  const rules = await pullRules(contexts);

  if (rules.length === 0) return '';

  const lines = ['RULES REFERENCE (contextual — from SRD/PHB):'];
  for (const r of rules) {
    lines.push(`• ${r.name} (${r.source}): ${r.content}`);
  }
  return lines.join('\n');
}
