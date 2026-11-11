export default function Header({ title, search, onSearch, trackCount, partyMode, onToggleParty }) {
  return (
    <header className="topbar">
      <div className="breadcrumb"><span>CWM</span><span className="breadcrumb-divider">/</span><strong>{title}</strong></div>
      <div className="sticker-strip" aria-hidden="true">
        <span>🎃</span><span>👻</span><span>⚡</span><span>🦇</span><span>🎵</span><span>👾</span><span>💀</span><span>🍕</span><span>🛸</span>
      </div>
      <div className="topbar-actions">
        <button
          type="button"
          className={`vibe-toggle ${partyMode ? 'is-on' : ''}`}
          onClick={onToggleParty}
          aria-pressed={partyMode}
          title={partyMode ? 'Cambiar a modo chill' : 'Activar modo fiesta'}
        >
          <span aria-hidden="true">{partyMode ? '🔥' : '✨'}</span>
          <span>{partyMode ? 'VIBE ON' : 'VIBE?'}</span>
        </button>
        <label className="search-field">
          <span aria-hidden="true">⌕</span>
          <input type="search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar temas, productores..." aria-label="Buscar temas" />
          <kbd>⌘ K</kbd>
        </label>
        <div className="topbar-divider" />
        <button className="icon-button notification-button" aria-label="Notificaciones" title="Notificaciones">♧<i /></button>
        <div className="user-chip"><span className="user-avatar">ES</span><span className="user-name">Mi estudio<small>{trackCount} temas</small></span><span className="chevron">⌄</span></div>
      </div>
    </header>
  );
}