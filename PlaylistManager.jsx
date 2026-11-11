import { useMemo, useState } from 'react';

export default function PlaylistManager({ playlists, tracks, onSave, onDelete, onPlay }) {
  const [name, setName] = useState('');
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [editingId, setEditingId] = useState('');
  const trackMap = useMemo(() => new Map(tracks.map((track) => [track.id, track])), [tracks]);

  function toggleTrack(trackId) {
    setSelectedTracks((current) => current.includes(trackId)
      ? current.filter((id) => id !== trackId)
      : [...current, trackId]);
  }

  function createPlaylist(event) {
    event.preventDefault();
    const title = name.trim();
    if (!title) return;
    const saved = onSave({
      id: editingId || crypto.randomUUID(),
      name: title,
      trackIds: selectedTracks,
      createdAt: playlists.find((playlist) => playlist.id === editingId)?.createdAt || new Date().toISOString(),
    });
    if (saved === false) return;
    setName('');
    setSelectedTracks([]);
    setEditingId('');
  }

  function editPlaylist(playlist) {
    setEditingId(playlist.id);
    setName(playlist.name);
    setSelectedTracks(playlist.trackIds);
  }

  return (
    <div className="playlist-page">
      <section className="playlist-hero">
        <span className="eyebrow">CWM · ARMA TU PROPIO FLOW</span>
        <h1>Playlists para cada mood <span>🎛️</span></h1>
        <p>Junta tus temas en colecciones para ensayos, lanzamientos y noches largas.</p>
        <span className="playlist-hero-art" aria-hidden="true">♫</span>
      </section>
      <div className="playlist-create-layout">
        <section className="content-card playlist-create-card">
          <div className="section-heading"><div><span className="eyebrow">NUEVA COLECCIÓN</span><h2>Crea una playlist <span>✨</span></h2></div></div>
          <form onSubmit={createPlaylist}>
            <label className="field-label">Nombre de la playlist
              <input required maxLength="70" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Beats de madrugada" />
            </label>
            <span className="playlist-select-label">Elige temas para incluir</span>
            {tracks.length === 0 ? <p className="playlist-no-tracks">Primero agrega temas a tu biblioteca.</p> : (
              <div className="playlist-track-picker">
                {tracks.map((track) => (
                  <label className="playlist-track-option" key={track.id}>
                    <input type="checkbox" checked={selectedTracks.includes(track.id)} onChange={() => toggleTrack(track.id)} />
                    <span className="playlist-picker-art">♫</span>
                    <span><strong>{track.title}</strong><small>{track.producerName || 'Sin productor'}</small></span>
                  </label>
                ))}
              </div>
            )}
            <div className="playlist-form-actions">
              {editingId && <button className="button button-outline" type="button" onClick={() => { setEditingId(''); setName(''); setSelectedTracks([]); }}>Cancelar</button>}
              <button className="button button-primary playlist-create-button" type="submit" disabled={!name.trim()}>{editingId ? 'Guardar cambios' : 'Crear playlist'} <span>{editingId ? '✓' : '＋'}</span></button>
            </div>
          </form>
        </section>
        <section className="playlist-collection">
          <div className="section-heading"><div><span className="eyebrow">TU SELECCIÓN</span><h2>Mis playlists <span className="count-pill">{playlists.length}</span></h2></div></div>
          {playlists.length === 0 ? (
            <div className="content-card playlist-empty"><span>📼</span><strong>Tu siguiente mood empieza aquí.</strong><p>Crea una playlist para ordenar tus canciones.</p></div>
          ) : playlists.map((playlist, index) => {
            const playlistTracks = playlist.trackIds.map((id) => trackMap.get(id)).filter(Boolean);
            return (
              <article className={`content-card playlist-card playlist-card-${index % 4}`} key={playlist.id}>
                <div className="playlist-cover"><span>♫</span><i>{['✦', '✳', '⚡', '☾'][index % 4]}</i></div>
                <div className="playlist-details">
                  <span className="eyebrow">PLAYLIST · {playlistTracks.length} TEMAS</span>
                  <h3>{playlist.name}</h3>
                  <div className="playlist-track-chips">{playlistTracks.length ? playlistTracks.slice(0, 4).map((track) => <span key={track.id}>{track.title}</span>) : <small>Agrega temas editando esta playlist</small>}</div>
                  <div className="playlist-card-actions">
                    {playlistTracks.length > 0 && <button className="text-button" onClick={() => onPlay(playlist.trackIds)}>▶ Reproducir colección</button>}
                    <button className="text-button" onClick={() => editPlaylist(playlist)}>Editar playlist ✎</button>
                  </div>
                </div>
                <button className="delete-track playlist-delete" onClick={() => onDelete(playlist.id)} aria-label={`Eliminar playlist ${playlist.name}`} title="Eliminar playlist">×</button>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
