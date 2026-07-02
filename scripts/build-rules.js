#!/usr/bin/env node
// Builds data/rules.json (the AI rules-injection + Compendium "Rules" content)
// from the SRD 5.2 source files, merged with the app-specific curated entries.
// Also regenerates .claude/rules-coverage.md — the coverage matrix that answers
// "which rules does the game know, and at what level of enforcement?"
//
// Run: node scripts/build-rules.js
// Inputs:
//   scripts/srd/rules-glossary.md     — SRD 5.2 Rules Glossary (154 definitions)
//   scripts/srd/playing-the-game.md   — SRD 5.2 "Playing the Game" chapter
//   scripts/srd/curated-rules.json    — app-authored guidance (When to Roll, etc.)
// Outputs:
//   data/rules.json
//   .claude/rules-coverage.md
//
// SRD 5.2 content is used under CC-BY-4.0 (see data/ATTRIBUTION.md).

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(resolve(__dirname, p), 'utf-8');

// ---------------------------------------------------------------------------
// Context vocabulary — must match what src/ai/rules.js's detectContext() can
// produce: any, combat, rolling, rest, exploration, spellcasting, social.
// 'reference' is deliberately outside that set: entries tagged reference are
// browsable in the Compendium but never injected into the AI prompt.
// ---------------------------------------------------------------------------
const CONTEXTS = ['any', 'combat', 'rolling', 'rest', 'exploration', 'spellcasting', 'social', 'reference'];

// Family-tag defaults ([Action], [Condition], ...) and per-name overrides.
const FAMILY_CONTEXT = {
  Action: ['combat'],
  Condition: ['combat'],
  Hazard: ['exploration'],
  Attitude: ['social'],
  'Area of Effect': ['spellcasting'],
};

const NAME_CONTEXT = {
  // rolling
  'Ability Check': ['rolling'], 'Ability Score and Modifier': ['rolling'],
  'Advantage': ['rolling'], 'Disadvantage': ['rolling'], 'D20 Test': ['rolling'],
  'Difficulty Class': ['rolling'], 'Proficiency': ['rolling'], 'Expertise': ['rolling'],
  'Heroic Inspiration': ['rolling'], 'Passive Perception': ['rolling'],
  'Save': ['rolling'], 'Saving Throw': ['rolling'], 'Skill': ['rolling'], 'Round Down': ['rolling'],
  // combat
  'Armor Class': ['combat'], 'Attack Roll': ['combat'], 'Bloodied': ['combat'],
  'Bonus Action': ['combat'], 'Cover': ['combat'], 'Critical Hit': ['combat'],
  'Damage': ['combat'], 'Damage Roll': ['combat'], 'Damage Threshold': ['combat'],
  'Damage Types': ['combat'], 'Dead': ['combat'], 'Death Saving Throw': ['combat'],
  'Healing': ['combat', 'rest'], 'Hit Points': ['combat'], 'Hit Point Dice': ['combat', 'rest'],
  'Initiative': ['combat'], 'Knocking Out a Creature': ['combat'],
  'Opportunity Attacks': ['combat'], 'Reach': ['combat'], 'Reaction': ['combat'],
  'Resistance': ['combat'], 'Vulnerability': ['combat'], 'Immunity': ['combat'],
  'Stable': ['combat'], 'Surprise': ['combat'], 'Target': ['combat'],
  'Temporary Hit Points': ['combat'], 'Unarmed Strike': ['combat'],
  'Weapon': ['combat'], 'Weapon Attack': ['combat'], 'Improvised Weapons': ['combat'],
  'Grappling': ['combat'], 'Speed': ['combat', 'exploration'],
  // exploration
  'Bright Light': ['exploration'], 'Darkness': ['exploration'], 'Dim Light': ['exploration'],
  'Heavily Obscured': ['exploration'], 'Lightly Obscured': ['exploration'],
  'Blindsight': ['exploration'], 'Darkvision': ['exploration'],
  'Tremorsense': ['exploration'], 'Truesight': ['exploration'],
  'Carrying Capacity': ['exploration'], 'Climbing': ['exploration'], 'Swimming': ['exploration'],
  'Crawling': ['exploration'], 'Jumping': ['exploration'], 'High Jump': ['exploration'],
  'Long Jump': ['exploration'], 'Flying': ['exploration'], 'Hover': ['exploration'],
  'Difficult Terrain': ['exploration', 'combat'], 'Breaking Objects': ['exploration'],
  'Object': ['exploration'], 'Occupied Space': ['combat'], 'Unoccupied Space': ['combat'],
  'Burrow Speed': ['exploration'], 'Climb Speed': ['exploration'], 'Fly Speed': ['exploration'],
  'Swim Speed': ['exploration'], 'Telepathy': ['exploration'], 'Per Day': ['exploration'],
  // spellcasting
  'Cantrip': ['spellcasting'], 'Concentration': ['spellcasting', 'combat'],
  'Spell': ['spellcasting'], 'Spell Attack': ['spellcasting'],
  'Spellcasting Focus': ['spellcasting'], 'Ritual': ['spellcasting'],
  'Magical Effect': ['spellcasting'], 'Illusions': ['spellcasting'], 'Curses': ['spellcasting'],
  'Possession': ['spellcasting'], 'Shape-Shifting': ['spellcasting'], 'Teleportation': ['spellcasting'],
  // rest
  'Short Rest': ['rest'], 'Long Rest': ['rest'],
};

// Meta/worldbuilding terms that should never spend prompt tokens.
const REFERENCE_ONLY = new Set([
  'Adventure', 'Alignment', 'Ally', 'Enemy', 'Campaign', 'Challenge Rating',
  'Character Sheet', 'Creature', 'Creature Type', 'Encounter', 'Experience Points',
  'Monster', 'Nonplayer Character', 'Player Character', 'Stat Block', 'Size',
  'Simultaneous Effects', 'Armor Training', 'Curses', 'Possession',
]);

// Curated entries dropped because the SRD 5.2 source supersedes them — either an
// exact name collision or a superseded alias. Several carried 2014-edition rules
// that contradict what the app's code actually enforces (Exhaustion -2/level,
// 2024 Surprise = Disadvantage on Initiative, 2024 Grappling/Hide):
const CURATED_SUPERSEDED = new Set([
  // exact collisions — SRD wins
  'Concentration', 'Opportunity Attacks', 'Cover', 'Short Rest', 'Long Rest',
  'Grappling', 'Surprise', 'Difficult Terrain', 'Initiative',
  // superseded aliases (curated name → SRD entry)
  'Death Saves',          // → Death Saving Throw
  'Falling',              // → Falling [Hazard]
  'Suffocating',          // → Suffocation [Hazard]
  'Exhaustion',           // → Exhaustion [Condition] (2014 tiers → 2024 -2/level)
  'Conditions Reference', // → individual [Condition] entries (2024 text)
  'Stealth and Hiding',   // → Hide [Action] (2024 changed the cover requirement)
  'Shoving',              // → Unarmed Strike (2024 replaced the 2014 contest)
]);

// "Playing the Game" chapter sections worth extracting as whole entries
// (procedures the glossary only covers piecemeal). Sidebars (blockquotes) are
// dropped — the grid-play sidebar would mislead a zone-based game.
const CHAPTER_SECTIONS = {
  'Travel': { contexts: ['exploration'], rename: 'Travel Pace' },
  'Vision and Light': { contexts: ['exploration'] },
  'Hiding': { contexts: ['exploration'] },
  'Interacting with Objects': { contexts: ['exploration'] },
  'Social Interaction': { contexts: ['social'] },
  'Making an Attack': { contexts: ['combat'] },
  'Ranged Attacks': { contexts: ['combat'] },
  'Melee Attacks': { contexts: ['combat'] },
  'Mounted Combat': { contexts: ['combat'] },
  'Underwater Combat': { contexts: ['combat'] },
  'Movement and Position': { contexts: ['combat'] },
  'Dropping to 0 Hit Points': { contexts: ['combat'] },
  'Skill Proficiencies': { contexts: ['rolling'] },
};

// The one sidebar worth keeping, re-added as a manual entry.
const MANUAL_ENTRIES = [{
  name: 'Unseen Attackers and Targets',
  type: 'combat', source: 'SRD 5.2 — Playing the Game', context: ['combat'],
  content: 'When you make an attack roll against a target you can\'t see, you have Disadvantage on the roll — whether you\'re guessing the location or targeting a creature you can hear but not see; if the target isn\'t where you aimed, you miss. When a creature can\'t see you, you have Advantage on attack rolls against it. If you are hidden when you attack, you give away your location when the attack hits or misses.',
}];

// ---------------------------------------------------------------------------
// Cleaning: HTML tables → "a | b" text lines; strip emphasis; drop See-also.
// ---------------------------------------------------------------------------
function cleanBlock(lines) {
  const out = [];
  let row = null;
  for (let raw of lines) {
    let line = raw.trim();
    if (/^<\/?(table|thead|tbody)>?/i.test(line)) continue;
    if (/^<tr>/i.test(line)) { row = []; continue; }
    if (/^<\/tr>/i.test(line)) {
      if (row && row.length) out.push(row.join(' | '));
      row = null; continue;
    }
    const cell = line.match(/^<t[dh][^>]*>(.*?)<\/t[dh]>$/i);
    if (cell) { if (row && cell[1].trim()) row.push(cell[1].trim()); continue; }
    if (/^<t[dh]/i.test(line)) { // multi-line cell open — rare; take text after tag
      const inner = line.replace(/^<t[dh][^>]*>/i, '').replace(/<\/t[dh]>$/i, '').trim();
      if (row && inner) row.push(inner);
      continue;
    }
    if (line.startsWith('>')) continue; // sidebars dropped (see CHAPTER_SECTIONS note)
    // See-also cross-references point at chapter names the AI can't follow.
    line = line.replace(/_?See also_?.*$/i, '').trim();
    line = line.replace(/\*\*(.+?)\*\*/g, '$1').replace(/_(.+?)_/g, '$1');
    out.push(line);
  }
  // Reflow: prose lines within a paragraph join with spaces; blank lines break
  // paragraphs; table rows (they contain " | ") keep their own line so tables
  // stay readable in the prompt.
  const paras = [];
  let cur = [];
  const flushPara = () => { if (cur.length) { paras.push(cur.join(' ')); cur = []; } };
  for (const line of out) {
    if (!line.trim()) { flushPara(); continue; }
    if (line.includes(' | ')) { flushPara(); paras.push(line); continue; }
    cur.push(line.trim());
  }
  flushPara();
  return paras.join('\n').trim();
}

// ---------------------------------------------------------------------------
// Parse the glossary: every "#### Term" section is one entry.
// ---------------------------------------------------------------------------
function parseGlossary(md) {
  const entries = [];
  const lines = md.split('\n');
  let name = null, buf = [];
  const flush = () => {
    if (!name) return;
    const content = cleanBlock(buf);
    if (content) entries.push({ rawName: name, content });
    name = null; buf = [];
  };
  for (const line of lines) {
    const h = line.match(/^#### (.+)$/);
    if (h) { flush(); name = h[1].trim(); continue; }
    if (/^#{1,3} /.test(line)) { flush(); continue; }
    if (name) buf.push(line);
  }
  flush();
  return entries;
}

function glossaryEntry({ rawName, content }) {
  const tagMatch = rawName.match(/^(.*?)\s*\[(.+)\]$/);
  const baseName = tagMatch ? tagMatch[1].trim() : rawName;
  const family = tagMatch ? tagMatch[2].trim() : null;
  let context = NAME_CONTEXT[baseName] || (family && FAMILY_CONTEXT[family]) || ['reference'];
  if (REFERENCE_ONLY.has(baseName)) context = ['reference'];
  // A couple of actions belong to more than their family default:
  if (rawName === 'Influence [Action]') context = ['social'];
  if (rawName === 'Search [Action]' || rawName === 'Study [Action]') context = ['combat', 'exploration'];
  if (rawName === 'Hide [Action]') context = ['combat', 'exploration'];
  if (rawName === 'Magic [Action]') context = ['combat', 'spellcasting'];
  return {
    name: rawName,
    type: family ? family.toLowerCase() : 'rule',
    source: 'SRD 5.2 — Rules Glossary',
    context,
    content,
  };
}

// ---------------------------------------------------------------------------
// Parse the chapter: extract allowlisted "## / ### Title" sections whole,
// flattening nested #### headings into inline labels.
// ---------------------------------------------------------------------------
function parseChapter(md) {
  const lines = md.split('\n');
  const sections = [];
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^(#{2,3}) (.+)$/);
    if (!h) continue;
    const title = h[2].trim();
    if (!CHAPTER_SECTIONS[title]) continue;
    const level = h[1].length;
    const buf = [];
    for (let j = i + 1; j < lines.length; j++) {
      const hh = lines[j].match(/^(#{2,3}) /);
      if (hh && hh[1].length <= level) break;
      const sub = lines[j].match(/^#### (.+)$/);
      buf.push(sub ? `${sub[1].trim()}:` : lines[j]);
    }
    const cfg = CHAPTER_SECTIONS[title];
    const content = cleanBlock(buf);
    if (content) sections.push({
      name: cfg.rename || title,
      type: 'procedure',
      source: 'SRD 5.2 — Playing the Game',
      context: cfg.contexts,
      content,
    });
  }
  return sections;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
const curated = JSON.parse(read('srd/curated-rules.json'));
const glossary = parseGlossary(read('srd/rules-glossary.md')).map(glossaryEntry);
const chapter = parseChapter(read('srd/playing-the-game.md'));

const keptCurated = curated.filter(e => !CURATED_SUPERSEDED.has(e.name));
const dropped = curated.filter(e => CURATED_SUPERSEDED.has(e.name)).map(e => e.name);

const all = [...keptCurated, ...glossary, ...chapter, ...MANUAL_ENTRIES];

// Sanity: unique names, known contexts, no leftover HTML.
const seen = new Set();
for (const e of all) {
  if (seen.has(e.name)) throw new Error(`duplicate rule name: ${e.name}`);
  seen.add(e.name);
  for (const c of e.context) if (!CONTEXTS.includes(c)) throw new Error(`${e.name}: unknown context ${c}`);
  if (/<t[dhr]|<table/i.test(e.content)) throw new Error(`${e.name}: unconverted HTML table`);
  if (!e.content.trim()) throw new Error(`${e.name}: empty content`);
}

writeFileSync(resolve(__dirname, '../data/rules.json'), JSON.stringify(all, null, 1));

// ---------------------------------------------------------------------------
// Coverage matrix — enforcement status is maintained here, next to the data
// it describes. Statuses: enforced / partial / gap / inject / reference.
// "enforced": code decides it. "partial": code covers part (note says what's
// missing). "gap": named enforce-candidate on the workboard. "inject": the AI
// is shown the rule at relevant moments (Law 2 caveat: knowing isn't obeying).
// "reference": Compendium/Ask-DM only, never injected.
// ---------------------------------------------------------------------------
const STATUS = {
  'Cover': ['enforced', 'RollBar adds target coverBonus to AC — PC-attacks-enemy path only (S69)'],
  'Resistance': ['enforced', 'damageMultiplier() halves (S54)'],
  'Vulnerability': ['enforced', 'damageMultiplier() doubles'],
  'Immunity': ['enforced', 'damageMultiplier() zeroes'],
  'Temporary Hit Points': ['enforced', 'absorb-first + take-max, cleared on long rest'],
  'Exhaustion [Condition]': ['enforced', 'RollBar -2/level (2024 rules)'],
  'Concentration': ['enforced', 'save auto-triggered on damage, DC max(10,floor(dmg/2)) cap 30; one spell at a time'],
  'Critical Hit': ['enforced', 'RollBar doubles dice on nat 20 (PC attacks)'],
  'Advantage': ['enforced', 'RollBar 2d20 take-higher'],
  'Disadvantage': ['enforced', 'RollBar 2d20 take-lower'],
  'Death Saving Throw': ['partial', 'death_save mechanic enforces 3&3/nat1/nat20; GAP: damage-at-0 from a crit counts 1 failure, not 2'],
  'Hit Point Dice': ['enforced', 'hit_dice_use rolls+heals in code (S68); long rest restores half'],
  'Short Rest': ['enforced', 'short_rest restores short-rest resources; hit dice via Spend button'],
  'Long Rest': ['enforced', 'long_rest: HP, slots, resources, half hit dice, -1 exhaustion'],
  'Hit Points': ['enforced', 'clamped 0..hpMax; massive damage = instant death (S54)'],
  'Blinded [Condition]': ['enforced', 'RollBar: disadvantage on attacks'],
  'Poisoned [Condition]': ['enforced', 'RollBar: disadvantage on checks/attacks, not saves'],
  'Frightened [Condition]': ['enforced', 'RollBar: disadvantage on checks/attacks'],
  'Restrained [Condition]': ['enforced', 'RollBar: disadvantage on attacks + DEX saves'],
  'Prone [Condition]': ['enforced', 'RollBar: disadvantage on own attacks'],
  'Invisible [Condition]': ['enforced', 'RollBar: advantage on own attacks'],
  'Paralyzed [Condition]': ['enforced', 'RollBar: auto-fail STR/DEX saves'],
  'Stunned [Condition]': ['enforced', 'RollBar: auto-fail STR/DEX saves'],
  'Unconscious [Condition]': ['enforced', 'RollBar: auto-fail STR/DEX saves'],
  'Petrified [Condition]': ['enforced', 'RollBar: auto-fail STR/DEX saves'],
  'Incapacitated [Condition]': ['partial', 'disadvantage on Initiative enforced; action denial is AI-narrated'],
  'Spell': ['partial', 'known-spell + slot spend enforced (Gate 6); spell EFFECTS are AI-adjudicated — Rules Depth arc item 3'],
  'Attack Roll': ['partial', 'PC-attacks-enemy fully code-resolved (S57); NPC-attacks-PC is AI-narrated — Rules Depth arc item 2'],
  'Surprise': ['gap', 'disadvantage on Initiative — untracked (S81)'],
  'Opportunity Attacks': ['gap', 'unenforced; Gate 2 only counts reaction verbs (S81)'],
  'Knocking Out a Creature': ['gap', 'reduce-to-1-HP-unconscious unmodeled (S81)'],
  'Stable': ['gap', 'Stable state + 1d4h-to-1-HP unmodeled (S81)'],
  'Bloodied': ['gap', 'trivial to surface at half HP (S81)'],
  'Travel Pace': ['gap', 'pace distances + Perception/Stealth effects — feeds World Integrity clock (S81)'],
  'Bright Light': ['gap', 'light levels untracked — this text is the "which checks need sight" data (S81)'],
  'Darkness': ['gap', 'see Bright Light'],
  'Dim Light': ['gap', 'see Bright Light'],
  'Jumping': ['gap', 'distances computable from STR/DEX — unmodeled (S81)'],
  'Grappling': ['gap', 'condition applied cosmetically; escape DC unenforced'],
  'Charmed [Condition]': ['gap', 'cosmetic only (S52 — no advantage-on-social enforcement)'],
  'Deafened [Condition]': ['gap', 'cosmetic only (S52)'],
  'Carrying Capacity': ['partial', 'ledger shows OVER CAPACITY; hard cap unenforced'],
  'Influence [Action]': ['gap', 'NPC disposition is freeform; align to Friendly/Indifferent/Hostile (S81)'],
};

function bucketOf(e) {
  if (STATUS[e.name]) return STATUS[e.name][0];
  return e.context.includes('reference') ? 'reference' : 'inject';
}

const ORDER = ['enforced', 'partial', 'gap', 'inject', 'reference'];
const LABEL = {
  enforced: '✅ Enforced — code decides it',
  partial: '◐ Partially enforced — note says what is missing',
  gap: '⚠ Enforce-candidate — named gap, on the workboard arcs',
  inject: '💬 Injected — AI is shown the rule at relevant moments (knowing ≠ obeying)',
  reference: '📖 Reference-only — Compendium/Ask-DM, never spends prompt tokens',
};
const rows = { enforced: [], partial: [], gap: [], inject: [], reference: [] };
for (const e of all) {
  rows[bucketOf(e)].push(`| ${e.name} | ${e.context.join(', ')} | ${STATUS[e.name]?.[1] || ''} |`);
}
const counts = ORDER.map(k => `${k}: ${rows[k].length}`).join(' · ');
const matrix = [
  '# Rules Coverage Matrix',
  '',
  `*Generated by \`scripts/build-rules.js\` — do not edit by hand; edit the STATUS map in the script.*`,
  `*${all.length} entries (${counts}). Sources: SRD 5.2 (CC-BY-4.0) + ${keptCurated.length} curated app entries.*`,
  `*Superseded curated entries removed by the build (several carried 2014-edition text): ${dropped.join(', ')}.*`,
  '',
  ...ORDER.flatMap(k => [
    `## ${LABEL[k]} (${rows[k].length})`,
    '',
    '| Rule | Contexts | Note |',
    '|---|---|---|',
    ...rows[k],
    '',
  ]),
].join('\n');
writeFileSync(resolve(__dirname, '../.claude/rules-coverage.md'), matrix);

const est = (t) => Math.ceil(t.length / 4);
const biggest = [...all].sort((a, b) => est(b.content) - est(a.content)).slice(0, 5)
  .map(e => `${e.name} (~${est(e.content)} tok)`);
console.log(`data/rules.json: ${all.length} entries (${keptCurated.length} curated + ${glossary.length} glossary + ${chapter.length} chapter + ${MANUAL_ENTRIES.length} manual)`);
console.log(`dropped superseded curated: ${dropped.length} — ${dropped.join(', ')}`);
console.log(`largest entries: ${biggest.join(', ')}`);
console.log('coverage matrix: .claude/rules-coverage.md');
