import { createSignal, createEffect, For, Show } from 'solid-js';
import { store } from '../../state/index.js';
import { isSending } from '../../ai/engine.js';
import InputBar from './InputBar.jsx';
import RollBar from './RollBar.jsx';
import CharTiles from './CharTiles.jsx';
import ContextBanner from './ContextBanner.jsx';
import PreviouslyOn from './PreviouslyOn.jsx';
import SituationBar from './SituationBar.jsx';
import Combat from './Combat.jsx';
import Rewind from './Rewind.jsx';
import TTS from './TTS.jsx';
import { autoRead, speak } from '../../audio/browserTTS.js';

export default function Chat() {
  const [tab, setTab] = createSignal('narrative');
  let chatEnd;
  let messagesDiv;

  const messages = () => {
    const key = tab();
    return store.campaign[key] || [];
  };

  const lastAssistantMsg = () => {
    const msgs = messages();
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'assistant') return msgs[i].content;
    }
    return '';
  };

  let wasSending = false;

  createEffect(() => {
    messages();
    const sending = isSending();

    if (wasSending && !sending && autoRead()) {
      const msgs = messages();
      const last = msgs[msgs.length - 1];
      if (last && last.role === 'assistant') {
        speak(last.content);
      }
    }
    wasSending = sending;

    setTimeout(() => {
      if (messagesDiv) {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }
    }, 50);
  });

  return (
    <div class="chat-container">
      <PreviouslyOn />
      <ContextBanner />
      <CharTiles />
      <SituationBar />

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
          Ask DM
        </button>
        <TTS text={lastAssistantMsg()} />
      </div>

      <div class="chat-messages" ref={messagesDiv}>
        <For each={messages()}>
          {(msg) => (
            <div class={`msg msg-${msg.role}`}>
              <Show when={msg.isSummary}>
                <div class="msg-summary-badge">Prior context</div>
              </Show>
              <div class="msg-content" innerHTML={formatMsg(msg.content)} />
              <Show when={msg.driftWarnings?.length > 0}>
                <div class="drift-warnings">
                  <For each={msg.driftWarnings}>
                    {(w) => <span class="drift-pill">{w.text}</span>}
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

      <Combat />
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
      if (label) items.push({ label, type: 'applied' });
    }
    for (const m of rejected) {
      items.push({ label: `${m.key}: ${m.reason}`, type: 'rejected' });
    }
    return items;
  };

  return (
    <Show when={pills().length > 0}>
      <div class="mech-pills">
        <For each={pills()}>
          {(p) => <span class={`mech-pill pill-${p.type}`}>{p.label}</span>}
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

function formatMsg(text) {
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
  html = html.replace(/\n{3,}/g, '\n\n');
  html = html.replace(/\n/g, '<br>');

  return html.trim();
}
