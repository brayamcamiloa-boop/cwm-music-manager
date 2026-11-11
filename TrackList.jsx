export default function TrackList({ tracks, activeTrackId, onPlay, onDelete, onEdit, emptyTitle, emptyText }) {
  if (tracks.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">♫</span>
        <h3>{emptyTitle}</h3>
        <p>{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="track-list">
      {tracks.map((track, index) => (
        <article className={`track-row ${activeTrackId === track.id ? 'is-playing' : ''}`} key={track.id}>
          <button className="track-play" onClick={() => onPlay(track.id)} aria-label={`Reproducir ${track.title}`}>
            {activeTrackId === track.id ? 'Ⅱ' : '▶'}
          </button>
          {track.coverUrl
            ? <img className="track-cover" src={track.coverUrl} alt="" />
            : <div className={`track-cover cover-color-${index % 4}`} aria-hidden="true"><span>♫</span></div>}
          <div className="track-meta"><strong>{track.title}</strong><span>{track.producerName || 'Sin productor'}</span></div>
          <span className="track-genre">{track.genre || 'Sin género'}</span>
          {track.bpm ? <span className="track-bpm">{track.bpm} <small>BPM</small></span> : <span className="track-bpm muted">—</span>}
          <span className="track-duration">{formatDuration(track.duration)}</span>
          <div className="track-actions">
            {onEdit && <button className="edit-track" onClick={() => onEdit(track)} aria-label={`Editar ${track.title}`} title="Editar tema">✎</button>}
            <button className="delete-track" onClick={() => onDelete(track.id)} aria-label={`Eliminar ${track.title}`} title="Eliminar tema">×</button>
          </div>
        </article>
      ))}
    </div>
  );
}
function formatDuration(seconds) {
  if (!seconds) return '—:—';
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}