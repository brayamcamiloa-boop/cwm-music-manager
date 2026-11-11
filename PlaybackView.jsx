import { useMemo, useState } from 'react';

const RECOMMENDED_GENRES = ['Hip-hop', 'Jazz', 'Electrónica', 'Indie pop', 'Lo-fi', 'Rock', 'R&B', 'Reggaetón'];

const MIX_ART = [
  { className: 'mix-art-game', icon: '🎮', caption: 'PLAY / REPEAT' },
  { className: 'mix-art-stage', icon: '♫', caption: 'LIVE SESSIONS' },
  { className: 'mix-art-retro', icon: '▰', caption: 'SIDE A · SIDE B' },
];

export default function PlaybackView({ tracks, activeTrackId, onPlay, search }) {
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedMix, setSelectedMix] = useState('all');

  const genres = useMemo(() => {
    const savedGenres = [...new Set(tracks.map((track) => track.genre?.trim()).filter(Boolean))];
    return [...new Set([...savedGenres, ...RECOMMENDED_GENRES])];
  }, [tracks]);

  const mixes = useMemo(() => {
    const genresInLibrary = [...new Set(tracks.map((track) => track.genre?.trim()).filter(Boolean))];
    const firstGenre = genresInLibrary[0];
    return [
      {
        id: 'all',
        title: 'Tu biblioteca',
        subtitle: `${tracks.length} ${tracks.length === 1 ? 'tema' : 'temas'} en tu espacio`,
        count: tracks.length,
        art: MIX_ART[0],
        genre: '',
      },
      {
        id: 'recent',
        title: 'Últimos lanzamientos',
        subtitle: 'Lo más nuevo de tu estudio',
        count: Math.min(tracks.length, 5),
        art: MIX_ART[1],
        genre: '',
      },
      {
        id: 'genre',
        title: firstGenre || 'Descubre tu sonido',
        subtitle: firstGenre ? 'Tu género más reciente' : 'Empieza a crear tu colección',
        count: firstGenre ? tracks.filter((track) => track.genre?.trim() === firstGenre).length : 0,
        art: MIX_ART[2],
        genre: firstGenre || '',
      },
    ];
  }, [tracks]);

  const visibleTracks = useMemo(() => {
    let result = tracks;
    if (selectedGenre) result = result.filter((track) => track.genre?.trim().toLowerCase() === selectedGenre.toLowerCase());
    if (selectedMix === 'recent') result = result.slice(0, 5);
    return result;
  }, [tracks, selectedGenre, selectedMix]);

  function chooseMix(mix) {
    setSelectedMix(mix.id);
    setSelectedGenre(mix.genre);
  }

  function chooseGenre(genre) {
    setSelectedGenre((current) => current === genre ? '' : genre);
    setSelectedMix('all');
  }

  return (
    <section className="playback-page">
      <div className="playback-glow playback-glow-one" />
      <div className="playback-glow playback-glow-two" />
      <div className="playback-workspace">
        <main className="playback-main">
          <div className="playback-heading">
            <div>
              <span className="playback-kicker">CWM · TU ESPACIO DE ESCUCHA <span className="headphone-sparkle" aria-hidden="true">✦</span></span>
              <h1>Especialmente <span>para ti</span></h1>
              <p>Entra en tu música. Dale play a lo que estás creando.</p>
            </div>
            <div className="playback-heading-mark" aria-hidden="true">♫</div>
            <span className="playback-graffiti playback-graffiti-left" aria-hidden="true">PLAY<br />LOUD!</span>
            <span className="playback-graffiti playback-graffiti-right" aria-hidden="true">🎸</span>
          </div>

          <div className="mix-grid" aria-label="Colecciones destacadas">
            {mixes.map((mix) => (
              <button
                type="button"
                key={mix.id}
                className={`mix-card ${selectedMix === mix.id ? 'mix-card-selected' : ''}`}
                onClick={() => chooseMix(mix)}
              >
                <span className={`mix-art ${mix.art.className}`}>
                  <span className="mix-art-caption">{mix.art.caption}</span>
                  {mix.art.icon}
                  {mix.id === 'all' && <span className="mix-art-orbit" />}
                  <span className="mix-count">♫ {mix.count}</span>
                </span>
                <span className="mix-card-title">{mix.title}</span>
                <span className="mix-card-subtitle">{mix.subtitle}</span>
              </button>
            ))}
          </div>

          <div className="playlist-heading">
            <div>
              <span className="playback-kicker">TU COLECCIÓN</span>
              <h2>{selectedGenre || (selectedMix === 'recent' ? 'Últimos lanzamientos' : 'Tus temas')}</h2>
            </div>
            <button type="button" className="playlist-action" onClick={() => { setSelectedGenre(''); setSelectedMix('all'); }}>
              Ver todo <span aria-hidden="true">↗</span>
            </button>
          </div>

          {visibleTracks.length === 0 ? (
            <div className="playback-empty">
              <span className="playback-empty-icon">♫</span>
              <strong>{search || selectedGenre ? 'No encontramos temas' : 'Tu próxima canción empieza aquí'}</strong>
              <p>{search || selectedGenre ? 'Prueba con otro género o búsqueda.' : 'Cuando agregues música a CWM, aparecerá aquí lista para reproducirse.'}</p>
            </div>
          ) : (
            <div className="playback-track-list">
              <div className="playback-track-header">
                <span>#</span><span>Título</span><span>Productor</span><span>Género</span><span aria-label="Duración">◷</span>
              </div>
              {visibleTracks.map((track, index) => (
                <button
                  type="button"
                  className={`playback-track-row ${track.id === activeTrackId ? 'playing' : ''}`}
                  key={track.id}
                  onClick={() => onPlay(track.id)}
                  aria-label={`Reproducir ${track.title} de ${track.producerName}`}
                >
                  <span className="playback-track-number">
                    {track.id === activeTrackId ? <span className="playing-bars"><i /><i /><i /></span> : String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="playback-track-title">
                    {track.coverUrl ? <img src={track.coverUrl} alt="" /> : <span className={`mini-cover mini-cover-${index % 3}`}>♫</span>}
                    <span><strong>{track.title}</strong><small>{track.fileName || 'Tema de tu biblioteca'}</small></span>
                  </span>
                  <span className="playback-track-producer">{track.producerName || 'Sin productor'}</span>
                  <span className="playback-track-genre">{track.genre || '—'}</span>
                  <span className="playback-track-duration">{formatDuration(track.duration)}</span>
                </button>
              ))}
            </div>
          )}
        </main>

        <aside className="playback-aside">
          <div className="genre-heading">
            <div><span className="playback-kicker">POR DÓNDE VAMOS</span><h2>Géneros</h2></div>
            <span className="genre-equalizer" aria-hidden="true"><i /><i /><i /><i /></span>
          </div>
          <div className="genre-cloud">
            {genres.map((genre, index) => (
              <button
                type="button"
                className={`genre-chip genre-chip-${index % 5} ${selectedGenre === genre ? 'selected' : ''}`}
                key={genre}
                onClick={() => chooseGenre(genre)}
                aria-pressed={selectedGenre === genre}
              >
                {genre}
              </button>
            ))}
          </div>
          <div className="aside-now-playing">
            <span className="now-playing-disc" aria-hidden="true">♫</span>
            <span>SONIDO CWM</span>
            <strong>Tu ritmo.<br />Tus reglas.</strong>
            <i aria-hidden="true">✳</i>
          </div>
        </aside>
      </div>
    </section>
  );
}

function formatDuration(seconds) {
  if (!seconds) return '—:—';
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
