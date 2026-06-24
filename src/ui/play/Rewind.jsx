import { Show } from 'solid-js';
import { store, setStore } from '../../state/index.js';
import { isSending } from '../../ai/engine.js';

// Messages carry `type` ('dm' | 'player' | 'system'), not `role`. The DM's
// reply is type 'dm' (or 'dm_advisory'); a preceding player turn is type 'player'.
const isDM = (m) => m && (m.type === 'dm' || m.type === 'dm_advisory' || m.role === 'assistant');
const isPlayer = (m) => m && (m.type === 'player' || m.role === 'user');

export default function Rewind() {
  const canRewind = () => {
    if (isSending()) return false;
    const msgs = store.campaign.narrative;
    if (msgs.length < 2) return false;
    return isDM(msgs[msgs.length - 1]);
  };

  function doRewind() {
    if (!canRewind()) return;
    const msgs = [...store.campaign.narrative];
    const last = msgs[msgs.length - 1];

    if (last.mechanics) {
      undoMechanics(last.mechanics.applied || []);
    }

    msgs.pop();

    if (msgs.length > 0 && isPlayer(msgs[msgs.length - 1])) {
      msgs.pop();
    }

    setStore('campaign', 'narrative', msgs);
  }

  return (
    <Show when={canRewind()}>
      <button class="btn-rewind" onClick={doRewind} title="Undo last exchange">
        Undo
      </button>
    </Show>
  );
}

function undoMechanics(applied) {
  for (const m of [...applied].reverse()) {
    if (!m.applied) continue;
    try {
      revert(m);
    } catch (_) {}
  }
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

function revert(m) {
  const { key, value } = m;

  switch (key) {
    case 'hp': {
      // Can't perfectly revert HP without storing old value — skip
      break;
    }
    case 'conditions': {
      const match = value.match(/^(.+?)([+-=])(.+)$/);
      if (!match) break;
      const [, name, op, condition] = match.map(s => s?.trim());
      const idx = findPCIndex(name);
      if (idx === -1) break;
      const current = [...store.campaign.characters[idx].conditions];
      if (op === '+' || op === '=') {
        const filtered = current.filter(c => (c.name || c).toLowerCase() !== condition.toLowerCase());
        setStore('campaign', 'characters', idx, 'conditions', filtered);
      } else if (op === '-') {
        setStore('campaign', 'characters', idx, 'conditions', [...current, { name: condition, duration: null }]);
      }
      break;
    }
    case 'concentration': {
      const [name, spell] = value.split('=').map(s => s.trim());
      const idx = findPCIndex(name);
      if (idx === -1) break;
      if (spell.toLowerCase() === 'none') {
        // Was removed — we can't restore old spell without snapshot
      } else {
        setStore('campaign', 'characters', idx, 'concentration', null);
      }
      break;
    }
    case 'income': {
      const amount = parseInt(value.split(',')[0], 10) || 0;
      setStore('campaign', 'gold', 'gp', Math.max(0, store.campaign.gold.gp - amount));
      const log = [...store.campaign.incomeLog];
      log.pop();
      setStore('campaign', 'incomeLog', log);
      break;
    }
    case 'expense': {
      const amount = parseInt(value.split(',')[0], 10) || 0;
      setStore('campaign', 'gold', 'gp', store.campaign.gold.gp + amount);
      const log = [...store.campaign.expenseLog];
      log.pop();
      setStore('campaign', 'expenseLog', log);
      break;
    }
    case 'quest_add': {
      const text = value.split('|')[0].trim();
      const lower = text.substring(0, 30).toLowerCase();
      const quests = store.campaign.quests.filter(q => q.text.substring(0, 30).toLowerCase() !== lower);
      setStore('campaign', 'quests', quests);
      break;
    }
    case 'quest_done':
    case 'quest_fail': {
      const lower = value.trim().toLowerCase();
      const quests = store.campaign.quests.map(q =>
        q.text.toLowerCase().includes(lower) ? { ...q, status: 'active' } : q
      );
      setStore('campaign', 'quests', quests);
      break;
    }
    case 'npc_add': {
      const name = value.split(',')[0].trim().toLowerCase();
      const npcs = store.campaign.npcs.filter(n => n.name.toLowerCase() !== name);
      setStore('campaign', 'npcs', npcs);
      break;
    }
    case 'consequence_add': {
      const text = value.split('|')[0].trim().toLowerCase();
      const consequences = store.campaign.consequences.filter(c => !c.text.toLowerCase().includes(text));
      setStore('campaign', 'consequences', consequences);
      break;
    }
    case 'item_add': {
      const parts = value.split(',').map(s => s.trim());
      const name = parts[1] || parts[0];
      const lower = name.toLowerCase();
      const wagon = store.campaign.inventory.wagon.filter(i => !i.name.toLowerCase().includes(lower));
      setStore('campaign', 'inventory', 'wagon', wagon);
      // Also check carried
      const carried = { ...store.campaign.inventory.carried };
      for (const pcId of Object.keys(carried)) {
        carried[pcId] = (carried[pcId] || []).filter(i => !i.name.toLowerCase().includes(lower));
      }
      setStore('campaign', 'inventory', 'carried', carried);
      break;
    }
    case 'slot_use': {
      const [name, levelStr] = value.split('=').map(s => s.trim());
      const idx = findPCIndex(name);
      if (idx === -1) break;
      const current = store.campaign.characters[idx].currentSlots[levelStr] || 0;
      const max = store.campaign.characters[idx].spellSlots[levelStr] || 0;
      if (current < max) {
        setStore('campaign', 'characters', idx, 'currentSlots', levelStr, current + 1);
      }
      break;
    }
    case 'xp': {
      const match = value.match(/^(.+?)\+(\d+)$/);
      if (!match) break;
      const [, target, amtStr] = match;
      const amount = parseInt(amtStr, 10);
      if (target.toLowerCase() === 'party') {
        store.campaign.characters.forEach((pc, idx) => {
          setStore('campaign', 'characters', idx, 'xp', Math.max(0, pc.xp - amount));
        });
      } else {
        const idx = findPCIndex(target);
        if (idx >= 0) setStore('campaign', 'characters', idx, 'xp', Math.max(0, store.campaign.characters[idx].xp - amount));
      }
      break;
    }
    case 'combat_start': {
      // Only safe to revert if no turns have actually happened. Once combat
      // has progressed (round > 1 or turn > 0) reverting would nuke the
      // entire fight, which is never what the player wants from a single Undo.
      const cs = store.campaign.combatState;
      if (cs.active && (cs.round > 1 || cs.currentTurn > 0)) break;
      setStore('campaign', 'combatState', {
        active: false, round: 0, initiative: [], currentTurn: 0,
        actionsUsed: { action: false, bonus: false, reaction: false, movement: false },
        zones: {},
      });
      break;
    }
    case 'zone_add_enemy': {
      const name = value.split('|')[0].trim().toLowerCase();
      setStore('campaign', 'combatState', 'initiative',
        store.campaign.combatState.initiative.filter(c => c.name.toLowerCase() !== name));
      break;
    }
    case 'chapter_add': {
      const chapters = [...store.campaign.chapters];
      chapters.pop();
      setStore('campaign', 'chapters', chapters);
      break;
    }
    case 'location_add': {
      const name = value.split('|')[0].trim().toLowerCase();
      const locations = store.campaign.locations.filter(l => l.name.toLowerCase() !== name);
      setStore('campaign', 'locations', locations);
      break;
    }
    default:
      break;
  }
}
