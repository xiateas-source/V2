// Shared inline SVG icons. The d20 is the app's signature mark — used on the
// Play nav item, the quick-actions dice button, and roll cards.

export function D20(props) {
  return (
    <svg class={`d20 ${props.class || ''}`} viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="12,1.5 21.1,6.75 21.1,17.25 12,22.5 2.9,17.25 2.9,6.75" />
      <polygon class="face" points="12,6 17.5,15.5 6.5,15.5" />
      <path d="M12,1.5 L12,6 M21.1,6.75 L17.5,15.5 M2.9,6.75 L6.5,15.5 M21.1,17.25 L17.5,15.5 M2.9,17.25 L6.5,15.5 M12,22.5 L6.5,15.5 M12,22.5 L17.5,15.5" />
    </svg>
  );
}
