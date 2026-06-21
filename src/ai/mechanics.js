import { store, setStore, aiSet } from '../state/index.js';

const KNOWN_KEYS = new Set([
  'hp', 'hp_max', 'conditions', 'concentration', 'location', 'time', 'weather',
  'travel_note', 'loc_desc', 'gp', 'sp', 'cp', 'ep', 'pp', 'item_add', 'item_remove',
  'slot_use', 'slot_restore', 'resource_use', 'resource_restore', 'shell_defense',
  'wagon_add', 'wagon_cell_add', 'wagon_cell_update', 'wagon_cell_remove',
  'wagon_hp', 'ox_hp', 'ox_condition', 'familiar_hp', 'animal_hp', 'animal_condition',
  'income', 'expense', 'xp', 'quest_add', 'quest_done', 'quest_fail', 'quest_update',
  'primary_mission', 'npc_add', 'npc_mood', 'pc_update', 'pc_add', 'pc_delete',
  'module_episode', 'short_rest', 'town_rep', 'save_game', 'save', 'spell_add',
  'sp_charge', 'consequence_add', 'consequence_resolve', 'chapter_add',
  'chapter_update', 'location_add', 'location_visit', 'location_history',
  'location_investment', 'roll_request', 'zone_move', 'zone_add_enemy', 'zone_remove',
  'zone_effect', 'zone_label', 'combat_start', 'combat_end', 'zone_fog',
  'death_save', 'none',
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

  for (const mech of mechanics) {
    const reason = checkRejection(mech);
    if (reason) {
      rejected.push({ ...mech, reason });
    } else {
      valid.push(mech);
    }
  }

  return { valid, rejected };
}

function checkRejection(mech) {
  if (mech.key === 'combat_start' && store.campaign.combatState.active) {
    return 'Combat already active';
  }
  if (mech.key === 'zone_add_enemy') {
    const name = mech.value.split('|')[0]?.trim();
    if (store.campaign.combatState.initiative.some(c => c.name.toLowerCase() === name?.toLowerCase())) {
      return `${name} already in combat`;
    }
  }
  if (['income', 'gp', 'sp', 'cp', 'ep', 'pp'].includes(mech.key) && /xp/i.test(mech.value)) {
    return 'XP is not currency';
  }
  if (mech.key === 'hp_max') {
    mech._warning = 'hp_max should be set by level-up wizard, not AI';
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
      if (idx === -1) continue;
      const pc = store.campaign.characters[idx];
      const clamped = Math.max(0, Math.min(hp, pc.hpMax));
      setStore('campaign', 'characters', idx, 'hp', clamped);
    }
  },

  hp_max(value) {
    for (const { name, value: hpMax } of parseHpEntries(value)) {
      const idx = findPCIndex(name);
      if (idx === -1) continue;
      setStore('campaign', 'characters', idx, 'hpMax', hpMax);
    }
  },

  conditions(value) {
    const match = value.match(/^(.+?)([+-=])(.+)$/);
    if (!match) return;
    const [, name, op, condition] = match.map(s => s?.trim());
    const idx = findPCIndex(name);
    if (idx === -1) return;
    const current = [...store.campaign.characters[idx].conditions];
    if (op === '-') {
      const filtered = current.filter(c => (c.name || c).toLowerCase() !== condition.toLowerCase());
      setStore('campaign', 'characters', idx, 'conditions', filtered);
    } else {
      if (!current.some(c => (c.name || c).toLowerCase() === condition.toLowerCase())) {
        setStore('campaign', 'characters', idx, 'conditions', [...current, { name: condition, duration: null }]);
      }
    }
  },

  concentration(value) {
    const [name, spell] = value.split('=').map(s => s.trim());
    const idx = findPCIndex(name);
    if (idx === -1) return;
    setStore('campaign', 'characters', idx, 'concentration',
      spell.toLowerCase() === 'none' ? null : { spell, since: store.campaign.combatState.round || '' });
  },

  location(value) {
    const prev = store.campaign.location;
    setStore('campaign', 'location', value.trim());
    if (prev) {
      setStore('campaign', 'travelLog', [...store.campaign.travelLog, { from: prev, to: value.trim(), note: '', gameTs: store.campaign.time }]);
    }
  },

  time(value) { setStore('campaign', 'time', value.trim()); },
  weather(value) { setStore('campaign', 'weather', value.trim()); },
  loc_desc(value) { setStore('campaign', 'locDesc', value.trim()); },
  primary_mission(value) { setStore('campaign', 'primaryMission', value.trim()); },

  travel_note(value) {
    const log = [...store.campaign.travelLog];
    if (log.length) {
      log[log.length - 1] = { ...log[log.length - 1], note: (log[log.length - 1].note || '') + '\n' + value.trim() };
      setStore('campaign', 'travelLog', log);
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
    setStore('campaign', 'gold', 'gp', Math.max(0, store.campaign.gold.gp + amount));
    setStore('campaign', 'incomeLog', [...store.campaign.incomeLog, { amount, category, desc, gameTs: store.campaign.time }]);
  },

  expense(value) {
    const parts = value.split(',').map(s => s.trim());
    const amount = parseInt(parts[0], 10) || 0;
    const desc = parts.slice(1).join(', ') || '';
    setStore('campaign', 'gold', 'gp', Math.max(0, store.campaign.gold.gp - amount));
    setStore('campaign', 'expenseLog', [...store.campaign.expenseLog, { amount, desc, gameTs: store.campaign.time }]);
  },

  xp(value) {
    const match = value.match(/^(.+?)\+(\d+)$/);
    if (!match) return;
    const [, target, amtStr] = match;
    const amount = parseInt(amtStr, 10);
    if (target.toLowerCase() === 'party') {
      store.campaign.characters.forEach((pc, idx) => {
        setStore('campaign', 'characters', idx, 'xp', pc.xp + amount);
      });
    } else {
      const idx = findPCIndex(target);
      if (idx === -1) return;
      setStore('campaign', 'characters', idx, 'xp', store.campaign.characters[idx].xp + amount);
    }
  },

  quest_add(value) {
    const [text, notes = '', location = ''] = value.split('|').map(s => s.trim());
    const prefix = text.substring(0, 30).toLowerCase();
    if (store.campaign.quests.some(q => q.text.substring(0, 30).toLowerCase() === prefix)) return;
    setStore('campaign', 'quests', [...store.campaign.quests, {
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
    setStore('campaign', 'quests', quests);
  },

  quest_fail(value) {
    const lower = value.trim().toLowerCase();
    const quests = store.campaign.quests.map(q =>
      q.text.toLowerCase().includes(lower) || lower.includes(q.text.substring(0, 20).toLowerCase())
        ? { ...q, status: 'failed' } : q
    );
    setStore('campaign', 'quests', quests);
  },

  quest_update(value) {
    const [name, ...rest] = value.split('|');
    const notes = rest.join('|').trim();
    const lower = name.trim().toLowerCase();
    const quests = store.campaign.quests.map(q =>
      q.text.toLowerCase().includes(lower)
        ? { ...q, notes: (q.notes ? q.notes + '\n' : '') + notes } : q
    );
    setStore('campaign', 'quests', quests);
  },

  npc_add(value) {
    const parts = value.split(',').map(s => s.trim());
    const name = parts[0] || '';
    const disposition = parts[1] || 'Unknown';
    const details = parts.slice(2).join(', ') || '';
    const existing = store.campaign.npcs.findIndex(n => n.name.toLowerCase() === name.toLowerCase());
    if (existing >= 0) {
      setStore('campaign', 'npcs', existing, { ...store.campaign.npcs[existing], disposition, details, lastSeen: store.campaign.location });
    } else {
      setStore('campaign', 'npcs', [...store.campaign.npcs, {
        id: 'npc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name, disposition, details, status: 'active', hp: null,
        lastSeen: store.campaign.location, race: '', role: '', gameTs: store.campaign.time,
      }]);
    }
  },

  npc_mood(value) {
    const [name, mood] = value.split('=').map(s => s.trim());
    const idx = store.campaign.npcs.findIndex(n => n.name.toLowerCase() === name.toLowerCase());
    if (idx >= 0) setStore('campaign', 'npcs', idx, 'disposition', mood);
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
    setStore('campaign', 'consequences', [...store.campaign.consequences, {
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
    setStore('campaign', 'consequences', consequences);
  },

  chapter_add(value) {
    const [title, ...rest] = value.split('|');
    const content = rest.join('|').trim();
    setStore('campaign', 'chapters', [...store.campaign.chapters, {
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
    setStore('campaign', 'chapters', chapters);
  },

  town_rep(value) {
    const parts = value.split(',').map(s => s.trim());
    const town = parts[0]; const status = parts[1] || 'neutral'; const notes = parts.slice(2).join(', ');
    const existing = store.campaign.townReputation.findIndex(t => t.town.toLowerCase() === town.toLowerCase());
    if (existing >= 0) {
      const prev = store.campaign.townReputation[existing];
      const history = [...(prev.history || []), { status: prev.status, notes: prev.notes, gameTs: prev.gameTs }];
      setStore('campaign', 'townReputation', existing, { ...prev, status, notes, gameTs: store.campaign.time, history });
    } else {
      setStore('campaign', 'townReputation', [...store.campaign.townReputation, {
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
      setStore('campaign', 'locations', existing, 'type', type);
      if (description) setStore('campaign', 'locations', existing, 'history',
        [...store.campaign.locations[existing].history, { gameTs: store.campaign.time, text: description, dmOnly: false }]);
    } else {
      setStore('campaign', 'locations', [...store.campaign.locations, {
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
      setStore('campaign', 'locations', idx, 'status', 'visited');
      setStore('campaign', 'locations', idx, 'lastVisited', store.campaign.time);
      if (!store.campaign.locations[idx].firstVisited) {
        setStore('campaign', 'locations', idx, 'firstVisited', store.campaign.time);
      }
    }
  },

  location_history(value) {
    const parts = value.split('|').map(s => s.trim());
    const name = parts[0]; const text = parts[1] || ''; const dmOnly = parts[2] === 'true';
    const idx = store.campaign.locations.findIndex(l => l.name.toLowerCase() === name.toLowerCase());
    if (idx >= 0) {
      setStore('campaign', 'locations', idx, 'history',
        [...store.campaign.locations[idx].history, { gameTs: store.campaign.time, text, dmOnly }]);
    }
  },

  location_investment(value) {
    const [name, desc, amountStr] = value.split('|').map(s => s.trim());
    const amount = parseInt(amountStr, 10) || 0;
    const idx = store.campaign.locations.findIndex(l => l.name.toLowerCase() === name.toLowerCase());
    if (idx >= 0) {
      setStore('campaign', 'locations', idx, 'investments',
        [...store.campaign.locations[idx].investments, { desc, amount, gameTs: store.campaign.time, notes: '' }]);
    }
  },

  item_add(value) {
    const parts = value.split(',').map(s => s.trim());
    const pcIdx = findPCIndex(parts[0]);
    const STORAGE_TARGETS = ['wagon', 'cargo', 'hoard', 'party'];
    const isStorage = STORAGE_TARGETS.includes(parts[0].toLowerCase());
    let target, name, type, attunement;
    if (pcIdx >= 0) {
      target = parts[0];
      name = parts[1] || 'item';
      type = parts[2] || 'item';
      attunement = parts[3] || 'none';
    } else if (isStorage) {
      target = parts[0].toLowerCase();
      name = parts[1] || 'item';
      type = parts[2] || 'item';
      attunement = parts[3] || 'none';
    } else {
      target = 'wagon';
      name = parts[0] || 'item';
      type = parts[1] || 'item';
      attunement = parts[2] || 'none';
    }
    const item = { name, qty: 1, type, attunement, weight: 0 };

    if (target === 'wagon' || target === 'cargo') {
      setStore('campaign', 'inventory', 'wagon', [...store.campaign.inventory.wagon, item]);
    } else if (target === 'hoard') {
      setStore('campaign', 'inventory', 'hoard', [...store.campaign.inventory.hoard, item]);
    } else if (target === 'party') {
      setStore('campaign', 'inventory', 'wagon', [...store.campaign.inventory.wagon, item]);
    } else {
      const pc = findPC(target);
      const key = pc ? pc.id : 'party';
      const carried = { ...store.campaign.inventory.carried };
      carried[key] = [...(carried[key] || []), item];
      setStore('campaign', 'inventory', 'carried', carried);
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
      setStore('campaign', 'inventory', 'wagon', removeFrom(store.campaign.inventory.wagon));
    } else if (target === 'hoard') {
      setStore('campaign', 'inventory', 'hoard', removeFrom(store.campaign.inventory.hoard));
    } else if (pcIdx >= 0) {
      const pc = store.campaign.characters[pcIdx];
      const key = pc.id;
      const carried = { ...store.campaign.inventory.carried };
      carried[key] = removeFrom(carried[key] || []);
      setStore('campaign', 'inventory', 'carried', carried);
    }
  },

  slot_use(value) {
    const [name, levelStr] = value.split('=').map(s => s.trim());
    const idx = findPCIndex(name);
    if (idx === -1) return;
    const level = levelStr;
    const current = store.campaign.characters[idx].currentSlots[level];
    if (current > 0) {
      setStore('campaign', 'characters', idx, 'currentSlots', level, current - 1);
    }
  },

  slot_restore(value) {
    const [name, levelStr] = value.split('=').map(s => s.trim());
    const idx = findPCIndex(name);
    if (idx === -1) return;
    if (levelStr.toLowerCase() === 'all') {
      const pc = store.campaign.characters[idx];
      setStore('campaign', 'characters', idx, 'currentSlots', { ...pc.spellSlots });
    } else {
      const max = store.campaign.characters[idx].spellSlots[levelStr] || 0;
      setStore('campaign', 'characters', idx, 'currentSlots', levelStr, max);
    }
  },

  resource_use(value) {
    const [name, resName] = value.split(',').map(s => s.trim());
    const idx = findPCIndex(name);
    if (idx === -1) return;
    const resources = store.campaign.characters[idx].resources.map(r =>
      r.name.toLowerCase().includes(resName.toLowerCase()) && r.current > 0
        ? { ...r, current: r.current - 1 } : r
    );
    setStore('campaign', 'characters', idx, 'resources', resources);
  },

  resource_restore(value) {
    const [name, target] = value.split('=').map(s => s.trim());
    const idx = findPCIndex(name);
    if (idx === -1) return;
    if (target.toLowerCase() === 'all') {
      const resources = store.campaign.characters[idx].resources.map(r => ({ ...r, current: r.max }));
      setStore('campaign', 'characters', idx, 'resources', resources);
    }
  },

  combat_start(value) {
    setStore('campaign', 'combatState', {
      active: true, round: 1, initiative: [], currentTurn: 0,
      actionsUsed: { action: false, bonus: false, reaction: false, movement: false },
      zones: { front: { label: 'Frontline' }, back: { label: 'Backline' }, left: { label: 'Left Flank' }, right: { label: 'Right Flank' }, air: { label: 'Air' }, rear: { label: 'Rear Guard' } },
    });
  },

  combat_end(value) {
    if (store.campaign.location) {
      DISPATCH.location_history(`${store.campaign.location}|Combat ended: ${value}`);
    }
    setStore('campaign', 'combatState', {
      active: false, round: 0, initiative: [], currentTurn: 0,
      actionsUsed: { action: false, bonus: false, reaction: false, movement: false },
      zones: {},
    });
  },

  zone_add_enemy(value) {
    const [name, hp, ac, zone, init] = value.split('|').map(s => s.trim());
    const initiative = [...store.campaign.combatState.initiative, {
      name, roll: parseInt(init, 10) || 0, type: 'npc',
      hp: parseInt(hp, 10) || 0, hpMax: parseInt(hp, 10) || 0,
      ac: parseInt(ac, 10) || 10, zone: zone || 'front',
    }];
    initiative.sort((a, b) => b.roll - a.roll);
    setStore('campaign', 'combatState', 'initiative', initiative);
    if (!store.campaign.combatState.active) DISPATCH.combat_start('');
  },

  zone_move(value) {
    const [name, zone] = value.split('|').map(s => s.trim());
    const idx = store.campaign.combatState.initiative.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
    if (idx >= 0) setStore('campaign', 'combatState', 'initiative', idx, 'zone', zone);
  },

  zone_remove(value) {
    const name = value.trim().toLowerCase();
    setStore('campaign', 'combatState', 'initiative',
      store.campaign.combatState.initiative.filter(c => c.name.toLowerCase() !== name));
  },

  zone_effect(value) {
    const [zone, effect, type = 'terrain'] = value.split('|').map(s => s.trim());
    setStore('campaign', 'combatState', 'zones', zone, type, effect);
  },

  zone_label(value) {
    const [zone, label] = value.split('|').map(s => s.trim());
    setStore('campaign', 'combatState', 'zones', zone, 'label', label);
  },

  zone_fog(value) {
    const [zone, action] = value.split('|').map(s => s.trim());
    setStore('campaign', 'combatState', 'zones', zone, 'hidden', action === 'hide');
  },

  roll_request(value) {
    const [skill, dc, pcName] = value.split('|').map(s => s.trim());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('roll-request', { detail: { skill, dc: parseInt(dc, 10) || 10, pcName } }));
    }
  },

  death_save(value) {
    const [name, result] = value.split('|').map(s => s.trim());
    const idx = findPCIndex(name);
    if (idx === -1) return;
    const saves = { ...store.campaign.characters[idx].deathSaves };
    if (result === 'success') saves.successes = Math.min(3, saves.successes + 1);
    else saves.failures = Math.min(3, saves.failures + 1);
    setStore('campaign', 'characters', idx, 'deathSaves', saves);
    if (saves.successes >= 3) {
      setStore('campaign', 'characters', idx, 'hp', 1);
      setStore('campaign', 'characters', idx, 'deathSaves', { successes: 0, failures: 0 });
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
    setStore('campaign', 'moduleProgress', progress);
  },

  short_rest() {},
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
  familiar_hp() {},
  animal_hp() {},
  animal_condition() {},
  spell_add() {},
  pc_update() {},
  pc_add() {},
  pc_delete() {},
};

function applyCurrency(key, value) {
  const current = store.campaign.gold[key];
  if (value.startsWith('+') || value.startsWith('-')) {
    setStore('campaign', 'gold', key, Math.max(0, current + parseInt(value, 10)));
  } else {
    setStore('campaign', 'gold', key, Math.max(0, parseInt(value, 10) || 0));
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
