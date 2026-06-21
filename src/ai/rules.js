import { getAll } from '../data/local.js';
import { store } from '../state/index.js';

const CORE_RULES = ['When to Roll', 'DC Guidelines', 'Ability Checks'];
const MAX_RULES_TOKENS = 1500;

export function detectContext() {
  const contexts = new Set(['any']);
  const c = store.campaign;

  if (c.combatState.active) {
    contexts.add('combat');
  }

  const msgs = c.narrative;
  const lastUser = msgs.findLast(m => m.role === 'user');
  const lastAssistant = msgs.findLast(m => m.role === 'assistant');

  if (lastUser) {
    classifyText(lastUser.content, contexts);
  }

  if (lastAssistant) {
    classifyText(lastAssistant.content, contexts);
    if (lastAssistant.mechanics?.applied?.some(m => m.key === 'combat_start' || m.key === 'zone_add_enemy')) {
      contexts.add('combat');
    }
    if (lastAssistant.mechanics?.applied?.some(m => m.key === 'roll_request')) {
      contexts.add('rolling');
    }
  }

  if (c.consequences.some(co => !co.resolved && co.deadline)) {
    contexts.add('exploration');
  }

  return [...contexts];
}

function classifyText(text, contexts) {
  const lower = text.toLowerCase();
  if (/rest|sleep|camp|recover|hit dice|short rest|long rest/.test(lower)) contexts.add('rest');
  if (/search|explore|travel|look|check|trap|climb|swim|sneak|hide|scout/.test(lower)) contexts.add('exploration');
  if (/cast|spell|slot|cantrip|concentrate|ritual/.test(lower)) contexts.add('spellcasting');
  if (/attack|fight|hit|stab|slash|shoot|bow|sword|ambush|initiative|combat|kill|strike/.test(lower)) contexts.add('combat');
  if (/persuade|deceive|intimidate|talk|charm|bribe|lie|convince|negotiate|bluff/.test(lower)) contexts.add('social');
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

  // Core rules first, then by specificity (fewer contexts = more specific)
  deduped.sort((a, b) => {
    const aCore = CORE_RULES.includes(a.name) ? 0 : 1;
    const bCore = CORE_RULES.includes(b.name) ? 0 : 1;
    if (aCore !== bCore) return aCore - bCore;
    return a.context.length - b.context.length;
  });

  return deduped;
}

export async function buildRulesBlock() {
  const contexts = detectContext();
  const rules = await pullRules(contexts);

  if (rules.length === 0) return '';

  const lines = ['RULES REFERENCE (D&D 5e SRD):'];
  let tokens = 0;

  for (const r of rules) {
    const line = `• ${r.name}: ${r.content}`;
    const lineTokens = Math.ceil(line.length / 4);
    if (tokens + lineTokens > MAX_RULES_TOKENS && !CORE_RULES.includes(r.name)) break;
    lines.push(line);
    tokens += lineTokens;
  }

  return lines.join('\n');
}
