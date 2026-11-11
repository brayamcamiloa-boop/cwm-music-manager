import { useEffect, useRef, useState } from 'react';

export default function AudioPlayer({
  track,
  tracks = [],
  onEnded,
  onPrevious,
  onNext,
  onShuffleNext,
  canPlayPrevious,
  canPlayNext,
  onNotice,
  onTrackStarted,
}) {
  const audioRef = useRef(null);
  const countedTrackId = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [favorites, setFavorites] = useState(() => new Set());
  const hasTrack = Boolean(track?.audioUrl);
  const isFavorite = Boolean(track && favorites.has(track.id));

  useEffect(() => {
    countedTrackId.current = null;
  }, [track?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setCurrentTime(0);
    setDuration(0);
    if (!hasTrack) {
      setIsPlaying(false);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      return;
    }

    audio.load();
    audio.play()
      .then(() => setIsPlaying(true))
      .catch((error) => {
        setIsPlaying(false);
        onNotice(`No se pudo iniciar la reproducción: ${error.message}`);
      });
  }, [track?.id, track?.audioUrl, hasTrack, onNotice]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio || !hasTrack) return;
    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        setIsPlaying(false);
        onNotice(`No se pudo reproducir el tema: ${error.message}`);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }

  function handleEnded() {
    if (isRepeat && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((error) => onNotice(`No se pudo repetir el tema: ${error.message}`));
      return;
    }
    if (isShuffle && onShuffleNext && tracks.length > 1) {
      onShuffleNext();
      return;
    }
    setIsPlaying(false);
    onEnded();
  }

  function seek(event) {
    const nextTime = Number(event.target.value);
    if (audioRef.current) audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function toggleFavorite() {
    if (!track) return;
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(track.id)) next.delete(track.id);
      else next.add(track.id);
      return next;
    });
  }

  const nextTrack = () => {
    if (isShuffle && onShuffleNext && tracks.length > 1) onShuffleNext();
    else onNext();
  };

  return (
    <footer className="audio-player" aria-label="Reproductor de música">
      {track?.audioUrl && (
        <audio
          ref={audioRef}
          src={track.audioUrl}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          onLoadedMetadata={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
          onPlay={() => {
            setIsPlaying(true);
            if (track?.id && countedTrackId.current !== track.id) {
              countedTrackId.current = track.id;
              onTrackStarted?.(track.id);
            }
          }}
          onPause={() => setIsPlaying(false)}
          onEnded={handleEnded}
          onError={() => onNotice('No se pudo cargar el archivo de audio de este tema.')}
        />
      )}
      <div className="player-track">
        {track?.coverUrl
          ? <img className="player-cover" src={track.coverUrl} alt="" />
          : <span className="player-cover player-cover-placeholder" aria-hidden="true">♫</span>}
        <div className="player-track-info">
          <strong>{track?.title || 'Selecciona un tema'}</strong>
          <span>{track?.producerName || (track ? 'Productor desconocido' : 'Tu música sonará aquí')}</span>
        </div>
        <button
          type="button"
          className={`player-favorite ${isFavorite ? 'is-favorite' : ''}`}
          onClick={toggleFavorite}
          disabled={!track}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          aria-pressed={isFavorite}
          title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          {isFavorite ? '♥' : '♡'}
        </button>
      </div>

      <div className="player-controls">
        <div className="control-buttons">
          <button
            type="button"
            className={`player-mode ${isShuffle ? 'is-active' : ''}`}
            onClick={() => setIsShuffle((current) => !current)}
            aria-label="Reproducción aleatoria"
            aria-pressed={isShuffle}
            title="Reproducción aleatoria"
          >⌘</button>
          <button type="button" className="skip-button" onClick={onPrevious} disabled={!canPlayPrevious} aria-label="Tema anterior" title="Tema anterior">|◀</button>
          <button type="button" className="play-button" onClick={togglePlayback} disabled={!hasTrack} aria-label={isPlaying ? 'Pausar' : 'Reproducir'} title={isPlaying ? 'Pausar' : 'Reproducir'}>{isPlaying ? 'Ⅱ' : '▶'}</button>
          <button type="button" className="skip-button" onClick={nextTrack} disabled={!canPlayNext && !(isShuffle && tracks.length > 1)} aria-label="Siguiente tema" title="Siguiente tema">▶|</button>
          <button
            type="button"
            className={`player-mode ${isRepeat ? 'is-active' : ''}`}
            onClick={() => setIsRepeat((current) => !current)}
            aria-label="Repetir"
            aria-pressed={isRepeat}
            title="Repetir tema"
          >↻</button>
        </div>
        <div className="progress-row">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={Math.min(currentTime, duration || currentTime)}
            onChange={seek}
            disabled={!hasTrack || duration === 0}
            aria-label="Progreso de reproducción"
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <label className="player-volume">
        <span aria-hidden="true">{volume === 0 ? '◖' : '◖'}</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          aria-label="Volumen"
        />
      </label>
    </footer>
  );
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}