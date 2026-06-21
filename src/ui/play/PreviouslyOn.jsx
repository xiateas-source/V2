import { createSignal, Show } from 'solid-js';
import { store } from '../../state/index.js';

export default function PreviouslyOn() {
  const [dismissed, setDismissed] = createSignal(false);

  const recap = () => {
    if (dismissed()) return null;
    const narrative = store.campaign.narrative || [];
    if (narrative.length < 3) return null;

    const last = narrative[narrative.length - 1];
    if (!last) return null;
    const age = Date.now() - (last.ts || 0);
    if (age < 60 * 60 * 1000) return null;

    const loc = store.campaign.location || '';
    const time = store.campaign.time || '';
    const quests = store.campaign.quests?.filter(q => q.status === 'active') || [];
    const consequences = store.campaign.consequences?.filter(c => !c.resolved) || [];
    const chars = store.campaign.characters || [];

    const lastAssistant = [...narrative].reverse().find(m => m.role === 'assistant');
    const lastAction = [...narrative].reverse().find(m => m.role === 'user');
    const storySnippet = lastAssistant ? lastAssistant.content.split('\n')[0].slice(0, 120) : '';
    const playerAction = lastAction ? lastAction.content.slice(0, 80) : '';

    const partyStatus = chars.map(pc => {
      const hpPct = pc.hpMax ? Math.round((pc.hp / pc.hpMax) * 100) : 100;
      const status = hpPct > 75 ? 'healthy' : hpPct > 25 ? 'wounded' : 'critical';
      const conds = pc.conditions.length ? ` (${pc.conditions.map(c => c.name || c).join(', ')})` : '';
      return `${pc.name}: ${status}${conds}`;
    }).join(' | ');

    return {
      location: loc,
      time,
      storySnippet,
      playerAction,
      partyStatus,
      questCount: quests.length,
      urgentCount: consequences.length,
      topQuest: quests[0]?.text?.slice(0, 60) || '',
      topConsequence: consequences[0]?.text?.slice(0, 60) || '',
    };
  };

  return (
    <Show when={recap()}>
      <div class="previously-on">
        <div class="po-header">
          <span class="po-title">Previously On...</span>
          <button class="po-dismiss" onClick={() => setDismissed(true)}>&times;</button>
        </div>
        <div class="po-body">
          <Show when={recap().location}>
            <div class="po-line"><span class="po-label">Location</span> {recap().location}{recap().time ? `, ${recap().time}` : ''}</div>
          </Show>
          <Show when={recap().partyStatus}>
            <div class="po-line"><span class="po-label">Party</span> {recap().partyStatus}</div>
          </Show>
          <Show when={recap().storySnippet}>
            <div class="po-line po-story">{recap().storySnippet}{recap().storySnippet.length >= 120 ? '...' : ''}</div>
          </Show>
          <Show when={recap().playerAction}>
            <div class="po-line"><span class="po-label">You said</span> "{recap().playerAction}{recap().playerAction.length >= 80 ? '...' : ''}"</div>
          </Show>
          <Show when={recap().questCount > 0}>
            <div class="po-line"><span class="po-label">Quests</span> {recap().questCount} active{recap().topQuest ? ` — ${recap().topQuest}` : ''}</div>
          </Show>
          <Show when={recap().urgentCount > 0}>
            <div class="po-line po-urgent"><span class="po-label">Urgent</span> {recap().topConsequence}</div>
          </Show>
        </div>
      </div>
    </Show>
  );
}
