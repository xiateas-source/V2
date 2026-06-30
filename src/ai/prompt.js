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
      parts.push(`HP ${pc.hp}/${pc.hpMax}${pc.hpTemp ? ` +${pc.hpTemp}tmp` : ''}`);
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
      if (pc.resistances?.length) {
        parts.push(`Resist: ${pc.resistances.join(', ')}`);
      }
      if (pc.vulnerabilities?.length) {
        parts.push(`Vulnerable: ${pc.vulnerabilities.join(', ')}`);
      }
      if (pc.immunities?.length) {
        parts.push(`Immune: ${pc.immunities.join(', ')}`);
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

      const pcCarried = c.inventory.carried[pc.id] || [];
      if (pcCarried.length) {
        const brief = pcCarried.map(i => i.name + (i.qty > 1 ? ` x${i.qty}` : '')).join(', ');
        const totalWt = pcCarried.reduce((s, i) => s + (Number(i.weight) || 0) * (Number(i.qty) || 1), 0);
        const str = pc.abilityScores?.str || 10;
        const cap = str * 15;
        const wtTag = totalWt > 0 ? ` [${totalWt}/${cap}lb]` : '';
        const encTag = totalWt > cap ? ' OVER CAPACITY' : '';
        lines.push(`  Carrying${wtTag}: ${brief}${encTag}`);
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
  // initiative is stored already sorted (highest roll first); currentTurn
  // indexes it directly — same index the UI and turn engine use.
  const init = combat.initiative;
  const awaiting = init.some(c => c.rollPending);
  const current = init[combat.currentTurn];
  const lines = [];

  if (awaiting) {
    lines.push(`COMBAT STARTING — ROUND ${combat.round}. The players are rolling for initiative.`);
  } else {
    lines.push(`ACTIVE COMBAT — ROUND ${combat.round} — ${current?.name || 'Unknown'}'s turn`);
  }

  lines.push('Initiative order:');
  for (let i = 0; i < init.length; i++) {
    const c = init[i];
    const marker = i === combat.currentTurn && !awaiting ? '>>>' : '   ';
    const tag = c.type === 'pc' ? '[PC]' : '[NPC]';
    const dead = c.hp <= 0 ? ' [DOWN]' : '';
    const roll = c.rollPending ? '??' : c.roll;
    lines.push(`${marker} ${roll} ${c.name} ${tag} HP:${c.hp}/${c.hpMax} AC:${c.ac} Zone:${c.zone}${dead}`);
  }

  const byZone = {};
  for (const c of init) {
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

  lines.push('');
  if (awaiting) {
    lines.push('TURN STRUCTURE: Do NOT resolve any turns yet. Set the scene, build tension, and wait for the initiative order to be rolled. No combatant acts until initiative is set.');
  } else {
    lines.push('TURN STRUCTURE (the app enforces turn order — follow it exactly):');
    if (current?.type === 'pc') {
      lines.push(`- It is ${current.name}'s turn — a PLAYER CHARACTER. The player has declared their action; resolve ONLY the action the player stated for ${current.name}.`);
    } else if (current) {
      lines.push(`- It is ${current.name}'s turn — an NPC/enemy. Roll its dice yourself and narrate its turn.`);
    }
    lines.push('- After the current actor, continue in initiative order, rolling dice yourself for every NPC/enemy, until you reach the NEXT player character. Then STOP and state that it is their turn.');
    lines.push('- NEVER declare, resolve, or invent an action for a player character the player did not direct. NEVER skip or advance past a player character. The app moves the turn pointer.');
  }

  return lines.join('\n');
}

function buildOOCContext() {
  const ooc = store.campaign.ooc;
  if (!ooc || ooc.length === 0) return '';
  const recent = ooc.slice(-6);
  const exchanges = recent
    .filter(m => (m.type === 'player' || m.role === 'user') && m.content)
    .map(m => m.content.length > 80 ? m.content.slice(0, 80) + '...' : m.content);
  if (!exchanges.length) return '';
  return `[RECENT OOC — player discussed these topics off-screen; do not repeat unless acted upon]\n${exchanges.join('\n')}`;
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

  const oocContext = buildOOCContext();
  if (oocContext) {
    sections.push(oocContext);
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
