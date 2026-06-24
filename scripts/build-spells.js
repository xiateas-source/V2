#!/usr/bin/env node
// Parses SRD 5e spells.md into data/spells.json
// Run: node scripts/build-spells.js
// Input: scripts/srd/spells.md (download from github.com/downfallx/dnd-5e-srd-markdown)

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srdPath = resolve(__dirname, 'srd/spells.md');
const outPath = resolve(__dirname, '../data/spells.json');

const raw = readFileSync(srdPath, 'utf-8');
const lines = raw.split('\n');

const SKIP_HEADERS = new Set([
  'Spell Slots', 'Casting without Slots', 'Using a Higher-Level Spell Slot',
  'Animated Object', 'Actions'
]);

const spells = [];
let i = 0;

while (i < lines.length) {
  if (!lines[i].startsWith('#### ')) { i++; continue; }

  const name = lines[i].slice(5).trim();
  if (SKIP_HEADERS.has(name)) { i++; continue; }

  i++;
  // skip blank lines
  while (i < lines.length && lines[i].trim() === '') i++;

  // level/school/class line: _Level 2 Evocation (Wizard)_ or _Evocation Cantrip (Sorcerer, Wizard)_
  const metaLine = (lines[i] || '').trim();
  const metaMatch = metaLine.match(/^_(.+)_$/);
  if (!metaMatch) { i++; continue; }

  const metaText = metaMatch[1];

  let level, school, classes;

  // Check if it's a stat block line (creature type) — skip
  if (/Construct|Beast|Fiend|Celestial|Undead|Elemental|Fey|Aberration|Monstrosity|Ooze|Dragon|Giant|Humanoid|Plant/i.test(metaText)
      && !/Cantrip|Level \d/i.test(metaText)) {
    i++;
    continue;
  }

  const cantripMatch = metaText.match(/^(\w+)\s+Cantrip\s*\(([^)]+)\)$/);
  const levelMatch = metaText.match(/^Level\s+(\d+)\s+(\w+)\s*\(([^)]+)\)$/);

  if (cantripMatch) {
    level = 0;
    school = cantripMatch[1];
    classes = cantripMatch[2].split(',').map(c => c.trim().toLowerCase());
  } else if (levelMatch) {
    level = parseInt(levelMatch[1]);
    school = levelMatch[2];
    classes = levelMatch[3].split(',').map(c => c.trim().toLowerCase());
  } else {
    i++;
    continue;
  }

  i++;
  while (i < lines.length && lines[i].trim() === '') i++;

  // Parse metadata fields
  let castingTime = '', range = '', components = '', duration = '';

  const fieldParsers = [
    [/^\*\*Casting Time:\*\*\s*(.+)/, v => castingTime = v],
    [/^\*\*Range:\*\*\s*(.+)/, v => range = v],
    [/^\*\*Components:\*\*\s*(.+)/, v => components = v],
    [/^\*\*Duration:\*\*\s*(.+)/, v => duration = v],
  ];

  for (const [regex, setter] of fieldParsers) {
    if (i < lines.length) {
      const m = lines[i].trim().match(regex);
      if (m) { setter(m[1].trim()); i++; }
    }
  }

  while (i < lines.length && lines[i].trim() === '') i++;

  // Collect description until next #### header
  const descLines = [];
  while (i < lines.length && !lines[i].startsWith('#### ')) {
    descLines.push(lines[i]);
    i++;
  }

  // Clean description: strip markdown formatting, collapse whitespace
  let description = descLines.join('\n').trim();
  // Strip HTML tables (stat blocks etc)
  description = description.replace(/<table[\s\S]*?<\/table>/g, '');
  // Strip markdown emphasis
  description = description.replace(/\*\*([^*]+)\*\*/g, '$1');
  description = description.replace(/_([^_]+)_/g, '$1');
  // Collapse multiple newlines
  description = description.replace(/\n{3,}/g, '\n\n').trim();

  const ritual = /Ritual/i.test(castingTime);
  const concentration = /Concentration/i.test(duration);

  // Clean casting time (remove "or Ritual" suffix)
  if (ritual) castingTime = castingTime.replace(/\s*or\s+Ritual/i, '').trim();
  if (!castingTime) castingTime = 'Action';

  spells.push({
    name,
    level,
    school,
    castingTime,
    range,
    duration,
    components,
    description,
    ritual,
    concentration,
    classes,
    source: 'SRD'
  });
}

spells.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

writeFileSync(outPath, JSON.stringify(spells, null, 2) + '\n');
console.log(`Wrote ${spells.length} spells to ${outPath}`);

// Stats
const byLevel = {};
const byClass = {};
for (const s of spells) {
  byLevel[s.level] = (byLevel[s.level] || 0) + 1;
  for (const c of s.classes) byClass[c] = (byClass[c] || 0) + 1;
}
console.log('By level:', byLevel);
console.log('By class:', byClass);
