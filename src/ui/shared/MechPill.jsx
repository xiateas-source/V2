import { navigateTo, openCharSheet } from './sourceBus.js';

// A mechanic pill in an AI response. Tapping routes to the field's home
// (tap-to-source): vitals → that PC's sheet, money/items → Cargo, story → Journal.

const PC_KEYS = new Set([
  'hp', 'temp_hp', 'conditions', 'concentration', 'slot_use', 'slot_restore',
  'death_save', 'hit_dice_use', 'resource_use', 'resource_restore', 'inspiration',
  'xp', 'familiar_hp', 'spell_add',
]);
const CARGO_KEYS = new Set(['gp', 'sp', 'cp', 'ep', 'pp', 'income', 'expense', 'item_add', 'item_remove']);

function routeFor(key) {
  if (!key) return null;
  if (PC_KEYS.has(key)) return 'charsheet';
  if (CARGO_KEYS.has(key)) return 'cargo';
  if (
    key.startsWith('quest') || key.startsWith('consequence') || key.startsWith('npc') ||
    key.startsWith('chapter') || key.startsWith('location') || key === 'primary_mission' ||
    key === 'town_rep' || key === 'secret'
  ) return 'journal';
  return null;
}

export default function MechPill(props) {
  const route = () => routeFor(props.mkey);

  function onTap() {
    const r = route();
    if (!r) return;
    if (r === 'charsheet') {
      const who = String(props.value || '').split(/[,=]/)[0].trim();
      openCharSheet(who);
    } else {
      navigateTo(r);
    }
  }

  return (
    <button
      class={`mech-pill pill-${props.type || 'applied'} ${route() ? 'mech-pill-tap' : ''}`}
      onClick={onTap}
      disabled={!route()}
    >
      {props.label}
      {route() && <i class="ph ph-arrow-up-right mech-pill-go" />}
    </button>
  );
}
