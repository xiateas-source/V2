import { store, aiSet } from '../state/index.js';

let pendingConcentrationDrops = [];
let pendingConcentrationSaves = [];

export function getPendingConcentrationInfo() {
  const drops = [...pendingConcentrationDrops];
  const saves = [...pendingConcentrationSaves];
  pendingConcentrationDrops = [];
  pendingConcentrationSaves = [];
  return { drops, saves };
}

const KNOWN_KEYS = new Set([
  'hp', 'hp_max', 'conditions', 'concentration', 'location', 'time', 'weather',
  'travel_note', 'loc_desc', 'gp', 'sp', 'cp', 'ep', 'pp', 'item_add', 'item_remove',
  'slot_use', 'slot_restore', 'resource_use', 'resource_restore', 'shell_defense',
  'wagon_add', 'wagon_cell_add', 'wagon_cell_update', 'wagon_cell_remove',
  'wagon_hp', 'ox_hp', 'ox_condition', 'familiar_hp', 'familiar_add', 'familiar_update',
  'animal_hp', 'animal_condition',
  'income', 'expense', 'xp', 'quest_add', 'quest_done', 'quest_fail', 'quest_update',
  'primary_mission', 'npc_add', 'npc_mood', 'pc_update', 'pc_add', 'pc_delete',
  'module_episode', 'short_rest', 'long_rest', 'town_rep', 'save_game', 'save', 'spell_add',
  'sp_charge', 'consequence_add', 'consequence_resolve', 'chapter_add',
  'chapter_update', 'location_add', 'location_visit', 'location_history',
  'location_investment', 'roll_request', 'zone_move', 'zone_add_enemy', 'zone_remove',
  'zone_effect', 'zone_label', 'combat_start', 'combat_end', 'zone_fog',
  'death_save', 'none', 'round_advance', 'hit_dice_use', 'inspiration', 'temp_hp',
  'resistance_add', 'resistance_remove', 'vulnerability_add', 'vulnerability_remove',
  'immunity_add', 'immunity_remove',
]);

function findPC(name) {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  return store.campaign.characters.find(pc =>
    pc.name.toLowerCase() === lower ||
    pc.name.toLowerCase().startsWith(lower) ||
    lower.startsWith(pc.name.toLowerCase().split(' ')[0])
  ) || null;
}

function findPCIndex(name) {
  if (!name) return -1;
  const lower = name.toLowerCase().trim();
  return store.campaign.characters.findIndex(pc =>
    pc.name.toLowerCase() === lower ||
    pc.name.toLowerCase().startsWith(lower) ||
    lower.startsWith(pc.name.toLowerCase().split(' ')[0])
  );
}

function preprocess(text) {
  let cleaned = text.replace(/\*\*/g, '').replace(/\*/g, '');
  cleaned = cleaned.replace(/\[([a-z_]+:\s*[^\]]+)\]/g, '$1');
  return cleaned;
}

export function extractMechanics(response) {
  const cleaned = preprocess(response);
  let block = '';

  const patterns = [
    /---MECHANICS---\n?([\s\S]*?)---END---/i,
    /MECHANICS BLOCK:\n?([\s\S]*?)---END---/i,
    /MECHANICS BLOCK:\n?([\s\S]*?)(?=\n\n[A-Z])/i,
    /---MECHANICS---\n?([\s\S]*?)$/i,
    /MECHANICS:\n?([\s\S]*?)(?:---END---|$)/i,
  ];

  for (const pat of patterns) {
    const match = cleaned.match(pat);
    if (match) { block = match[1]; break; }
  }

  if (!block) {
    const lines = cleaned.split('\n');
    const naked = lines.filter(line => {
      const m = line.match(/^\s*[-*•]?\s*([a-z_]+)\s*:\s*(.+)/i);
      return m && KNOWN_KEYS.has(m[1].toLowerCase());
    });
    block = naked.join('\n');
  }

  if (!block.trim()) return [];

  const rawLines = block.split('\n')
    .map(l => l.replace(/^\s*[-*•]\s*/, '').trim())
    .filter(Boolean);

  const expanded = [];
  for (const line of rawLines) {
    if (line.includes('|') && !line.includes('|') === false) {
      const pipeSplit = line.split(/\s*\|\s*/);
      if (pipeSplit.length > 1 && pipeSplit.every(p => /^[a-z_]+\s*:/i.test(p))) {
        expanded.push(...pipeSplit);
        continue;
      }
    }
    expanded.push(line);
  }

  const parsed = [];
  for (const line of expanded) {
    const match = line.match(/^([a-z_]+)\s*:\s*(.+)/i);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (!KNOWN_KEYS.has(key)) continue;
    if (value === 'none' || value === '0' || value.startsWith('0,')) continue;
    parsed.push({ key, value, target: '', applied: false });
  }

  return parsed;
}

export function validateMechanics(mechanics) {
  const valid = [];
  const rejected = [];

  // Batch-level rule: if combat_start is in this batch, reject any hp changes
  // for PCs. The AI must set the scene and wait — no resolving attacks before
  // initiative is rolled.
  const hasCombatStart = mechanics.some(m => m.key === 'combat_start');

  for (const mech of mechanics) {
    let reason = checkRejection(mech);
    if (!reason && hasCombatStart && mech.key === 'hp') {
      const entries = mech.value.split(',').map(e => e.split('=')[0].trim());
      if (entries.some(n => findPC(n))) {
        reason = 'PC HP change rejected — combat just started, resolve attacks after initiative';
      }
    }
    if (reason) {
      rejected.push({ ...mech, reason });
    } else {
      valid.push(mech);
    }
  }

  return { valid, rejected };
}

function checkRejection(mech) {
  if (mech.key === 'concentration') {
    const [name, spell] = mech.value.split('=').map(s => s.trim());
    if (spell && spell.toLowerCase() !== 'none') {
      const pc = findPC(name);
      if (pc) {
        const allSpells = [...(pc.cantrips || []), ...(pc.knownSpells || [])];
        const known = allSpells.some(s => s.toLowerCase() === spell.toLowerCase());
        if (!known && allSpells.length > 0) {
          mech._warning = `${pc.name} may not know ${spell}`;
        }
      }
    }
  }
  if (mech.key === 'combat_start' && store.campaign.combatState.active) {
    return 'Combat already active';
  }
  if (mech.key === 'zone_add_enemy') {
    const name = mech.value.split('|')[0]?.trim();
    if (store.campaign.combatState.initiative.some(c => c.name.toLowerCase() === name?.toLowerCase())) {
      return `${name} already in combat`;
    }
  }
  if (mech.key === 'roll_request') {
    // Law 2: the DM rolls for NPCs/enemies itself. A roll_request must target a
    // player character — anything else is rejected so it never reaches the roll
    // bar. (Party-wide rolls and the player's own creatures are allowed.)
    const parts = mech.value.split('|').map(s => s.trim());
    const target = (parts[2] || '').replace(/\s*\(.*\)$/, '');
    const lower = target.toLowerCase();
    const isPartyWide = lower === 'party' || lower === 'all' || lower === '';
    if (!isPartyWide && !findPC(target)) {
      return `roll_request target "${target}" is not a player character — the DM rolls for NPCs/enemies`;
    }
  }
  if (['income', 'gp', 'sp', 'cp', 'ep', 'pp'].includes(mech.key) && /xp/i.test(mech.value)) {
    return 'XP is not currency';
  }
  if (mech.key === 'hp_max') {
    return 'hp_max is system-owned — only the level-up wizard can change it';
  }
  if (mech.key === 'spell_add') {
    return 'Spells are system-owned — added via level-up wizard or scribing only';
  }
  if (mech.key === 'expense') {
    const amount = parseInt(mech.value.split(',')[0], 10) || 0;
    if (amount > store.campaign.gold.gp) {
      mech._warning = `Expense ${amount}gp exceeds treasury (${store.campaign.gold.gp}gp)`;
    }
  }
  if (mech.key === 'item_add') {
    const parts = mech.value.split(',').map(s => s.trim());
    const attunement = parts[3] || parts[2] || '';
    if (attunement.toLowerCase() === 'attuned') {
      const pcName = parts[0];
      const pcIdx = findPCIndex(pcName);
      if (pcIdx >= 0) {
        const pcId = store.campaign.characters[pcIdx].id;
        const carried = store.campaign.inventory.carried[pcId] || [];
        const attuned = carried.filter(i => i.attunement === 'attuned').length;
        if (attuned >= 3) {
          mech._warning = `${pcName} already has 3 attuned items (max)`;
        }
      }
    }
  }
  if (mech.key === 'slot_use') {
    const [name, levelStr] = mech.value.split('=').map(s => s.trim());
    const idx = findPCIndex(name);
    if (idx >= 0) {
      const current = store.campaign.characters[idx].currentSlots[levelStr] || 0;
      if (current <= 0) return `${name} has no level ${levelStr} slots remaining`;
    }
  }
  if (mech.key === 'pc_update' || mech.key === 'pc_add' || mech.key === 'pc_delete') {
    return 'PC structure is system-owned — use character wizard';
  }
  if (mech.key === 'item_add') {
    const parts = mech.value.split(',').map(s => s.trim());
    const pcIdx = findPCIndex(parts[0]);
    const STORAGE_TARGETS = ['wagon', 'cargo', 'hoard', 'party'];
    const isStorage = STORAGE_TARGETS.includes(parts[0].toLowerCase());
    if (!pcIdx && pcIdx !== 0 && !isStorage && parts.length >= 3) {
      const looksLikePcName = /^[A-Z][a-z]/.test(parts[0]) && parts[0].split(' ').length <= 3;
      if (looksLikePcName && findPCIndex(parts[0]) === -1) {
        mech._warning = `PC "${parts[0]}" not found — item goes to wagon`;
      }
    }
  }
  return null;
}

export function applyMechanics(mechanics) {
  const results = [];

  for (const mech of mechanics) {
    try {
      dispatch(mech);
      mech.applied = true;
      results.push(mech);
    } catch (e) {
      mech.applied = false;
      mech.error = e.message;
      results.push(mech);
    }
  }

  return results;
}

export function confirmLocation() {
  const pending = store.campaign.pendingLocation;
  if (!pending) return;
  aiSet('location', pending.value);
  aiSet('travelLog', [...store.campaign.travelLog, { from: pending.from, to: pending.value, note: '', gameTs: store.campaign.time }]);
  aiSet('pendingLocation', null);
}

export function rejectLocation() {
  aiSet('pendingLocation', null);
}

function dispatch(mech) {
  const handler = DISPATCH[mech.key];
  if (handler) handler(mech.value);
}

function parseHpEntries(value) {
  return value.split(',').map(entry => {
    const [name, val] = entry.split('=').map(s => s.trim());
    return { name, value: parseInt(val, 10) };
  }).filter(e => !isNaN(e.value));
}

const DISPATCH = {
  hp(value) {
    for (const { name, value: hp } of parseHpEntries(value)) {
      const idx = findPCIndex(name);
      if (idx === -1) {
        if (store.campaign.combatState.active) {
          const initIdx = store.campaign.combatState.initiative.findIndex(
            c => c.name.toLowerCase() === name.toLowerCase().trim()
          );
          if (initIdx >= 0) {
            const c = store.campaign.combatState.initiative[initIdx];
            const clamped = Math.max(0, Math.min(hp, c.hpMax));
            aiSet(`combatState.initiative.${initIdx}.hp`, clamped);
          }
        }
        continue;
      }
      const pc = store.campaign.characters[idx];
      const rawDamage = pc.hp - hp;

      if (rawDamage > 0 && pc.hpTemp > 0) {
        const tempAbsorb = Math.min(pc.hpTemp, rawDamage);
        const remainingDamage = rawDamage - tempAbsorb;
        aiSet(`characters.${idx}.hpTemp`, pc.hpTemp - tempAbsorb);
        const newHp = Math.max(0, pc.hp - remainingDamage);
        aiSet(`characters.${idx}.hp`, newHp);
        if (remainingDamage > 0 && pc.concentration) {
          const dc = Math.max(10, Math.floor(rawDamage / 2));
          pendingConcentrationSaves.push({ pc: pc.name, spell: pc.concentration.spell, dc });
        }
      } else {
        const clamped = Math.max(0, Math.min(hp, pc.hpMax));
        aiSet(`characters.${idx}.hp`, clamped);
        if (rawDamage > 0 && pc.concentration) {
          const dc = Math.max(10, Math.floor(rawDamage / 2));
          pendingConcentrationSaves.push({ pc: pc.name, spell: pc.concentration.spell, dc });
        }
      }

      const finalHp = store.campaign.characters[idx].hp;
      if (store.campaign.combatState.active) {
        const initIdx = store.campaign.combatState.initiative.findIndex(
          c => c.name.toLowerCase() === pc.name.toLowerCase()
        );
        if (initIdx >= 0) {
          aiSet(`combatState.initiative.${initIdx}.hp`, finalHp);
        }
      }
    }
  },

  hp_max() {},

  conditions(value) {
    const match = value.match(/^(.+?)([+-=])(.+)$/);
    if (!match) return;
    const [, name, op, condition] = match.map(s => s?.trim());
    const idx = findPCIndex(name);
    if (idx === -1) return;
    const current = [...store.campaign.characters[idx].conditions];
    if (op === '-') {
      const filtered = current.filter(c => (c.name || c).toLowerCase() !== condition.toLowerCase());
      aiSet(`characters.${idx}.conditions`, filtered);
    } else {
      if (!current.some(c => (c.name || c).toLowerCase() === condition.toLowerCase())) {
        aiSet(`characters.${idx}.conditions`, [...current, { name: condition, duration: null }]);
      }
    }
  },

  concentration(value) {
    const [name, spell] = value.split('=').map(s => s.trim());
    const idx = findPCIndex(name);
    if (idx === -1) return;
    if (spell.toLowerCase() === 'none') {
      aiSet(`characters.${idx}.concentration`, null);
    } else {
      const pc = store.campaign.characters[idx];
      if (pc.concentration && pc.concentration.spell) {
        pendingConcentrationDrops.push({ pc: pc.name, dropped: pc.concentration.spell, newSpell: spell });
      }
      aiSet(`characters.${idx}.concentration`, { spell, since: store.campaign.combatState.round || '' });
    }
  },

  location(value) {
    const newLoc = value.trim();
    const prev = store.campaign.location;
    if (prev && prev.toLowerCase() !== newLoc.toLowerCase()) {
      aiSet('pendingLocation', { value: newLoc, from: prev, ts: Date.now() });
    } else {
      aiSet('location', newLoc);
    }
  },

  time(value) { aiSet('time', value.trim()); },
  weather(value) { aiSet('weather', value.trim()); },
  loc_desc(value) { aiSet('locDesc', value.trim()); },
  primary_mission(value) { aiSet('primaryMission', value.trim()); },

  travel_note(value) {
    const log = [...store.campaign.travelLog];
    if (log.length) {
      log[log.length - 1] = { ...log[log.length - 1], note: (log[log.length - 1].note || '') + '\n' + value.trim() };
      aiSet('travelLog', log);
    }
  },

  gp(value) { applyCurrency('gp', value); },
  sp(value) { applyCurrency('sp', value); },
  cp(value) { applyCurrency('cp', value); },
  ep(value) { applyCurrency('ep', value); },
  pp(value) { applyCurrency('pp', value); },

  income(value) {
    const parts = value.split(',').map(s => s.trim());
    const amount = parseInt(parts[0], 10) || 0;
    const category = parts[1] || 'misc';
    const desc = parts.slice(2).join(', ') || '';
    aiSet('gold.gp', Math.max(0, store.campaign.gold.gp + amount));
    aiSet('incomeLog', [...store.campaign.incomeLog, { amount, category, desc, gameTs: store.campaign.time }]);
  },

  expense(value) {
    const parts = value.split(',').map(s => s.trim());
    const amount = parseInt(parts[0], 10) || 0;
    const desc = parts.slice(1).join(', ') || '';
    aiSet('gold.gp', Math.max(0, store.campaign.gold.gp - amount));
    aiSet('expenseLog', [...store.campaign.expenseLog, { amount, desc, gameTs: store.campaign.time }]);
  },

  xp(value) {
    const match = value.match(/^(.+?)\+(\d+)$/);
    if (!match) return;
    const [, target, amtStr] = match;
    const amount = parseInt(amtStr, 10);
    if (target.toLowerCase() === 'party') {
      store.campaign.characters.forEach((pc, idx) => {
        aiSet(`characters.${idx}.xp`, pc.xp + amount);
      });
    } else {
      const idx = findPCIndex(target);
      if (idx === -1) return;
      aiSet(`characters.${idx}.xp`, store.campaign.characters[idx].xp + amount);
    }
  },

  quest_add(value) {
    const [text, notes = '', location = ''] = value.split('|').map(s => s.trim());
    const prefix = text.substring(0, 30).toLowerCase();
    if (store.campaign.quests.some(q => q.text.substring(0, 30).toLowerCase() === prefix)) return;
    aiSet('quests', [...store.campaign.quests, {
      id: 'qst_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      text, status: 'active', location: location || store.campaign.location, giverNpc: '', notes,
      chatMsgId: '', discovery: { text: '', ts: new Date().toISOString() },
      gameTs: store.campaign.time, priority: 0,
    }]);
  },

  quest_done(value) {
    const lower = value.trim().toLowerCase();
    const quests = store.campaign.quests.map(q =>
      q.text.toLowerCase().includes(lower) || lower.includes(q.text.substring(0, 20).toLowerCase())
        ? { ...q, status: 'done' } : q
    );
    aiSet('quests', quests);
  },

  quest_fail(value) {
    const lower = value.trim().toLowerCase();
    const quests = store.campaign.quests.map(q =>
      q.text.toLowerCase().includes(lower) || lower.includes(q.text.substring(0, 20).toLowerCase())
        ? { ...q, status: 'failed' } : q
    );
    aiSet('quests', quests);
  },

  quest_update(value) {
    const [name, ...rest] = value.split('|');
    const notes = rest.join('|').trim();
    const lower = name.trim().toLowerCase();
    const quests = store.campaign.quests.map(q =>
      q.text.toLowerCase().includes(lower)
        ? { ...q, notes: (q.notes ? q.notes + '\n' : '') + notes } : q
    );
    aiSet('quests', quests);
  },

  npc_add(value) {
    const parts = value.split(',').map(s => s.trim());
    const name = parts[0] || '';
    const disposition = parts[1] || 'Unknown';
    const details = parts.slice(2).join(', ') || '';
    const lower = name.toLowerCase();
    const existing = store.campaign.npcs.findIndex(n => {
      const nLower = n.name.toLowerCase();
      return nLower === lower || nLower.startsWith(lower) || lower.startsWith(nLower.split(' ')[0]);
    });
    if (existing >= 0) {
      aiSet(`npcs.${existing}`, { ...store.campaign.npcs[existing], disposition, details, lastSeen: store.campaign.location });
    } else {
      aiSet('npcs', [...store.campaign.npcs, {
        id: 'npc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name, disposition, details, status: 'active', hp: null,
        lastSeen: store.campaign.location, firstSeen: store.campaign.location,
        race: '', role: '', gameTs: store.campaign.time,
      }]);
    }
  },

  npc_mood(value) {
    const [name, mood] = value.split('=').map(s => s.trim());
    const idx = store.campaign.npcs.findIndex(n => n.name.toLowerCase() === name.toLowerCase());
    if (idx >= 0) aiSet(`npcs.${idx}.disposition`, mood);
  },

  consequence_add(value) {
    const [text, deadline = '', details = ''] = value.split('|').map(s => s.trim());
    const words = text.toLowerCase().split(/\s+/);
    const isDupe = store.campaign.consequences.some(c => {
      const cWords = c.text.toLowerCase().split(/\s+/);
      const overlap = words.filter(w => cWords.includes(w)).length;
      return overlap / Math.max(words.length, 1) > 0.6;
    });
    if (isDupe) return;
    aiSet('consequences', [...store.campaign.consequences, {
      id: 'csq_' + Date.now(), text, type: 'deadline', resolved: false, resolvedTs: null,
      gameTs: store.campaign.time, location: store.campaign.location,
      deadline: deadline || null, details: details || '', _ripple: false,
    }]);
  },

  consequence_resolve(value) {
    const lower = value.trim().toLowerCase();
    const consequences = store.campaign.consequences.map(c =>
      c.text.toLowerCase().includes(lower) && !c.resolved
        ? { ...c, resolved: true, resolvedTs: new Date().toISOString() } : c
    );
    aiSet('consequences', consequences);
  },

  chapter_add(value) {
    const [title, ...rest] = value.split('|');
    const content = rest.join('|').trim();
    aiSet('chapters', [...store.campaign.chapters, {
      id: Date.now(), title: title.trim(), content, gameTs: store.campaign.time,
    }]);
  },

  chapter_update(value) {
    const [title, ...rest] = value.split('|');
    const content = rest.join('|').trim();
    const lower = title.trim().toLowerCase();
    const chapters = store.campaign.chapters.map(ch =>
      ch.title.toLowerCase().includes(lower)
        ? { ...ch, content } : ch
    );
    aiSet('chapters', chapters);
  },

  town_rep(value) {
    const parts = value.split(',').map(s => s.trim());
    const town = parts[0]; const status = parts[1] || 'neutral'; const notes = parts.slice(2).join(', ');
    const existing = store.campaign.townReputation.findIndex(t => t.town.toLowerCase() === town.toLowerCase());
    if (existing >= 0) {
      const prev = store.campaign.townReputation[existing];
      const history = [...(prev.history || []), { status: prev.status, notes: prev.notes, gameTs: prev.gameTs }];
      aiSet(`townReputation.${existing}`, { ...prev, status, notes, gameTs: store.campaign.time, history });
    } else {
      aiSet('townReputation', [...store.campaign.townReputation, {
        town, status, notes, gameTs: store.campaign.time, history: [],
      }]);
    }
    if (['burned', 'fled'].includes(status.toLowerCase())) {
      DISPATCH.consequence_add(`Word of the incident in ${town} is spreading. Reputation affected.|faction`);
    }
  },

  location_add(value) {
    const [name, type = 'waypoint', ...desc] = value.split('|').map(s => s.trim());
    const description = desc.join('|');
    const existing = store.campaign.locations.findIndex(l => l.name.toLowerCase() === name.toLowerCase());
    if (existing >= 0) {
      aiSet(`locations.${existing}.type`, type);
      if (description) aiSet(`locations.${existing}.history`,
        [...store.campaign.locations[existing].history, { gameTs: store.campaign.time, text: description, dmOnly: false }]);
    } else {
      aiSet('locations', [...store.campaign.locations, {
        id: 'loc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name, type, status: 'undiscovered', firstVisited: '', lastVisited: '',
        rep: { disposition: '', notes: '' }, npcs: [], investments: [],
        history: description ? [{ gameTs: store.campaign.time, text: description, dmOnly: false }] : [],
        dmNotes: '', playerNotes: '', mapPos: null,
      }]);
    }
  },

  location_visit(value) {
    const name = value.trim();
    const idx = store.campaign.locations.findIndex(l => l.name.toLowerCase() === name.toLowerCase());
    if (idx >= 0) {
      aiSet(`locations.${idx}.status`, 'visited');
      aiSet(`locations.${idx}.lastVisited`, store.campaign.time);
      if (!store.campaign.locations[idx].firstVisited) {
        aiSet(`locations.${idx}.firstVisited`, store.campaign.time);
      }
    }
  },

  location_history(value) {
    const parts = value.split('|').map(s => s.trim());
    const name = parts[0]; const text = parts[1] || ''; const dmOnly = parts[2] === 'true';
    const idx = store.campaign.locations.findIndex(l => l.name.toLowerCase() === name.toLowerCase());
    if (idx >= 0) {
      aiSet(`locations.${idx}.history`,
        [...store.campaign.locations[idx].history, { gameTs: store.campaign.time, text, dmOnly }]);
    }
  },

  location_investment(value) {
    const [name, desc, amountStr] = value.split('|').map(s => s.trim());
    const amount = parseInt(amountStr, 10) || 0;
    const idx = store.campaign.locations.findIndex(l => l.name.toLowerCase() === name.toLowerCase());
    if (idx >= 0) {
      aiSet(`locations.${idx}.investments`,
        [...store.campaign.locations[idx].investments, { desc, amount, gameTs: store.campaign.time, notes: '' }]);
    }
  },

  item_add(value) {
    const parts = value.split(',').map(s => s.trim());
    const pcIdx = findPCIndex(parts[0]);
    const STORAGE_TARGETS = ['wagon', 'cargo', 'hoard', 'party'];
    const isStorage = STORAGE_TARGETS.includes(parts[0].toLowerCase());
    let target, name, type, attunement, weightStr;
    if (pcIdx >= 0) {
      target = parts[0];
      name = parts[1] || 'item';
      type = parts[2] || 'item';
      attunement = parts[3] || 'none';
      weightStr = parts[4];
    } else if (isStorage) {
      target = parts[0].toLowerCase();
      name = parts[1] || 'item';
      type = parts[2] || 'item';
      attunement = parts[3] || 'none';
      weightStr = parts[4];
    } else {
      target = 'wagon';
      name = parts[0] || 'item';
      type = parts[1] || 'item';
      attunement = parts[2] || 'none';
      weightStr = parts[3];
    }
    const weight = parseFloat(weightStr) || 0;
    const item = { name, qty: 1, type, attunement, weight };

    if (target === 'wagon' || target === 'cargo') {
      aiSet('inventory.wagon', [...store.campaign.inventory.wagon, item]);
    } else if (target === 'hoard') {
      aiSet('inventory.hoard', [...store.campaign.inventory.hoard, item]);
    } else if (target === 'party') {
      aiSet('inventory.wagon', [...store.campaign.inventory.wagon, item]);
    } else {
      const pc = findPC(target);
      const key = pc ? pc.id : 'party';
      const carried = { ...store.campaign.inventory.carried };
      carried[key] = [...(carried[key] || []), item];
      aiSet('inventory.carried', carried);
    }
  },

  item_remove(value) {
    const parts = value.split(',').map(s => s.trim());
    const pcIdx = findPCIndex(parts[0]);
    let target, name, qty;
    if (pcIdx >= 0) {
      target = parts[0];
      name = parts[1];
      qty = parseInt(parts[2], 10) || 1;
    } else {
      target = parts[0]?.toLowerCase() || 'wagon';
      name = parts[1];
      qty = parseInt(parts[2], 10) || 1;
    }
    const lower = name?.toLowerCase();
    if (!lower) return;

    function removeFrom(arr) {
      const idx = arr.findIndex(i => i.name.toLowerCase().includes(lower));
      if (idx === -1) return arr;
      const updated = [...arr];
      if (updated[idx].qty <= qty) { updated.splice(idx, 1); }
      else { updated[idx] = { ...updated[idx], qty: updated[idx].qty - qty }; }
      return updated;
    }

    if (target === 'wagon' || target === 'cargo' || target === 'party') {
      aiSet('inventory.wagon', removeFrom(store.campaign.inventory.wagon));
    } else if (target === 'hoard') {
      aiSet('inventory.hoard', removeFrom(store.campaign.inventory.hoard));
    } else if (pcIdx >= 0) {
      const pc = store.campaign.characters[pcIdx];
      const key = pc.id;
      const carried = { ...store.campaign.inventory.carried };
      carried[key] = removeFrom(carried[key] || []);
      aiSet('inventory.carried', carried);
    }
  },

  slot_use(value) {
    const [name, levelStr] = value.split('=').map(s => s.trim());
    const idx = findPCIndex(name);
    if (idx === -1) return;
    const current = store.campaign.characters[idx].currentSlots[levelStr];
    if (current > 0) {
      aiSet(`characters.${idx}.currentSlots.${levelStr}`, current - 1);
    }
  },

  slot_restore(value) {
    const [name, levelStr] = value.split('=').map(s => s.trim());
    const idx = findPCIndex(name);
    if (idx === -1) return;
    if (levelStr.toLowerCase() === 'all') {
      const pc = store.campaign.characters[idx];
      aiSet(`characters.${idx}.currentSlots`, { ...pc.spellSlots });
    } else {
      const max = store.campaign.characters[idx].spellSlots[levelStr] || 0;
      aiSet(`characters.${idx}.currentSlots.${levelStr}`, max);
    }
  },

  resource_use(value) {
    const [name, resName] = value.split(',').map(s => s.trim());
    const idx = findPCIndex(name);
    if (idx === -1) return;
    const pc = store.campaign.characters[idx];
    const resIdx = pc.resources.findIndex(r => r.name.toLowerCase().includes(resName.toLowerCase()));
    if (resIdx >= 0 && pc.resources[resIdx].current > 0) {
      aiSet(`characters.${idx}.resources.${resIdx}.current`, pc.resources[resIdx].current - 1);
    }
  },

  resource_restore(value) {
    const [name, target] = value.split('=').map(s => s.trim());
    const idx = findPCIndex(name);
    if (idx === -1) return;
    if (target.toLowerCase() === 'all') {
      const pc = store.campaign.characters[idx];
      pc.resources.forEach((r, resIdx) => {
        aiSet(`characters.${idx}.resources.${resIdx}.current`, r.max);
      });
    }
  },

  combat_start(value) {
    const pcEntries = store.campaign.characters.map(pc => ({
      name: pc.name, roll: 0, type: 'pc', rollPending: true,
      hp: pc.hp, hpMax: pc.hpMax, ac: pc.ac, zone: 'front',
    }));
    aiSet('combatState', {
      active: true, round: 1, initiative: pcEntries, currentTurn: 0,
      actionsUsed: { action: false, bonus: false, reaction: false, movement: false },
      zones: { front: { label: 'Frontline' }, back: { label: 'Backline' }, left: { label: 'Left Flank' }, right: { label: 'Right Flank' }, air: { label: 'Air' }, rear: { label: 'Rear Guard' } },
    });
    // PCs are flagged rollPending above; the roll bar derives the Initiative
    // roll prompts directly from that state and writes the results back.
  },

  combat_end(value) {
    if (store.campaign.location) {
      DISPATCH.location_history(`${store.campaign.location}|Combat ended (round ${store.campaign.combatState.round}): ${value}`);
    }
    for (const entry of store.campaign.combatState.initiative) {
      if (entry.type === 'pc') {
        const idx = findPCIndex(entry.name);
        if (idx >= 0 && store.campaign.characters[idx].hp !== entry.hp) {
          aiSet(`characters.${idx}.hp`, entry.hp);
        }
      }
    }
    aiSet('combatState', {
      active: false, round: 0, initiative: [], currentTurn: 0,
      actionsUsed: { action: false, bonus: false, reaction: false, movement: false },
      zones: {},
    });
  },

  zone_add_enemy(value) {
    // Seed combat (PCs) FIRST so the enemy is appended to the existing roster
    // instead of being wiped by combat_start rebuilding initiative from scratch.
    if (!store.campaign.combatState.active) DISPATCH.combat_start('');
    const [name, hp, ac, zone, init] = value.split('|').map(s => s.trim());
    const initiative = [...store.campaign.combatState.initiative, {
      name, roll: parseInt(init, 10) || 0, type: 'npc',
      hp: parseInt(hp, 10) || 0, hpMax: parseInt(hp, 10) || 0,
      ac: parseInt(ac, 10) || 10, zone: zone || 'front',
    }];
    initiative.sort((a, b) => b.roll - a.roll);
    aiSet('combatState.initiative', initiative);
  },

  zone_move(value) {
    const [name, zone] = value.split('|').map(s => s.trim());
    const idx = store.campaign.combatState.initiative.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
    if (idx >= 0) aiSet(`combatState.initiative.${idx}.zone`, zone);
  },

  zone_remove(value) {
    const name = value.trim().toLowerCase();
    aiSet('combatState.initiative',
      store.campaign.combatState.initiative.filter(c => c.name.toLowerCase() !== name));
  },

  zone_effect(value) {
    const [zone, effect, type = 'terrain'] = value.split('|').map(s => s.trim());
    aiSet(`combatState.zones.${zone}.${type}`, effect);
  },

  zone_label(value) {
    const [zone, label] = value.split('|').map(s => s.trim());
    aiSet(`combatState.zones.${zone}.label`, label);
  },

  zone_fog(value) {
    const [zone, action] = value.split('|').map(s => s.trim());
    aiSet(`combatState.zones.${zone}.hidden`, action === 'hide');
  },

  roll_request(value) {
    const [skill, dc, pcName] = value.split('|').map(s => s.trim());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('roll-request', { detail: { skill, dc: parseInt(dc, 10) || 10, pcName } }));
    }
  },

  death_save(value) {
    const sep = value.includes('|') ? '|' : '=';
    const [name, result] = value.split(sep).map(s => s.trim());
    const idx = findPCIndex(name);
    if (idx === -1) return;
    const saves = { ...store.campaign.characters[idx].deathSaves };
    const lower = result.toLowerCase();
    if (lower === 'nat20' || lower === 'natural20') {
      aiSet(`characters.${idx}.hp`, 1);
      aiSet(`characters.${idx}.deathSaves`, { successes: 0, failures: 0 });
      return;
    } else if (lower === 'nat1' || lower === 'natural1') {
      saves.failures = Math.min(3, saves.failures + 2);
    } else if (lower === 'success') {
      saves.successes = Math.min(3, saves.successes + 1);
    } else {
      saves.failures = Math.min(3, saves.failures + 1);
    }
    aiSet(`characters.${idx}.deathSaves`, saves);
    if (saves.successes >= 3) {
      aiSet(`characters.${idx}.deathSaves`, { successes: 0, failures: 0 });
    }
    if (saves.failures >= 3) {
      aiSet(`characters.${idx}.deathSaves`, { successes: 0, failures: 0 });
      const conditions = [...store.campaign.characters[idx].conditions, { name: 'Dead', duration: null }];
      aiSet(`characters.${idx}.conditions`, conditions);
    }
  },

  module_episode(value) {
    const [numStr, status] = value.split(',').map(s => s.trim());
    const num = parseInt(numStr, 10);
    const progress = store.campaign.moduleProgress.map((ep, i) => {
      if (i < num - 1 && ep.status !== 'complete') return { ...ep, status: 'complete' };
      if (i === num - 1) return { ...ep, status: status || 'active' };
      return ep;
    });
    aiSet('moduleProgress', progress);
  },

  short_rest(value) {
    const name = value.trim();
    const targets = (name.toLowerCase() === 'party' || name.toLowerCase() === 'all')
      ? store.campaign.characters.map((_, i) => i)
      : [findPCIndex(name)].filter(i => i !== -1);

    for (const idx of targets) {
      const pc = store.campaign.characters[idx];
      pc.resources.forEach((r, resIdx) => {
        if (r.restoresOn === 'short' || r.restoresOn === 'short_rest') {
          aiSet(`characters.${idx}.resources.${resIdx}.current`, r.max);
        }
      });
    }
  },

  long_rest(value) {
    const name = value.trim();
    const targets = (name.toLowerCase() === 'party' || name.toLowerCase() === 'all')
      ? store.campaign.characters.map((_, i) => i)
      : [findPCIndex(name)].filter(i => i !== -1);

    for (const idx of targets) {
      const pc = store.campaign.characters[idx];
      aiSet(`characters.${idx}.hp`, pc.hpMax);
      aiSet(`characters.${idx}.hpTemp`, 0);
      aiSet(`characters.${idx}.currentSlots`, { ...pc.spellSlots });
      pc.resources.forEach((r, resIdx) => {
        aiSet(`characters.${idx}.resources.${resIdx}.current`, r.max);
      });
      const hdRestore = Math.max(1, Math.floor(pc.hitDice.total / 2));
      const newUsed = Math.max(0, pc.hitDice.used - hdRestore);
      aiSet(`characters.${idx}.hitDice`, { ...pc.hitDice, used: newUsed });
      aiSet(`characters.${idx}.exhaustion`, Math.max(0, pc.exhaustion - 1));
      aiSet(`characters.${idx}.deathSaves`, { successes: 0, failures: 0 });
      aiSet(`characters.${idx}.concentration`, null);
    }
  },

  round_advance() {
    // No-op: the engine owns the turn pointer and round counter
    // (advanceCombatToNextPC bumps the round when the order wraps). Letting the
    // AI also advance the round double-counts it, so we ignore AI round_advance.
  },

  hit_dice_use(value) {
    const [name, countStr] = value.split('=').map(s => s.trim());
    const count = parseInt(countStr, 10) || 1;
    const idx = findPCIndex(name);
    if (idx === -1) return;
    const pc = store.campaign.characters[idx];
    const available = pc.hitDice.total - pc.hitDice.used;
    if (available <= 0) return;
    const toUse = Math.min(count, available);
    aiSet(`characters.${idx}.hitDice`, { ...pc.hitDice, used: pc.hitDice.used + toUse });
    const dieSize = parseInt(pc.hitDice.die.replace('d', ''), 10) || 8;
    DISPATCH.roll_request(`HitDice|${dieSize}|${pc.name}`);
  },

  inspiration(value) {
    const match = value.match(/^(.+?)([=+-])(.*)$/);
    if (!match) return;
    const [, name, op, val] = match.map(s => s?.trim());
    const idx = findPCIndex(name);
    if (idx === -1) return;
    const removals = ['false', 'remove', 'off', 'no', 'revoke'];
    if (op === '-' || removals.includes(val.toLowerCase())) {
      aiSet(`characters.${idx}.inspiration`, false);
    } else {
      aiSet(`characters.${idx}.inspiration`, true);
    }
  },

  temp_hp(value) {
    const [name, amtStr] = value.split('=').map(s => s.trim());
    const amount = parseInt(amtStr, 10) || 0;
    const idx = findPCIndex(name);
    if (idx === -1) return;
    const current = store.campaign.characters[idx].hpTemp || 0;
    aiSet(`characters.${idx}.hpTemp`, Math.max(current, amount));
  },

  save_game() {},
  save() {},
  none() {},
  shell_defense() {},
  sp_charge() {},
  wagon_add(value) { DISPATCH.item_add(value); },
  wagon_cell_add() {},
  wagon_cell_update() {},
  wagon_cell_remove() {},
  wagon_hp() {},
  ox_hp() {},
  ox_condition() {},

  familiar_hp(value) {
    const [name, hpStr] = value.split('|').map(s => s.trim());
    const hp = parseInt(hpStr, 10);
    if (isNaN(hp)) return;
    for (let i = 0; i < store.campaign.characters.length; i++) {
      const pc = store.campaign.characters[i];
      if (pc.familiar && pc.familiar.name?.toLowerCase() === name.toLowerCase()) {
        const clamped = Math.max(0, Math.min(hp, pc.familiar.hpMax));
        aiSet(`characters.${i}.familiar.hp`, clamped);
        return;
      }
    }
  },

  familiar_add(value) {
    const parts = value.split('|').map(s => s.trim());
    if (parts.length < 2) return;
    const pcName = parts[0];
    const fields = parts[1].split(',').map(s => s.trim());
    const idx = store.campaign.characters.findIndex(c => c.name?.toLowerCase() === pcName.toLowerCase());
    if (idx === -1) return;
    const [name, species, type, hpStr, hpMaxStr, acStr] = fields;
    const hp = parseInt(hpStr, 10) || 1;
    const hpMax = parseInt(hpMaxStr, 10) || hp;
    const ac = parseInt(acStr, 10) || 10;
    const existing = store.campaign.characters[idx].familiar;
    const familiar = {
      name: name || 'Familiar',
      species: species || 'Beast',
      type: type || 'Fey',
      size: 'Tiny',
      hp, hpMax, ac,
      speeds: existing?.speeds || { walk: 30 },
      abilities: existing?.abilities || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      senses: existing?.senses || '',
      skills: existing?.skills || '',
      passivePerception: existing?.passivePerception || 10,
      specialAbilities: existing?.specialAbilities || [],
      status: 'active',
      source: existing?.source || 'Wild companion',
    };
    aiSet(`characters.${idx}.familiar`, familiar);
  },

  familiar_update(value) {
    const parts = value.split('|').map(s => s.trim());
    if (parts.length < 2) return;
    const pcName = parts[0];
    const idx = store.campaign.characters.findIndex(c => c.name?.toLowerCase() === pcName.toLowerCase());
    if (idx === -1 || !store.campaign.characters[idx].familiar) return;
    const assignment = parts[1];
    const eqIdx = assignment.indexOf('=');
    if (eqIdx === -1) return;
    const field = assignment.slice(0, eqIdx).trim();
    const val = assignment.slice(eqIdx + 1).trim();
    const allowed = ['status', 'hp', 'name', 'species', 'type', 'size', 'senses', 'skills', 'source'];
    if (!allowed.includes(field)) return;
    const parsed = field === 'hp' ? Math.max(0, Math.min(parseInt(val, 10) || 0, store.campaign.characters[idx].familiar.hpMax)) : val;
    aiSet(`characters.${idx}.familiar.${field}`, parsed);
  },

  animal_hp(value) {
    const [name, hpStr] = value.split('=').map(s => s.trim());
    const hp = parseInt(hpStr, 10);
    if (isNaN(hp)) return;
    const animals = store.campaign.wagonState.animals;
    const idx = animals.findIndex(a => a.name?.toLowerCase() === name.toLowerCase());
    if (idx !== -1) {
      const clamped = Math.max(0, Math.min(hp, animals[idx].hpMax));
      aiSet(`wagonState.animals.${idx}.hp`, clamped);
    }
  },

  animal_condition(value) {
    const [name, condition] = value.split('=').map(s => s.trim());
    const animals = store.campaign.wagonState.animals;
    const idx = animals.findIndex(a => a.name?.toLowerCase() === name.toLowerCase());
    if (idx !== -1) {
      aiSet(`wagonState.animals.${idx}.condition`, condition);
    }
  },

  spell_add() {},

  resistance_add(value) {
    const [name, type] = value.split(',').map(s => s.trim());
    const idx = findPCIndex(name);
    if (idx === -1) return;
    const pc = store.campaign.characters[idx];
    const existing = pc.resistances || [];
    if (!existing.includes(type)) aiSet(`characters.${idx}.resistances`, [...existing, type]);
  },
  resistance_remove(value) {
    const [name, type] = value.split(',').map(s => s.trim());
    const idx = findPCIndex(name);
    if (idx === -1) return;
    const pc = store.campaign.characters[idx];
    aiSet(`characters.${idx}.resistances`, (pc.resistances || []).filter(r => r.toLowerCase() !== type.toLowerCase()));
  },
  vulnerability_add(value) {
    const [name, type] = value.split(',').map(s => s.trim());
    const idx = findPCIndex(name);
    if (idx === -1) return;
    const pc = store.campaign.characters[idx];
    const existing = pc.vulnerabilities || [];
    if (!existing.includes(type)) aiSet(`characters.${idx}.vulnerabilities`, [...existing, type]);
  },
  vulnerability_remove(value) {
    const [name, type] = value.split(',').map(s => s.trim());
    const idx = findPCIndex(name);
    if (idx === -1) return;
    const pc = store.campaign.characters[idx];
    aiSet(`characters.${idx}.vulnerabilities`, (pc.vulnerabilities || []).filter(r => r.toLowerCase() !== type.toLowerCase()));
  },
  immunity_add(value) {
    const [name, type] = value.split(',').map(s => s.trim());
    const idx = findPCIndex(name);
    if (idx === -1) return;
    const pc = store.campaign.characters[idx];
    const existing = pc.immunities || [];
    if (!existing.includes(type)) aiSet(`characters.${idx}.immunities`, [...existing, type]);
  },
  immunity_remove(value) {
    const [name, type] = value.split(',').map(s => s.trim());
    const idx = findPCIndex(name);
    if (idx === -1) return;
    const pc = store.campaign.characters[idx];
    aiSet(`characters.${idx}.immunities`, (pc.immunities || []).filter(r => r.toLowerCase() !== type.toLowerCase()));
  },

  pc_update() { throw new Error('PC structure is system-owned'); },
  pc_add() { throw new Error('PC structure is system-owned'); },
  pc_delete() { throw new Error('PC structure is system-owned'); },
};

function applyCurrency(key, value) {
  const current = store.campaign.gold[key];
  if (value.startsWith('+') || value.startsWith('-')) {
    aiSet(`gold.${key}`, Math.max(0, current + parseInt(value, 10)));
  } else {
    aiSet(`gold.${key}`, Math.max(0, parseInt(value, 10) || 0));
  }
}

export function buildMechReceipt(applied, rejected) {
  const parts = [];
  if (applied.length) {
    parts.push('Applied: ' + applied.map(m => `${m.key}: ${m.value}`).join(', '));
  }
  if (rejected.length) {
    parts.push('Rejected: ' + rejected.map(m => `${m.key}: ${m.reason}`).join(', '));
  }
  return parts.length ? `[MECHANICS RECEIPT] ${parts.join('. ')}` : '';
}
