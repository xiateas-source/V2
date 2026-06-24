import { createSignal, Show } from 'solid-js';
import { store, setStore } from '../../state/index.js';
import KeyGate from './KeyGate.jsx';
import CharCreate from './CharCreate.jsx';
import CampaignConfig from './CampaignConfig.jsx';
import { loadDemoCampaign } from '../../data/demo.js';

export default function PlayerOnboard() {
  const [step, setStep] = createSignal(store.system.providers.geminiKey ? 1 : 0);

  const hasKey = () => !!store.system.providers.geminiKey || !!store.system.providers.openrouterKey;
  const hasChar = () => store.campaign.characters.length > 0;

  function onKeyDone() {
    setStep(1);
  }

  function onCharDone() {
    setStep(2);
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
      <div class="onboard-steps">
        <span class={`onboard-dot ${step() >= 0 ? 'done' : ''} ${step() === 0 ? 'active' : ''}`} onClick={() => step() > 0 && setStep(0)} />
        <span class={`onboard-dot ${step() >= 1 ? 'done' : ''} ${step() === 1 ? 'active' : ''}`} onClick={() => hasKey() && setStep(1)} />
        <span class={`onboard-dot ${step() >= 2 ? 'done' : ''} ${step() === 2 ? 'active' : ''}`} onClick={() => hasKey() && hasChar() && setStep(2)} />
      </div>

      <div class="onboard-content">
        <Show when={step() === 0}>
          <KeyGate onDone={onKeyDone} />
        </Show>
        <Show when={step() === 1}>
          <CharCreate onDone={onCharDone} />
        </Show>
        <Show when={step() === 2}>
          <CampaignConfig />
        </Show>
      </div>

      <div class="onboard-footer">
        <Show when={step() === 0}>
          <button class="onboard-demo-btn" onClick={loadDemoCampaign}>
            Skip — load the demo party &amp; play
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
    </div>
  );
}
