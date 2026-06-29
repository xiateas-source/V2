import { createSignal, Show } from 'solid-js';
import { store, setStore } from '../../state/index.js';
import KeyGate from './KeyGate.jsx';
import CharCreate from './CharCreate.jsx';
import CampaignConfig from './CampaignConfig.jsx';
import { loadDemoCampaign } from '../../data/demo.js';
import { joinCampaign } from '../../data/sync.js';

export default function PlayerOnboard() {
  const [step, setStep] = createSignal(store.system.providers.geminiKey ? 1 : 0);
  const [joiningMode, setJoiningMode] = createSignal(false);
  const [joinCode, setJoinCode] = createSignal('');
  const [joinError, setJoinError] = createSignal('');
  const [joining, setJoining] = createSignal(false);

  // Check for an invite link in the URL (e.g. ?join=uid~campaignId)
  const urlCode = new URLSearchParams(window.location.search).get('join');
  if (urlCode && !joiningMode()) {
    setJoiningMode(true);
    setJoinCode(urlCode);
    // Clean the URL so a reload doesn't re-trigger
    window.history.replaceState({}, '', window.location.pathname);
  }

  const hasKey = () => !!store.system.providers.geminiKey || !!store.system.providers.openrouterKey;
  const hasChar = () => store.campaign.characters.length > 0;

  function onKeyDone() { setStep(1); }
  function onCharDone() { setStep(2); }

  async function handleJoin() {
    const code = joinCode().trim();
    if (!code) return;
    setJoining(true);
    setJoinError('');
    try {
      await joinCampaign(code);
      // Campaign is now loaded — App will render Chat automatically
    } catch (e) {
      setJoinError(e.message || 'Could not join. Check the code and try again.');
    } finally {
      setJoining(false);
    }
  }

  function startAdventure() {
    const name = store.campaign.name || `${store.campaign.characters[0]?.name || 'New'}'s Adventure`;
    if (!store.campaign.name) setStore('campaign', 'name', name);
    if (!store.campaign.id) {
      const cid = `camp_${Date.now()}`;
      setStore('campaign', 'id', cid);
      setStore('system', 'activeCampaignId', cid);
    }
    for (let i = 0; i < store.campaign.characters.length; i++) {
      const pc = store.campaign.characters[i];
      if (pc.hp === 0 && pc.hpMax > 0) {
        setStore('campaign', 'characters', i, 'hp', pc.hpMax);
      }
      if (pc.spellSlots && !pc.currentSlots) {
        setStore('campaign', 'characters', i, 'currentSlots', { ...pc.spellSlots });
      }
    }
  }

  return (
    <div class="onboard-shell">
      <Show when={!joiningMode()}>
        <div class="onboard-steps">
          <span class={`onboard-dot ${step() >= 0 ? 'done' : ''} ${step() === 0 ? 'active' : ''}`} onClick={() => step() > 0 && setStep(0)} />
          <span class={`onboard-dot ${step() >= 1 ? 'done' : ''} ${step() === 1 ? 'active' : ''}`} onClick={() => hasKey() && setStep(1)} />
          <span class={`onboard-dot ${step() >= 2 ? 'done' : ''} ${step() === 2 ? 'active' : ''}`} onClick={() => hasKey() && hasChar() && setStep(2)} />
        </div>

        <div class="onboard-content">
          <Show when={step() === 0}><KeyGate onDone={onKeyDone} /></Show>
          <Show when={step() === 1}><CharCreate onDone={onCharDone} /></Show>
          <Show when={step() === 2}><CampaignConfig /></Show>
        </div>

        <div class="onboard-footer">
          <Show when={step() === 0}>
            <button class="onboard-demo-btn" onClick={loadDemoCampaign}>
              Skip — load the demo party &amp; play
            </button>
            <button class="onboard-join-btn" onClick={() => setJoiningMode(true)}>
              Join a friend's game →
            </button>
          </Show>
          <Show when={step() === 1 && !hasChar()}>
            <span class="onboard-hint">Create at least one character to continue</span>
          </Show>
          <Show when={step() === 1 && hasChar()}>
            <button class="onboard-btn" onClick={onCharDone}>Next</button>
          </Show>
          <Show when={step() === 2}>
            <button class="onboard-btn onboard-btn-go" onClick={startAdventure}>Start Adventure</button>
          </Show>
        </div>
      </Show>

      <Show when={joiningMode()}>
        <div class="join-shell">
          <div class="join-header">
            <button class="join-back" onClick={() => { setJoiningMode(false); setJoinError(''); }}>
              ← Back
            </button>
            <h2 class="join-title">Join a Game</h2>
          </div>
          <p class="join-hint">Paste the invite code your party host shared with you.</p>
          <textarea
            class="join-input"
            placeholder="Paste invite code here…"
            value={joinCode()}
            onInput={(e) => setJoinCode(e.target.value)}
            rows="3"
            autofocus
          />
          <Show when={joinError()}>
            <p class="join-error">{joinError()}</p>
          </Show>
          <button
            class="join-go-btn"
            onClick={handleJoin}
            disabled={!joinCode().trim() || joining()}
          >
            {joining() ? 'Joining…' : 'Join Game'}
          </button>
          <p class="join-key-note">
            The host's API key is shared automatically — no setup needed to start playing.
          </p>
        </div>
      </Show>
    </div>
  );
}
