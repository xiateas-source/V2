import { createSignal, Show } from 'solid-js';

export default function DiceRoller() {
  const [result, setResult] = createSignal(null);
  const [rolling, setRolling] = createSignal(false);

  function roll(sides) {
    setRolling(true);
    setTimeout(() => {
      const value = Math.floor(Math.random() * sides) + 1;
      setResult({ sides, value });
      setRolling(false);
    }, 200);
  }

  return (
    <div class="dice-roller">
      <div class="dice-buttons">
        <button class="dice-btn" onClick={() => roll(4)}>d4</button>
        <button class="dice-btn" onClick={() => roll(6)}>d6</button>
        <button class="dice-btn" onClick={() => roll(8)}>d8</button>
        <button class="dice-btn" onClick={() => roll(10)}>d10</button>
        <button class="dice-btn" onClick={() => roll(12)}>d12</button>
        <button class="dice-btn" onClick={() => roll(20)}>d20</button>
        <button class="dice-btn" onClick={() => roll(100)}>d100</button>
      </div>
      <Show when={result()}>
        <div class={`dice-result ${rolling() ? 'dice-rolling' : ''}`}>
          <span class="dice-label">d{result().sides}</span>
          <span class={`dice-value ${result().sides === 20 && result().value === 20 ? 'nat-20' : ''} ${result().sides === 20 && result().value === 1 ? 'nat-1' : ''}`}>
            {result().value}
          </span>
        </div>
      </Show>
    </div>
  );
}
