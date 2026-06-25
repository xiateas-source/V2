import { createStore, produce } from 'solid-js/store';
import { DEFAULT_CAMPAIGN } from './campaign.js';
import { DEFAULT_SYSTEM } from './system.js';

export class OwnershipError extends Error {
  constructor(message) {
    super(message);
    this.name = 'OwnershipError';
  }
}

const OWNERSHIP = {
  // AI-owned (via mechanics pipeline)
  'characters.$.hp': 'ai',
  'characters.$.hpTemp': 'ai',
  'characters.$.conditions': 'ai',
  'characters.$.concentration': 'ai',
  'characters.$.exhaustion': 'ai',
  'characters.$.inspiration': 'ai',
  'characters.$.deathSaves': 'ai',
  'characters.$.resistances': 'ai',
  'characters.$.vulnerabilities': 'ai',
  'characters.$.immunities': 'ai',
  'characters.$.familiar': 'ai',
  'gold': 'ai',
  'incomeLog': 'ai',
  'expenseLog': 'ai',
  'inventory': 'ai',
  'wagonState': 'ai',
  'quests': 'ai',
  'primaryMission': 'ai',
  'npcs': 'ai',
  'location': 'ai',
  'locDesc': 'ai',
  'weather': 'ai',
  'time': 'ai',
  'travelLog': 'ai',
  'townReputation': 'ai',
  'secrets': 'ai',
  'consequences': 'ai',
  'combatState': 'ai',
  'chapters': 'ai',
  'moduleProgress': 'ai',
  'locations': 'ai',
  'narrative': 'ai',
  'ooc': 'ai',

  // Player-owned (via UI editors)
  'characters.$.name': 'player',
  'characters.$.backstory': 'player',
  'characters.$.appearance': 'player',
  'characters.$.personality': 'player',
  'characters.$.traits': 'player',
  'characters.$.avatar': 'player',
  'characters.$.notes': 'player',
  'playerIdentity': 'player',
  'contracts': 'player',

  // AI-owned runtime values (current state managed by AI during gameplay)
  'characters.$.xp': 'ai',
  'characters.$.currentSlots': 'ai',
  'characters.$.hitDice': 'ai',
  'characters.$.resources.$.current': 'ai',

  // System-owned (via wizards only — structure/ceilings)
  'characters.$.level': 'system',
  'characters.$.hpMax': 'system',
  'characters.$.class': 'system',
  'characters.$.subclass': 'system',
  'characters.$.features': 'system',
  'characters.$.spells': 'system',
  'characters.$.knownSpells': 'system',
  'characters.$.cantrips': 'system',
  'characters.$.spellSlots': 'system',
  'characters.$.resources': 'system',
  'characters.$.proficiencies': 'system',
  'characters.$.savingThrows': 'system',
  'characters.$.skills': 'system',
  'characters.$.abilityScores': 'system',
  'characters.$.race': 'system',
  'characters.$.ac': 'system',
  'characters.$.speed': 'system',
  'characters.$.background': 'system',
  'characters.$.alignment': 'system',
  'characters.$.languages': 'system',
  'characters.$.attacks': 'system',
  'characters.$.color': 'system',
};

function normalizePath(path) {
  return path.replace(/\.\d+\./g, '.$.');
}

function getOwner(path) {
  const normalized = normalizePath(path);
  if (OWNERSHIP[normalized]) return OWNERSHIP[normalized];
  const parts = normalized.split('.');
  while (parts.length > 0) {
    const check = parts.join('.');
    if (OWNERSHIP[check]) return OWNERSHIP[check];
    parts.pop();
  }
  return null;
}

function parsePath(path) {
  return path.split('.').map(seg => {
    const num = Number(seg);
    return Number.isNaN(num) ? seg : num;
  });
}

const [store, setStore] = createStore({
  campaign: structuredClone(DEFAULT_CAMPAIGN),
  system: structuredClone(DEFAULT_SYSTEM),
});

function setField(path, value, owner) {
  const fullPath = path.startsWith('campaign.') || path.startsWith('system.')
    ? path
    : `campaign.${path}`;

  const fieldPath = fullPath.startsWith('campaign.')
    ? fullPath.slice('campaign.'.length)
    : fullPath.slice('system.'.length);

  const fieldOwner = getOwner(fieldPath);
  if (fieldOwner && fieldOwner !== owner) {
    throw new OwnershipError(
      `${owner} tried to write ${path} (owned by ${fieldOwner})`
    );
  }

  const segments = parsePath(fullPath);
  setStore(...segments, value);
}

export function aiSet(path, value) { setField(path, value, 'ai'); }
export function playerSet(path, value) { setField(path, value, 'player'); }
export function systemSet(path, value) { setField(path, value, 'system'); }

export { store, setStore, OWNERSHIP, getOwner };
