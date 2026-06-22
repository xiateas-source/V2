import { store, setStore } from '../state/index.js';
import { estimateTokens } from './providers.js';
import { createNarrativeMsg, isPlayMsg } from './messages.js';

const MAX_NARRATIVE_TOKENS = 12000;
const PRUNE_TARGET_TOKENS = 8000;
const MIN_MESSAGES_KEEP = 4;

export async function pruneIfNeeded(chatKey = 'narrative') {
  const messages = store.campaign[chatKey];
  if (!messages || messages.length <= MIN_MESSAGES_KEEP) return;

  const totalTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content || ''), 0);
  if (totalTokens <= MAX_NARRATIVE_TOKENS) return;

  const playMessages = messages.filter(m => isPlayMsg(m));
  if (playMessages.length <= MIN_MESSAGES_KEEP) return;

  const toSummarize = [];
  let tokenCount = 0;
  let cutIndex = 0;

  for (let i = messages.length - 1; i >= 0; i--) {
    tokenCount += estimateTokens(messages[i].content || '');
    if (tokenCount >= PRUNE_TARGET_TOKENS) {
      cutIndex = i;
      break;
    }
  }

  if (cutIndex <= 0) return;

  for (let i = 0; i < cutIndex; i++) {
    if (isPlayMsg(messages[i])) {
      toSummarize.push(messages[i]);
    }
  }

  if (toSummarize.length === 0) return;

  const summary = buildLocalSummary(toSummarize);
  const kept = messages.slice(cutIndex);
  const summaryMsg = createNarrativeMsg('system', `[PRIOR CONTEXT SUMMARY]\n${summary}`, { isSummary: true });

  setStore('campaign', chatKey, [summaryMsg, ...kept]);
}

function buildLocalSummary(messages) {
  const events = [];
  let lastLocation = '';

  for (const msg of messages) {
    if (msg.type === 'player') {
      events.push(`Player: ${truncate(msg.content, 80)}`);
    } else if (msg.type === 'dm' || msg.type === 'dm_advisory') {
      const locMatch = msg.content.match(/Location:\s*(.+)/);
      if (locMatch && locMatch[1] !== lastLocation) {
        lastLocation = locMatch[1].trim();
        events.push(`Moved to: ${lastLocation}`);
      }

      if (msg.mechanics) {
        const notable = (msg.mechanics.applied || [])
          .filter(m => m.applied && !['location', 'time', 'weather', 'none', 'loc_desc'].includes(m.key))
          .map(m => `${m.key}: ${m.value}`)
          .slice(0, 5);
        if (notable.length) {
          events.push(`[${notable.join('; ')}]`);
        }
      }

      if (msg.mechReceipt) {
        events.push(msg.mechReceipt);
      } else {
        const firstLine = msg.content.split('\n')[0];
        events.push(`DM: ${truncate(firstLine, 100)}`);
      }
    }
  }

  return events.slice(-16).join('\n');
}

function truncate(text, maxLen) {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}
