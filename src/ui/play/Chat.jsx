import { createSignal, createEffect, createMemo, For, Show, onMount, onCleanup } from 'solid-js';
import { store } from '../../state/index.js';
import { isSending } from '../../ai/engine.js';
import { getAll } from '../../data/local.js';
import InputBar from './InputBar.jsx';
import RollBar from './RollBar.jsx';
import CharTiles from './CharTiles.jsx';
import ContextBanner from './ContextBanner.jsx';
import PreviouslyOn from './PreviouslyOn.jsx';
import SituationBar from './SituationBar.jsx';
import Combat from './Combat.jsx';
import TurnPrompt from './TurnPrompt.jsx';
import Rewind from './Rewind.jsx';
import TTS from './TTS.jsx';
import { autoRead, speak } from '../../audio/browserTTS.js';
import MechPill from '../shared/MechPill.jsx';
import { navigateTo } from '../shared/sourceBus.js';
import { validateMechanics, applyMechanics } from '../../ai/mechanics.js';

const [glossaryTerms, setGlossaryTerms] = createSignal([]);
const [spellList, setSpellList] = createSignal([]);
const [tooltip, setTooltip] = createSignal(null);

export default function Chat() {
  const [tab, setTab] = createSignal('narrative');
  const [newMsgCount, setNewMsgCount] = createSignal(0);
  let chatEnd;
  let messagesDiv;
  let isAtBottom = true;
  let lastMsgCount = 0;

  function showSpellTooltip(name) {
    const sp = spellList().find(s => (s.name || '').toLowerCase() === name.toLowerCase());
    if (sp) {
      const meta = [sp.level ? `Level ${sp.level}` : 'Cantrip', sp.school].filter(Boolean).join(' · ');
      const stats = [sp.castingTime && `Cast ${sp.castingTime}`, sp.range && `Range ${sp.range}`, sp.duration && `Duration ${sp.duration}`].filter(Boolean).join(' · ');
      setTooltip({ title: sp.name, body: `${meta}\n${stats}\n\n${sp.description || sp.content || ''}`.trim(), action: { label: 'Open Compendium', mode: 'journal' } });
    }
  }

  onMount(async () => {
    try {
      const terms = await getAll('glossary');
      setGlossaryTerms(terms);
    } catch (_) {}
    try {
      const spells = await getAll('spells');
      setSpellList(spells || []);
    } catch (_) {}

    window.addEventListener('spell-tooltip', (e) => showSpellTooltip(e.detail?.name));
    window.addEventListener('rest-request', handleRest);
  });

  onCleanup(() => window.removeEventListener('rest-request', handleRest));

  function handleRest(e) {
    const { type, pc } = e.detail || {};
    if (!pc) return;
    const key = type === 'long' ? 'long_rest' : 'short_rest';
    const label = type === 'long' ? 'Long Rest' : 'Short Rest';
    if (type === 'long' && !confirm(`${pc} takes a long rest (8 hours). HP restored, slots refilled, hit dice recovered. Continue?`)) return;
    const { valid } = validateMechanics([{ key, value: pc, target: '', applied: false }]);
    applyMechanics(valid);
    window.dispatchEvent(new CustomEvent('toast', { detail: { text: `${pc}: ${label} complete` } }));
  }

  const npcNames = createMemo(() =>
    store.campaign.npcs.filter(n => n.name && n.name.length > 2).map(n => n.name)
  );

  const messages = () => {
    const key = tab();
    return store.campaign[key] || [];
  };

  const lastAssistantMsg = () => {
    const msgs = messages();
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i];
      if (m.type === 'dm' || m.type === 'dm_advisory' || m.role === 'assistant') return m.content;
    }
    return '';
  };

  function handleChatClick(e) {
    const target = e.target;
    if (target.classList.contains('npc-link')) {
      const name = target.dataset.npc;
      const npc = store.campaign.npcs.find(n => n.name === name);
      if (npc) setTooltip({ title: npc.name, body: `${npc.disposition}${npc.details ? ' — ' + npc.details : ''}${npc.lastSeen ? '\nLast seen: ' + npc.lastSeen : ''}`, action: { label: 'View in Journal', mode: 'journal' } });
    } else if (target.classList.contains('term-link')) {
      const term = target.dataset.term;
      const entry = glossaryTerms().find(g => g.term.toLowerCase() === term.toLowerCase());
      if (entry) setTooltip({ title: entry.term, body: entry.definition });
    } else if (target.classList.contains('spell-link')) {
      const name = target.dataset.spell;
      const sp = spellList().find(s => (s.name || '').toLowerCase() === name.toLowerCase());
      if (sp) {
        const meta = [sp.level ? `Level ${sp.level}` : 'Cantrip', sp.school].filter(Boolean).join(' · ');
        const stats = [sp.castingTime && `Cast ${sp.castingTime}`, sp.range && `Range ${sp.range}`, sp.duration && `Duration ${sp.duration}`].filter(Boolean).join(' · ');
        setTooltip({ title: sp.name, body: `${meta}\n${stats}\n\n${sp.description || sp.content || ''}`.trim(), action: { label: 'Open Compendium', mode: 'journal' } });
      }
    }
  }

  let wasSending = false;

  function checkIfAtBottom() {
    if (!messagesDiv) return true;
    return messagesDiv.scrollHeight - messagesDiv.scrollTop - messagesDiv.clientHeight < 100;
  }

  function scrollToBottom() {
    if (messagesDiv) {
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
      setNewMsgCount(0);
    }
  }

  function onScroll() {
    isAtBottom = checkIfAtBottom();
    if (isAtBottom) setNewMsgCount(0);
  }

  createEffect(() => {
    const msgs = messages();
    const sending = isSending();

    if (wasSending && !sending && autoRead()) {
      const last = msgs[msgs.length - 1];
      if (last && (last.type === 'dm' || last.role === 'assistant')) {
        speak(last.content);
      }
    }
    wasSending = sending;

    const count = msgs.length;
    if (count > lastMsgCount && lastMsgCount > 0) {
      if (isAtBottom) {
        setTimeout(scrollToBottom, 50);
      } else {
        setNewMsgCount(prev => prev + (count - lastMsgCount));
      }
    } else if (count > 0 && lastMsgCount === 0) {
      setTimeout(scrollToBottom, 50);
    }
    lastMsgCount = count;
  });

  return (
    <div class="chat-container">
      <PreviouslyOn />
      <ContextBanner />
      <div class="hr" />
      <Show when={!store.campaign.combatState?.active}>
        <CharTiles />
        <SituationBar />
      </Show>
      <Combat />

      <div class="chat-tabs">
        <button
          class={tab() === 'narrative' ? 'tab active' : 'tab'}
          onClick={() => setTab('narrative')}
        >
          Narrative
        </button>
        <button
          class={tab() === 'ooc' ? 'tab active' : 'tab'}
          onClick={() => setTab('ooc')}
        >
          Table-talk
        </button>
        <TTS text={lastAssistantMsg()} />
      </div>

      <Show when={tooltip()}>
        <div class="tooltip-overlay" onClick={() => setTooltip(null)}>
          <div class="tooltip-popup" onClick={(e) => e.stopPropagation()}>
            <div class="tooltip-title">{tooltip().title}</div>
            <div class="tooltip-body">{tooltip().body}</div>
            <Show when={tooltip().action}>
              <button class="tooltip-action" onClick={() => { navigateTo(tooltip().action.mode); setTooltip(null); }}>
                {tooltip().action.label} <i class="ph ph-arrow-up-right" />
              </button>
            </Show>
          </div>
        </div>
      </Show>

      <div class="chat-messages" ref={messagesDiv} onClick={handleChatClick} onScroll={onScroll}>
        <For each={messages()}>
          {(msg) => (
            <div class={`msg msg-${msg.type || msg.role}${msg.systemKind === 'combat_event' ? ' msg-combat-event' : ''}`}>
              <Show when={msg.isSummary}>
                <div class="msg-summary-badge">Prior context</div>
              </Show>
              <Show when={msg.type === 'player' && msg.playerName && store.campaign.characters.length > 1}>
                <div class="msg-player-name">{msg.playerName}</div>
              </Show>
              <div class="msg-content" innerHTML={formatMsg(msg.content, npcNames())} />
              <Show when={msg.driftWarnings?.length > 0}>
                <div class="drift-warnings">
                  <For each={msg.driftWarnings}>
                    {(w) => <span class="drift-pill">{w.text}</span>}
                  </For>
                </div>
              </Show>
              <Show when={msg.gateFlags?.length > 0}>
                <div class="gate-flags">
                  <For each={msg.gateFlags}>
                    {(f) => <span class={`gate-flag gate-${f.gate}`}>{f.text}</span>}
                  </For>
                </div>
              </Show>
              <Show when={msg.mechanics}>
                <MechPills mechanics={msg.mechanics} />
              </Show>
            </div>
          )}
        </For>
        <Show when={isSending()}>
          <div class="msg msg-typing">
            <div class="typing-indicator">
              <span class="typing-dot" />
              <span class="typing-dot" />
              <span class="typing-dot" />
            </div>
          </div>
        </Show>
        <div ref={chatEnd} />
      </div>

      <Show when={newMsgCount() > 0}>
        <button class="new-msg-indicator" onClick={scrollToBottom}>
          &darr; {newMsgCount()} new message{newMsgCount() > 1 ? 's' : ''}
        </button>
      </Show>

      <TurnPrompt />
      <RollBar />
      <div class="input-area">
        <Rewind />
        <InputBar tab={tab()} />
      </div>
    </div>
  );
}

function MechPills(props) {
  const pills = () => {
    const { applied = [], rejected = [] } = props.mechanics || {};
    const items = [];
    for (const m of applied) {
      if (!m.applied) continue;
      const label = formatPill(m.key, m.value);
      if (label) items.push({ label, type: 'applied', mkey: m.key, value: m.value });
    }
    for (const m of rejected) {
      items.push({ label: `${m.key}: ${m.reason}`, type: 'rejected', mkey: m.key, value: m.value });
    }
    return items;
  };

  return (
    <Show when={pills().length > 0}>
      <div class="mech-pills">
        <For each={pills()}>
          {(p) => <MechPill mkey={p.mkey} value={p.value} label={p.label} type={p.type} />}
        </For>
      </div>
    </Show>
  );
}

function formatPill(key, value) {
  switch (key) {
    case 'hp': return `HP: ${value}`;
    case 'gp': return `Gold ${value}`;
    case 'income': return `+${value.split(',')[0]} GP`;
    case 'expense': return `-${value.split(',')[0]} GP`;
    case 'xp': return `XP: ${value}`;
    case 'conditions': return value;
    case 'concentration': {
      const [name, spell] = value.split('=');
      return spell?.toLowerCase() === 'none' ? `${name.trim()} ended conc.` : `${name.trim()} → ${spell}`;
    }
    case 'quest_add': return `Quest: ${value.slice(0, 40)}`;
    case 'quest_done': return `Quest done: ${value.slice(0, 30)}`;
    case 'quest_fail': return `Quest failed: ${value.slice(0, 30)}`;
    case 'npc_add': return `Met: ${value.split(',')[0]}`;
    case 'npc_mood': return `${value}`;
    case 'item_add': { const p = value.split(','); return `+${p[1] || p[0]}`; }
    case 'item_remove': { const p = value.split(','); return `-${p[1] || p[0]}`; }
    case 'combat_start': return 'Combat!';
    case 'combat_end': return 'Combat ended';
    case 'slot_use': return `Slot: ${value}`;
    case 'slot_restore': return `Slot restored: ${value}`;
    case 'resource_use': return `Used: ${value.split(',')[1] || value}`;
    case 'consequence_add': return `Consequence: ${value.split('|')[0].slice(0, 30)}`;
    case 'consequence_resolve': return `Resolved: ${value.slice(0, 30)}`;
    case 'roll_request': return `Roll: ${value.split('|')[0]}`;
    case 'short_rest': return `Short rest: ${value}`;
    case 'long_rest': return `Long rest: ${value}`;
    case 'death_save': return `Death save: ${value}`;
    case 'zone_add_enemy': return `Enemy: ${value.split('|')[0]}`;
    case 'zone_remove': return `Defeated: ${value}`;
    case 'spell_add': { const p = value.split('|'); return `Learned: ${p[1] || p[0]}`; }
    case 'chapter_add': return `Chapter: ${value.split('|')[0]}`;
    case 'town_rep': return `Rep: ${value.split(',').slice(0, 2).join(' ')}`;
    case 'familiar_hp': return `Familiar HP: ${value}`;
    case 'animal_hp': return `Animal: ${value}`;
    case 'hit_dice_use': return `HD: ${value}`;
    case 'inspiration': return `Inspiration: ${value.split(/[=+]/)[0]}`;
    case 'temp_hp': return `TempHP: ${value}`;
    case 'location': case 'time': case 'weather': case 'loc_desc':
    case 'primary_mission': case 'none': case 'round_advance':
    case 'location_add': case 'location_visit':
      return null;
    default: return `${key}: ${value.slice(0, 30)}`;
  }
}

function formatMsg(text, npcNames = []) {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/---MECHANICS---[\s\S]*?---END---/g, '');
  html = html.replace(/MECHANICS BLOCK:[\s\S]*?---END---/g, '');

  html = html.replace(/\*\*\*\n?/g, '<hr class="campaign-break">');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  for (const name of npcNames) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(`\\b(${escaped})\\b`, 'g'),
      `<span class="npc-link" data-npc="${name}">$1</span>`);
  }

  // Spell citations — link known spell names to their compendium entry.
  const spells = spellList();
  if (spells.length > 0) {
    const spellPattern = spells
      .map(s => s.name)
      .filter(n => n && n.length > 3)
      .sort((a, b) => b.length - a.length) // longest first, avoid partial overlaps
      .map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    if (spellPattern) {
      html = html.replace(new RegExp(`\\b(${spellPattern})\\b`, 'g'), (match, _g, offset, full) => {
        // Skip if we're inside an existing tag/attribute.
        const before = full.slice(0, offset);
        if ((before.match(/</g) || []).length > (before.match(/>/g) || []).length) return match;
        return `<span class="spell-link" data-spell="${match}">${match}</span>`;
      });
    }
  }

  const terms = glossaryTerms();
  if (terms.length > 0) {
    const termPattern = terms
      .filter(t => t.term.length > 3)
      .map(t => t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    if (termPattern) {
      html = html.replace(new RegExp(`\\b(${termPattern})\\b`, 'gi'), (match, _g, offset, full) => {
        const before = full.slice(0, offset);
        if ((before.match(/</g) || []).length > (before.match(/>/g) || []).length) return match;
        if (before.includes('data-spell="') && !before.includes('</span>', before.lastIndexOf('data-spell="'))) return match;
        return `<span class="term-link" data-term="${match}">${match}</span>`;
      });
    }
  }

  html = html.replace(/\n{3,}/g, '\n\n');
  html = html.replace(/\n/g, '<br>');

  return html.trim();
}
