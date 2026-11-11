const STICKERS = [
  { art: '👾', className: 'sticker-alien', label: 'Alien beat' },
  { art: '🎸', className: 'sticker-guitar', label: 'Rock guitar' },
  { art: '🛸', className: 'sticker-ufo', label: 'UFO' },
  { art: '💿', className: 'sticker-record', label: 'Vinyl record' },
  { art: '🦇', className: 'sticker-bat', label: 'Bat' },
  { art: '🍒', className: 'sticker-cherries', label: 'Cherries' },
  { art: '💀', className: 'sticker-skull', label: 'Skull' },
  { art: '🎹', className: 'sticker-keys', label: 'Keyboard' },
];

export default function DecorativeOverlay() {
  return (
    <div className="decorative-overlay" aria-hidden="true">
      {STICKERS.map((sticker) => (
        <span className={`floating-sticker ${sticker.className}`} key={sticker.className} title={sticker.label}>
          <i>{sticker.art}</i>
        </span>
      ))}
      <span className="edge-doodle doodle-left">♪<br />♫<br />♪</span>
      <span className="edge-doodle doodle-right">✳<br />✦<br />✳</span>
      <span className="spray-paint spray-one">LOUD</span>
      <span className="spray-paint spray-two">CWM!</span>
    </div>
  );
}
