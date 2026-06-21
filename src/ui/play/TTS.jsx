import { Show } from 'solid-js';
import { speaking, autoRead, speak, stop, toggleAutoRead } from '../../audio/browserTTS.js';

export default function TTS(props) {
  function handleSpeak() {
    if (speaking()) {
      stop();
    } else if (props.text) {
      speak(props.text);
    }
  }

  return (
    <div class="tts-controls">
      <button
        class={`btn-tts ${speaking() ? 'tts-active' : ''}`}
        onClick={handleSpeak}
        disabled={!props.text}
        title={speaking() ? 'Stop' : 'Read aloud'}
      >
        {speaking() ? 'Stop' : 'Read'}
      </button>
      <button
        class={`btn-tts-auto ${autoRead() ? 'tts-auto-on' : ''}`}
        onClick={toggleAutoRead}
        title="Auto-read DM responses"
      >
        Auto
      </button>
    </div>
  );
}
