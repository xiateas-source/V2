import { createSignal, For, Show, onMount, onCleanup } from 'solid-js';
import { store } from '../../state/index.js';
import CharSheet from '../reference/CharSheet.jsx';
import LevelUp from '../shared/LevelUp.jsx';

const XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

const CLASS_ICON = {
  fighter: 'ph-sword', rogue: 'ph-knife', bard: 'ph-music-notes', wizard: 'ph-sparkle',
  cleric: 'ph-cross', druid: 'ph-leaf', barbarian: 'ph-fire', paladin: 'ph-shield-chevron',
  ranger: 'ph-arrow-bend-up-right', sorcerer: 'ph-lightning', warlock: 'ph-eye',
  monk: 'ph-hand-fist', artificer: 'ph-gear',
};

const CLASS_ABBR = {
  fighter: 'Ftr', rogue: 'Rg', bard: 'Bd', wizard: 'Wiz', cleric: 'Clr', druid: 'Dru',
  barbarian: 'Bbn', paladin: 'Pal', ranger: 'Rgr', sorcerer: 'Sor', warlock: 'Wlk',
  monk: 'Mnk', artificer: 'Art',
};

function classIcon(cls) { return CLASS_ICON[(cls || '').toLowerCase()] || 'ph-shield'; }
function classAbbr(cls) { return CLASS_ABBR[(cls || '').toLowerCase()] || (cls || '').slice(0, 3); }

export default function CharTiles() {
  const [sheetOpen, setSheetOpen] = createSignal(false);
  const [sheetPC, setSheetPC] = createSignal(0);
  const [levelUpPC, setLevelUpPC] = createSignal(null);
  const chars = () => store.campaign.characters;

  function openSheet(idx) {
    setSheetPC(idx);
    setSheetOpen(true);
  }

  function openLevelUp(idx) {
    setLevelUpPC(idx);
  }

  // Tap-to-source: a mechanic pill / link can request a specific PC's sheet.
  function onOpenSheet(e) {
    const who = (e.detail?.pcName || '').toLowerCase().trim();
    if (!who) { openSheet(0); return; }
    const idx = chars().findIndex(p =>
      p.name.toLowerCase() === who ||
      p.name.toLowerCase().startsWith(who) ||
      who.startsWith(p.name.toLowerCase().split(' ')[0])
    );
    openSheet(idx >= 0 ? idx : 0);
  }

  function onOpenLevelUp(e) {
    const pcIndex = e.detail?.pcIndex;
    if (pcIndex != null) openLevelUp(pcIndex);
  }

  onMount(() => {
    window.addEventListener('tp-charsheet', onOpenSheet);
    window.addEventListener('tp-levelup', onOpenLevelUp);
  });
  onCleanup(() => {
    window.removeEventListener('tp-charsheet', onOpenSheet);
    window.removeEventListener('tp-levelup', onOpenLevelUp);
  });

  return (
    <>
      <Show when={chars().length > 0}>
        <div class="party">
          <For each={chars()}>
            {(pc, idx) => {
              const hpPct = () => pc.hpMax ? Math.max(0, Math.min(100, Math.round((pc.hp / pc.hpMax) * 100))) : 100;
              const hpColor = () => hpPct() > 50 ? 'var(--color-success)' : hpPct() > 25 ? 'var(--color-warning)' : 'var(--color-danger)';
              const canLevelUp = () => {
                const nextLevel = pc.level;
                if (nextLevel >= 20) return false;
                return pc.xp >= XP_THRESHOLDS[nextLevel];
              };
              const monogram = () => (pc.name || '?').trim().charAt(0).toUpperCase();
              const hasDeathSaves = () => pc.hp === 0 && ((pc.deathSaves?.successes || 0) > 0 || (pc.deathSaves?.failures || 0) > 0);

              return (
                <div
                  class={`pc${canLevelUp() ? ' pc-levelup' : ''}`}
                  style={{ '--ring': pc.color || 'var(--color-accent)' }}
                  onClick={() => openSheet(idx())}
                >
                  <div class="ava">
                    <Show when={pc.avatar} fallback={<span class="mono">{monogram()}</span>}>
                      <span class="ava-emoji">{pc.avatar}</span>
                    </Show>
                    <span class="cls"><i class={`ph ${classIcon(pc.class)}`} /></span>
                  </div>
                  <div class="pi">
                    <div class="nmrow">
                      <span class="nm">{pc.name}</span>
                      <span class="lv">{classAbbr(pc.class)} {pc.level}</span>
                      <span class="st">
                        <Show when={pc.concentration}>
                          <i class="ph ph-target warn" title={`Concentrating: ${pc.concentration.spell || pc.concentration}`} />
                        </Show>
                        <Show when={(pc.conditions?.length || 0) > 0}>
                          <i class="ph ph-warning-circle" title={(pc.conditions || []).map(c => c.name || c).join(', ')} />
                        </Show>
                        <Show when={pc.exhaustion > 0}>
                          <i class="ph ph-moon warn" title={`Exhaustion ${pc.exhaustion}`} />
                        </Show>
                        <Show when={canLevelUp()}>
                          <button class="levelup-star" onClick={(e) => { e.stopPropagation(); openLevelUp(idx()); }} title="Level up available">
                            <i class="ph ph-star ok" />
                          </button>
                        </Show>
                      </span>
                    </div>
                    <div class="hp">
                      <div class="bar"><div class="fill" style={{ width: `${hpPct()}%`, background: hpColor() }} /></div>
                      <span class="n">{pc.hp}/{pc.hpMax}{pc.hpTemp > 0 ? <span class="tile-temp">+{pc.hpTemp}</span> : ''}</span>
                      <span class="acm"><i class="ph ph-shield" />{pc.ac}</span>
                    </div>
                    <Show when={hasDeathSaves()}>
                      <div class="tile-death-saves">
                        <span class="ds-success">{'O'.repeat(pc.deathSaves.successes)}{'·'.repeat(3 - pc.deathSaves.successes)}</span>
                        <span class="ds-failure">{'X'.repeat(pc.deathSaves.failures)}{'·'.repeat(3 - pc.deathSaves.failures)}</span>
                      </div>
                    </Show>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </Show>

      <Show when={sheetOpen()}>
        <div class="sheet-overlay" onClick={() => setSheetOpen(false)}>
          <div class="sheet-panel" onClick={(e) => e.stopPropagation()}>
            <CharSheet initialPC={sheetPC()} onClose={() => setSheetOpen(false)} />
          </div>
        </div>
      </Show>

      <Show when={levelUpPC() !== null}>
        <div class="sheet-overlay" onClick={() => setLevelUpPC(null)}>
          <div class="sheet-panel" onClick={(e) => e.stopPropagation()}>
            <LevelUp pcIndex={levelUpPC()} onClose={() => setLevelUpPC(null)} />
          </div>
        </div>
      </Show>
    </>
  );
}
