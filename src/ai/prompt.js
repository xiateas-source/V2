import { store } from '../state/index.js';
import { buildContracts } from './contracts.js';
import { buildRulesBlock } from './rules.js';
import { estimateTokens } from './providers.js';

export function genLedger(mode = 'compact') {
  const c = store.campaign;
  const lines = [];

  if (mode === 'compact') {
    lines.push('=== CAMPAIGN COMPACT STATE ===');
    lines.push(`Location: ${c.location || 'Unknown'} | Time: ${c.time || 'Unknown'} | Weather: ${c.weather || 'Clear'}`);
    lines.push('');

    for (const pc of c.characters) {
      const profBonus = Math.floor((pc.level - 1) / 4) + 2;
      const parts = [`${pc.name} (${pc.race} ${pc.class}${pc.subclass ? ` (${pc.subclass})` : ''} Lv${pc.level} Prof+${profBonus})`];
      parts.push(`HP ${pc.hp}/${pc.hpMax}`);
      parts.push(`AC ${pc.ac}`);

      if (pc.conditions.length > 0) {
        parts.push(`Conditions: ${pc.conditions.map(co => co.name || co).join(', ')}`);
      }
      if (pc.concentration) {
        parts.push(`Concentrating: ${pc.concentration.spell || pc.concentration}`);
      }
      if (pc.exhaustion > 0) {
        parts.push(`Exhaustion: ${pc.exhaustion}`);
      }

      const slotParts = [];
      for (const [lvl, max] of Object.entries(pc.spellSlots)) {
        const current = pc.currentSlots[lvl] ?? max;
        slotParts.push(`L${lvl}:${current}/${max}`);
      }
      if (slotParts.length) parts.push(`Slots: ${slotParts.join(' ')}`);

      const resParts = [];
      for (const r of pc.resources) {
        if (r.current < r.max) resParts.push(`${r.name}: ${r.current}/${r.max}`);
      }
      if (resParts.length) parts.push(resParts.join(', '));

      const hdAvail = pc.hitDice.total - pc.hitDice.used;
      if (hdAvail < pc.hitDice.total) parts.push(`HD: ${hdAvail}/${pc.hitDice.total}${pc.hitDice.die}`);

      if (pc.knownSpells?.length || pc.cantrips?.length) {
        const spells = [...(pc.cantrips || []), ...(pc.knownSpells || [])];
        parts.push(`Spells: ${spells.join(', ')}`);
      }

      if (pc.attacks?.length) {
        parts.push(`Attacks: ${pc.attacks.map(a => `${a.name}(+${a.bonus} ${a.damage})`).join(', ')}`);
      }

      if (pc.savingThrows?.length) {
        parts.push(`Save prof: ${pc.savingThrows.join(', ').toUpperCase()}`);
      }

      lines.push(parts.join(' | '));

      // PC carried inventory (brief)
      const pcCarried = c.inventory.carried[pc.id] || [];
      if (pcCarried.length) {
        const brief = pcCarried.map(i => i.name + (i.qty > 1 ? ` x${i.qty}` : '')).join(', ');
        lines.push(`  Carrying: ${brief}`);
      }
    }

    if (c.inventory.wagon.length > 0) {
      const notable = c.inventory.wagon.filter(i => i.type === 'potion' || i.type === 'wondrous' || i.type === 'weapon');
      if (notable.length) {
        lines.push(`Notable cargo: ${notable.map(i => i.name + (i.qty > 1 ? ` x${i.qty}` : '')).join(', ')}`);
      }
    }

    if (c.combatState.active) {
      lines.push('');
      lines.push(buildCombatBlock(c.combatState));
    }

    const { gp, sp, cp, pp, ep } = c.gold;
    const treasury = [pp && `PP ${pp}`, gp && `GP ${gp}`, ep && `EP ${ep}`, sp && `SP ${sp}`, cp && `CP ${cp}`].filter(Boolean).join(', ');
    if (treasury) lines.push(`Treasury: ${treasury}`);

    const activeQuests = c.quests.filter(q => q.status === 'active');
    if (activeQuests.length) {
      lines.push('');
      if (c.primaryMission) lines.push(`Main Quest: ${c.primaryMission}`);
      const sorted = [...activeQuests].sort((a, b) => (b.priority || 0) - (a.priority || 0));
      for (const q of sorted.slice(0, 5)) {
        lines.push(`  [Quest] ${q.text}`);
      }
    }

    const activeNpcs = c.npcs.filter(n => n.status === 'active' && n.lastSeen === c.location);
    if (activeNpcs.length) {
      lines.push(`NPCs present: ${activeNpcs.map(n => `${n.name} (${n.disposition})`).join(', ')}`);
    }

    lines.push('=== END COMPACT ===');
  } else {
    lines.push(`=== ${(c.name || 'CAMPAIGN').toUpperCase()} — CAMPAIGN STATE LEDGER ===`);
    lines.push('');
    lines.push('━━━ PARTY STATUS ━━━');
    for (const pc of c.characters) {
      lines.push(`${pc.name} (${pc.race} ${pc.class} Lv${pc.level}): HP ${pc.hp}/${pc.hpMax} AC ${pc.ac}`);
    }
    lines.push('');

    if (c.quests.length) {
      lines.push('━━━ QUESTS ━━━');
      if (c.primaryMission) lines.push(`Main Quest: ${c.primaryMission}`);
      for (const q of c.quests) lines.push(`[${q.status}] ${q.text}`);
      lines.push('');
    }

    if (c.npcs.length) {
      lines.push('━━━ NPCs ━━━');
      for (const n of c.npcs.filter(n => n.status === 'active')) {
        lines.push(`${n.name} (${n.disposition}) — ${n.details}`);
      }
      lines.push('');
    }

    if (c.consequences.filter(co => !co.resolved).length) {
      lines.push('━━━ ACTIVE CONSEQUENCES ━━━');
      for (const co of c.consequences.filter(co => !co.resolved)) {
        lines.push(`[${co.type}] ${co.text}`);
      }
      lines.push('');
    }

    lines.push('=== END LEDGER ===');
  }

  return lines.join('\n');
}

function buildCombatBlock(combat) {
  const lines = ['ACTIVE COMBAT — ROUND ' + combat.round];

  lines.push('Initiative order:');
  for (let i = 0; i < combat.initiative.length; i++) {
    const c = combat.initiative[i];
    const marker = i === combat.currentTurn ? '>>>' : '   ';
    const tag = c.type === 'pc' ? '[PC]' : '[NPC]';
    lines.push(`${marker} ${c.roll} ${c.name} ${tag} HP:${c.hp}/${c.hpMax} AC:${c.ac} Zone:${c.zone}`);
  }

  const byZone = {};
  for (const c of combat.initiative) {
    const zone = c.zone || 'front';
    if (!byZone[zone]) byZone[zone] = [];
    byZone[zone].push(c);
  }

  lines.push('Zone layout:');
  for (const [zone, combatants] of Object.entries(byZone)) {
    const zoneLabel = combat.zones[zone]?.label || zone.charAt(0).toUpperCase() + zone.slice(1);
    const effect = combat.zones[zone]?.terrain;
    lines.push(`  [${zoneLabel}]${effect ? ` (${effect})` : ''}`);
    for (const c of combatants) {
      lines.push(`    ${c.name}(${c.type === 'pc' ? 'PC' : 'NPC'}) HP:${c.hp}/${c.hpMax}`);
    }
  }

  return lines.join('\n');
}

export async function buildPrompt(contextInject = '') {
  const contracts = buildContracts();
  const ledger = genLedger('compact');

  const rulesBlock = await buildRulesBlock();

  const activeConsequences = store.campaign.consequences
    .filter(c => !c.resolved)
    .map(c => `- [${c.type}] ${c.text}${c.deadline ? ` (deadline: ${c.deadline})` : ''}`)
    .join('\n');

  const sections = [contracts];

  if (rulesBlock) {
    sections.push(rulesBlock);
  }

  if (activeConsequences) {
    sections.push(`ACTIVE CONSEQUENCES (track these — they have ongoing effects):\n${activeConsequences}`);
  }

  if (contextInject) {
    sections.push(contextInject);
  }

  sections.push(ledger);

  const prompt = sections.join('\n\n');
  return { prompt, tokens: estimateTokens(prompt) };
}

export function buildAskDmPrompt(question) {
  const ledger = genLedger('compact');
  const chars = store.campaign.characters
    .map(pc => `${pc.name}: ${pc.race} ${pc.class} Lv${pc.level}, HP ${pc.hp}/${pc.hpMax}`)
    .join('\n');

  return `Current situation:\n${ledger}\n\nCharacters:\n${chars}\n\nQuestion: ${question}`;
}
