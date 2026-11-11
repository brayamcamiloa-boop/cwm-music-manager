import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AudioPlayer from './AudioPlayer.jsx';
import BackupTools from './BackupTools.jsx';
import DecorativeOverlay from './DecorativeOverlay.jsx';
import EditTrackDialog from './EditTrackDialog.jsx';
import EventManager from './EventManager.jsx';
import Header from './Header.jsx';
import InsightsView from './InsightsView.jsx';
import PlaybackView from './PlaybackView.jsx';
import PlaylistManager from './PlaylistManager.jsx';
import ProducerForm from './ProducerForm.jsx';
import Sidebar from './Sidebar.jsx';
import TrackList from './TrackList.jsx';
import TrackUploader from './TrackUploader.jsx';
import { deleteLocalMedia, readLocalMedia, saveLocalMedia } from './mediaStorage.js';
import './styles.css';

const EMPTY_LIBRARY = { producers: [], tracks: [], events: [], playlists: [] };

function bytesToDataUrl(bytes, mimeType) {
  const data = new Uint8Array(bytes);
  let binary = '';
  for (let offset = 0; offset < data.length; offset += 0x8000) {
    binary += String.fromCharCode(...data.subarray(offset, offset + 0x8000));
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('No se pudo leer un archivo multimedia.'));
    reader.readAsDataURL(blob);
  });
}

function parseDataUrl(dataUrl) {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/]*={0,2})$/.exec(dataUrl);
  if (!match) throw new Error('El respaldo contiene un archivo multimedia con formato no válido.');
  return [match[1], match[2]];
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function extensionFromMime(mimeType, fallback) {
  return ({
    'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/ogg': 'ogg',
    'audio/mp4': 'm4a', 'audio/aac': 'aac', 'audio/flac': 'flac', 'audio/webm': 'webm',
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  })[mimeType] || fallback;
}

function toStoredLibrary(library) {
  return {
    producers: library.producers,
    tracks: library.tracks.map(({ audioUrl, coverUrl, ...track }) => track),
    events: (library.events || []).map(({ imageUrl, ...event }) => event),
    playlists: library.playlists || [],
  };
}

function readLocalLibrary() {
  const raw = localStorage.getItem('vibepass-library');
  if (!raw) return EMPTY_LIBRARY;
  const saved = JSON.parse(raw);
  if (!saved || !Array.isArray(saved.producers) || !Array.isArray(saved.tracks)) {
    throw new Error('La biblioteca local tiene un formato no válido.');
  }
  return {
    ...saved,
    events: Array.isArray(saved.events) ? saved.events : [],
    playlists: Array.isArray(saved.playlists) ? saved.playlists : [],
  };
}

async function loadMediaUrl(mediaId) {
  if (!mediaId) return '';
  const media = window.musicLibrary?.readMedia
    ? await window.musicLibrary.readMedia(mediaId)
    : await readLocalMedia(mediaId);
  return URL.createObjectURL(new Blob([media.bytes], { type: media.mimeType }));
}

function mediaIdsForLibrary(library) {
  return new Set([
    ...(library.tracks || []).flatMap((track) => [track.audioId, track.coverId]),
    ...(library.events || []).map((event) => event.imageId),
  ].filter(Boolean));
}

export default function App() {
  const [library, setLibrary] = useState(EMPTY_LIBRARY);
  const [activeSection, setActiveSection] = useState('Resumen');
  const [activeTrackId, setActiveTrackId] = useState(null);
  const [playQueueIds, setPlayQueueIds] = useState(null);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [ready, setReady] = useState(false);
  const [welcomeVisible, setWelcomeVisible] = useState(true);
  const [welcomeLeaving, setWelcomeLeaving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [partyMode, setPartyMode] = useState(false);
  const [editingProducer, setEditingProducer] = useState(null);
  const [editingTrack, setEditingTrack] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const libraryRef = useRef(EMPTY_LIBRARY);
  const saveQueue = useRef(Promise.resolve());
  const shellRef = useRef(null);

  const notify = useCallback((message) => {
    setNotice(message);
    window.clearTimeout(notify.timeout);
    notify.timeout = window.setTimeout(() => setNotice(''), 3500);
  }, []);

  function handlePointerMove(event) {
    if (!shellRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = shellRef.current.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 22;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 18;
    shellRef.current.style.setProperty('--pointer-drift-x', `${x.toFixed(1)}px`);
    shellRef.current.style.setProperty('--pointer-drift-y', `${y.toFixed(1)}px`);
  }

  function togglePartyMode() {
    setPartyMode((current) => !current);
    notify(partyMode ? 'Vibe mode: chill. Baja un poquito el humo.' : 'Vibe mode activado. ¡Que retumbe CWM!');
  }

  const commitLibrary = useCallback((nextLibrary) => {
    libraryRef.current = nextLibrary;
    setLibrary(nextLibrary);
    const stored = toStoredLibrary(nextLibrary);
    if (window.musicLibrary?.saveLibrary) {
      saveQueue.current = saveQueue.current
        .then(() => window.musicLibrary.saveLibrary(stored))
        .catch((error) => notify(`No se pudo guardar la biblioteca: ${error.message}`));
    } else {
      try {
        localStorage.setItem('vibepass-library', JSON.stringify(stored));
      } catch (error) {
        notify(`No se pudo guardar la biblioteca local: ${error.message}`);
      }
    }
  }, [notify]);

  async function removeMediaIds(ids) {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    for (const id of uniqueIds) {
      try {
        if (window.musicLibrary?.deleteMedia) await window.musicLibrary.deleteMedia(id);
        else await deleteLocalMedia(id);
      } catch (error) {
        notify(`No se pudo liberar un archivo multimedia: ${error.message}`);
      }
    }
  }

  function removeUnusedMedia(previousLibrary, nextLibrary) {
    const retainedIds = mediaIdsForLibrary(nextLibrary);
    const removedIds = [...mediaIdsForLibrary(previousLibrary)].filter((id) => !retainedIds.has(id));
    void removeMediaIds(removedIds);
  }

  useEffect(() => {
    if (shellRef.current) shellRef.current.inert = isRestoring;
  }, [isRestoring]);

  useEffect(() => {
    if (!ready) return undefined;
    const leaveTimer = window.setTimeout(() => setWelcomeLeaving(true), 2700);
    const closeTimer = window.setTimeout(() => setWelcomeVisible(false), 3500);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(closeTimer);
    };
  }, [ready]);

  useEffect(() => {
    let cancelled = false;
    const createdUrls = [];
    async function initialize() {
      try {
        const saved = window.musicLibrary?.loadLibrary
          ? await window.musicLibrary.loadLibrary()
          : readLocalLibrary();
        const tracks = await Promise.all((saved.tracks || []).map(async (track) => {
          try {
            const [audioUrl, coverUrl] = await Promise.all([
              loadMediaUrl(track.audioId),
              loadMediaUrl(track.coverId),
            ]);
            return { ...track, audioUrl: audioUrl || track.audioDataUrl || '', coverUrl: coverUrl || track.coverDataUrl || '' };
          } catch (error) {
            notify(`No se pudo cargar un archivo multimedia: ${error.message}`);
            return { ...track, audioUrl: '', coverUrl: '' };
          }
        }));
        createdUrls.push(...tracks.flatMap((track) => [track.audioUrl, track.coverUrl]).filter((url) => url.startsWith('blob:')));
        if (cancelled) {
          createdUrls.forEach((url) => URL.revokeObjectURL(url));
          return;
        }
        const events = await Promise.all((Array.isArray(saved.events) ? saved.events : []).map(async (event) => {
          try {
            return {
              ...event,
              imageUrl: event.imageId ? await loadMediaUrl(event.imageId) : event.imageDataUrl || '',
            };
          } catch (error) {
            notify(`No se pudo cargar la imagen de un evento: ${error.message}`);
            return { ...event, imageUrl: '' };
          }
        }));
        createdUrls.push(...events.map((event) => event.imageUrl).filter((url) => url.startsWith('blob:')));
        if (cancelled) {
          createdUrls.forEach((url) => URL.revokeObjectURL(url));
          return;
        }
        const nextLibrary = {
          producers: saved.producers || [],
          tracks,
          events,
          playlists: Array.isArray(saved.playlists) ? saved.playlists : [],
        };
        libraryRef.current = nextLibrary;
        setLibrary(nextLibrary);
        setReady(true);
      } catch (error) {
        notify(`No se pudo abrir la biblioteca: ${error.message}`);
        if (!cancelled) setReady(true);
      }
    }
    initialize();
    return () => {
      cancelled = true;
      libraryRef.current.tracks.forEach((track) => {
        if (track.audioUrl) URL.revokeObjectURL(track.audioUrl);
        if (track.coverUrl) URL.revokeObjectURL(track.coverUrl);
      });
      libraryRef.current.events.forEach((event) => {
        if (event.imageUrl?.startsWith('blob:')) URL.revokeObjectURL(event.imageUrl);
      });
    };
  }, [notify]);

  const activeTrack = library.tracks.find((track) => track.id === activeTrackId) || null;
  const filteredTracks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return library.tracks;
    return library.tracks.filter((track) => (
      `${track.title} ${track.producerName} ${track.genre}`.toLowerCase().includes(query)
    ));
  }, [library.tracks, search]);

  const playQueue = (playQueueIds || library.tracks.map((track) => track.id))
    .filter((trackId) => library.tracks.some((track) => track.id === trackId));
  const activeTrackIndex = playQueue.indexOf(activeTrackId);
  const canPlayPrevious = activeTrackIndex > 0;
  const canPlayNext = activeTrackIndex >= 0 && activeTrackIndex < playQueue.length - 1;

  function playTrack(trackId) {
    setPlayQueueIds(null);
    setActiveTrackId(trackId);
  }

  function playPlaylist(trackIds) {
    const queue = trackIds.filter((trackId) => libraryRef.current.tracks.some((track) => track.id === trackId));
    if (!queue.length) return;
    setPlayQueueIds(queue);
    setActiveTrackId(queue[0]);
  }

  function playAdjacentTrack(direction) {
    const nextIndex = activeTrackIndex + direction;
    if (nextIndex < 0 || nextIndex >= playQueue.length) return;
    setActiveTrackId(playQueue[nextIndex]);
  }

  function playRandomTrack() {
    const queue = playQueueIds || libraryRef.current.tracks.map((track) => track.id);
    const otherTracks = queue.filter((trackId) => trackId !== activeTrackId);
    if (!otherTracks.length) return;
    setActiveTrackId(otherTracks[Math.floor(Math.random() * otherTracks.length)]);
  }

  function addProducer(producer) {
    if (libraryRef.current.producers.some((item) => item.email.toLowerCase() === producer.email.toLowerCase())) {
      notify('Ya existe un productor con ese correo.');
      return false;
    }
    commitLibrary({ ...libraryRef.current, producers: [producer, ...libraryRef.current.producers] });
    notify('Productor agregado correctamente.');
    return true;
  }

  function updateProducer(producer) {
    const duplicate = libraryRef.current.producers.some((item) => item.id !== producer.id && item.email.toLowerCase() === producer.email.toLowerCase());
    if (duplicate) {
      notify('Ya existe otro productor con ese correo.');
      return false;
    }
    commitLibrary({
      ...libraryRef.current,
      producers: libraryRef.current.producers.map((item) => item.id === producer.id ? producer : item),
      tracks: libraryRef.current.tracks.map((track) => track.producerId === producer.id ? { ...track, producerName: producer.name } : track),
    });
    setEditingProducer(null);
    notify('Perfil del productor actualizado.');
    return true;
  }

  function deleteProducer(producerId) {
    const producer = libraryRef.current.producers.find((item) => item.id === producerId);
    if (!producer || !window.confirm(`¿Eliminar a ${producer.name}? Sus temas seguirán en la biblioteca.`)) return;
    commitLibrary({
      ...libraryRef.current,
      producers: libraryRef.current.producers.filter((item) => item.id !== producerId),
      tracks: libraryRef.current.tracks.map((track) => track.producerId === producerId
        ? { ...track, producerId: '', producerName: 'Sin productor' }
        : track),
    });
    if (editingProducer?.id === producerId) setEditingProducer(null);
    notify('Productor eliminado; sus temas se conservaron.');
  }

  function updateTrack(track) {
    commitLibrary({
      ...libraryRef.current,
      tracks: libraryRef.current.tracks.map((item) => item.id === track.id
        ? { ...item, ...track, playCount: item.playCount }
        : item),
    });
    setEditingTrack(null);
    notify('Información del tema actualizada.');
  }

  async function addTrack(track) {
    const nextTrack = { ...track };
    try {
      nextTrack.audioUrl = track.audioUrl || await loadMediaUrl(track.audioId);
      nextTrack.coverUrl = track.coverUrl || await loadMediaUrl(track.coverId);
    } catch (error) {
      notify(`El tema se guardó, pero no se pudo abrir el archivo: ${error.message}`);
    }
    commitLibrary({ ...libraryRef.current, tracks: [nextTrack, ...libraryRef.current.tracks] });
    setPlayQueueIds(null);
    setActiveTrackId(nextTrack.id);
    notify('Tema agregado a tu biblioteca.');
  }

  function deleteTrack(trackId) {
    const track = libraryRef.current.tracks.find((item) => item.id === trackId);
    if (!track || !window.confirm(`¿Eliminar "${track.title}" y sus archivos de audio y portada?`)) return;
    if (track.audioUrl) URL.revokeObjectURL(track.audioUrl);
    if (track.coverUrl) URL.revokeObjectURL(track.coverUrl);
    const previousLibrary = libraryRef.current;
    const nextLibrary = {
      ...libraryRef.current,
      tracks: libraryRef.current.tracks.filter((item) => item.id !== trackId),
      playlists: (libraryRef.current.playlists || []).map((playlist) => ({
        ...playlist,
        trackIds: playlist.trackIds.filter((id) => id !== trackId),
      })),
    };
    commitLibrary(nextLibrary);
    removeUnusedMedia(previousLibrary, nextLibrary);
    if (playQueueIds) setPlayQueueIds(playQueueIds.filter((id) => id !== trackId));
    if (activeTrackId === trackId) setActiveTrackId(null);
    if (editingTrack?.id === trackId) setEditingTrack(null);
    notify('Tema eliminado de la biblioteca.');
  }

  function addEvent(event) {
    commitLibrary({ ...libraryRef.current, events: [event, ...(libraryRef.current.events || [])] });
    notify('¡Evento creado y guardado en tu cartelera!');
  }

  function deleteEvent(eventId) {
    const deletedEvent = libraryRef.current.events.find((event) => event.id === eventId);
    if (!deletedEvent || !window.confirm(`¿Eliminar el evento "${deletedEvent.name}"?`)) return;
    const events = (libraryRef.current.events || []).filter((event) => event.id !== eventId);
    if (deletedEvent?.imageUrl?.startsWith('blob:')) URL.revokeObjectURL(deletedEvent.imageUrl);
    const previousLibrary = libraryRef.current;
    const nextLibrary = { ...libraryRef.current, events };
    commitLibrary(nextLibrary);
    removeUnusedMedia(previousLibrary, nextLibrary);
    if (editingEvent?.id === eventId) setEditingEvent(null);
    notify('Evento eliminado de la cartelera.');
  }

  function updateEvent(event) {
    const previousEvent = libraryRef.current.events.find((item) => item.id === event.id);
    if (previousEvent?.imageUrl?.startsWith('blob:') && previousEvent.imageUrl !== event.imageUrl) {
      URL.revokeObjectURL(previousEvent.imageUrl);
    }
    const previousLibrary = libraryRef.current;
    const nextLibrary = {
      ...libraryRef.current,
      events: libraryRef.current.events.map((item) => item.id === event.id ? event : item),
    };
    commitLibrary(nextLibrary);
    removeUnusedMedia(previousLibrary, nextLibrary);
    setEditingEvent(null);
    notify('Evento actualizado.');
  }

  function savePlaylist(playlist) {
    const playlists = libraryRef.current.playlists || [];
    if (playlists.some((item) => item.id !== playlist.id && item.name.toLowerCase() === playlist.name.toLowerCase())) {
      notify('Ya existe una playlist con ese nombre.');
      return false;
    }
    commitLibrary({
      ...libraryRef.current,
      playlists: playlists.some((item) => item.id === playlist.id)
        ? playlists.map((item) => item.id === playlist.id ? playlist : item)
        : [playlist, ...playlists],
    });
    notify('Playlist guardada.');
    return true;
  }

  function deletePlaylist(playlistId) {
    commitLibrary({
      ...libraryRef.current,
      playlists: (libraryRef.current.playlists || []).filter((item) => item.id !== playlistId),
    });
    notify('Playlist eliminada.');
  }

  function recordTrackPlay(trackId) {
    const tracks = libraryRef.current.tracks.map((track) => track.id === trackId
      ? { ...track, playCount: (Number(track.playCount) || 0) + 1 }
      : track);
    commitLibrary({ ...libraryRef.current, tracks });
  }

  async function exportBackup() {
    const packMedia = async (id, url, dataUrl, name, defaultExtension) => {
      if (dataUrl?.startsWith('data:')) return { name: name || `media.${defaultExtension}`, dataUrl };
      if (id && window.musicLibrary?.readMedia) {
        const media = await window.musicLibrary.readMedia(id);
        return {
          name: name || `media.${extensionFromMime(media.mimeType, defaultExtension)}`,
          dataUrl: bytesToDataUrl(media.bytes, media.mimeType),
        };
      }
      if (id) {
        const media = await readLocalMedia(id);
        return {
          name: name || `media.${extensionFromMime(media.mimeType, defaultExtension)}`,
          dataUrl: bytesToDataUrl(media.bytes, media.mimeType),
        };
      }
      if (url?.startsWith('blob:')) {
        const blob = await fetch(url).then((response) => response.blob());
        return {
          name: name || `media.${extensionFromMime(blob.type, defaultExtension)}`,
          dataUrl: await blobToDataUrl(blob),
        };
      }
      return null;
    };
    const tracks = await Promise.all(libraryRef.current.tracks.map(async (track) => {
      const { audioUrl, coverUrl, audioDataUrl, coverDataUrl, ...metadata } = track;
      const [audio, cover] = await Promise.all([
        packMedia(track.audioId, audioUrl, audioDataUrl, track.fileName, 'mp3'),
        packMedia(track.coverId, coverUrl, coverDataUrl, `cover-${track.id}.jpg`, 'jpg'),
      ]);
      return { ...metadata, audioBackup: audio, coverBackup: cover };
    }));
    const events = await Promise.all(libraryRef.current.events.map(async (event) => {
      const { imageUrl, imageDataUrl, ...metadata } = event;
      const imageBackup = await packMedia(event.imageId, imageUrl, imageDataUrl, `event-${event.id}.jpg`, 'jpg');
      return { ...metadata, imageBackup };
    }));
    const tracksWithoutAudio = tracks.filter((track) => !track.audioBackup?.dataUrl);
    if (tracksWithoutAudio.length > 0) {
      const titles = tracksWithoutAudio.slice(0, 5).map((track) => track.title || 'Tema sin título').join(', ');
      const remainder = tracksWithoutAudio.length > 5 ? ` y ${tracksWithoutAudio.length - 5} más` : '';
      throw new Error(`No se puede crear un respaldo completo: falta el archivo de audio de ${titles}${remainder}.`);
    }
    const backup = {
      format: 'CWM_BACKUP',
      version: 1,
      exportedAt: new Date().toISOString(),
      library: { producers: libraryRef.current.producers, tracks, events, playlists: libraryRef.current.playlists || [] },
    };
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cwm-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('Respaldo exportado con archivos multimedia.');
  }

  async function importBackup(backup) {
    const incoming = backup.library;
    if (!Array.isArray(incoming.producers) || !Array.isArray(incoming.tracks)
      || (incoming.events !== undefined && !Array.isArray(incoming.events))
      || (incoming.playlists !== undefined && !Array.isArray(incoming.playlists))) {
      throw new Error('El respaldo no contiene listas válidas de productores, temas, eventos y playlists.');
    }
    const previousLibrary = libraryRef.current;
    const createdMediaIds = [];
    const createdMediaUrls = [];
    let nextLibrary;
    setIsRestoring(true);
    try {
      const restoreMedia = async (media, fallbackId) => {
        if (!media?.dataUrl) return { id: '', url: '' };
        const [mimeType, base64] = parseDataUrl(media.dataUrl);
        if (base64.length > Math.ceil((100 * 1024 * 1024) / 3) * 4) {
          throw new Error('Un archivo supera el límite de 100 MB.');
        }
        const bytes = base64ToBytes(base64);
        if (bytes.byteLength > 100 * 1024 * 1024) throw new Error('Un archivo supera el límite de 100 MB.');
        const extension = extensionFromMime(mimeType, '');
        if (!extension) throw new Error(`El formato multimedia ${mimeType} no es compatible.`);
        const saved = window.musicLibrary?.saveMedia
          ? await window.musicLibrary.saveMedia({ name: `restored-${fallbackId}.${extension}`, bytes })
          : await saveLocalMedia({ name: `restored-${fallbackId}.${extension}`, type: mimeType, bytes });
        createdMediaIds.push(saved.id);
        const url = await loadMediaUrl(saved.id);
        createdMediaUrls.push(url);
        return { id: saved.id, url };
      };

      const tracks = [];
      for (const track of backup.library.tracks) {
        const {
          audioBackup,
          coverBackup,
          audioUrl: _audioUrl,
          coverUrl: _coverUrl,
          audioDataUrl,
          coverDataUrl,
          ...metadata
        } = track;
        const audio = await restoreMedia(
          audioBackup || (audioDataUrl ? { dataUrl: audioDataUrl, name: track.fileName } : null),
          `${track.id}-audio`,
        );
        const cover = await restoreMedia(
          coverBackup || (coverDataUrl ? { dataUrl: coverDataUrl, name: `cover-${track.id}.jpg` } : null),
          `${track.id}-cover`,
        );
        tracks.push({
          ...metadata,
          audioId: audio.id || '',
          coverId: cover.id || '',
          audioDataUrl: '',
          coverDataUrl: '',
          audioUrl: audio.url,
          coverUrl: cover.url,
        });
      }

      const events = [];
      for (const event of backup.library.events || []) {
        const { imageBackup, imageUrl: _imageUrl, imageDataUrl, ...metadata } = event;
        const image = await restoreMedia(imageBackup || (imageDataUrl ? { dataUrl: imageDataUrl } : null), `${event.id}-image`);
        events.push({
          ...metadata,
          imageId: image.id || '',
          imageDataUrl: '',
          imageUrl: image.url,
        });
      }
      nextLibrary = {
        producers: backup.library.producers,
        tracks,
        events,
        playlists: Array.isArray(backup.library.playlists) ? backup.library.playlists : [],
      };
    } catch (error) {
      createdMediaUrls.forEach((url) => URL.revokeObjectURL(url));
      await removeMediaIds(createdMediaIds);
      throw error;
    } finally {
      setIsRestoring(false);
    }

    libraryRef.current.tracks.forEach((track) => {
      if (track.audioUrl?.startsWith('blob:')) URL.revokeObjectURL(track.audioUrl);
      if (track.coverUrl?.startsWith('blob:')) URL.revokeObjectURL(track.coverUrl);
    });
    libraryRef.current.events.forEach((event) => {
      if (event.imageUrl?.startsWith('blob:')) URL.revokeObjectURL(event.imageUrl);
    });
    commitLibrary(nextLibrary);
    removeUnusedMedia(previousLibrary, nextLibrary);
    setActiveTrackId(null);
    setPlayQueueIds(null);
    setActiveSection('Resumen');
    notify('Respaldo restaurado correctamente.');
  }

  const sectionTitles = {
    Resumen: 'Tu estudio, en un solo lugar',
    Eventos: 'Eventos',
    Productores: 'Productores',
    Temas: 'Biblioteca musical',
    Reproducciones: 'Reproducciones',
    Estadísticas: 'Estadísticas de tu estudio',
    Playlists: 'Tus playlists',
  };

  return (
    <>
    <div
      className={`app-shell ${activeSection === 'Reproducciones' ? 'is-listening' : ''} ${partyMode ? 'party-mode' : ''}`}
      ref={shellRef}
      onPointerMove={handlePointerMove}
    >
      <DecorativeOverlay />
      <Sidebar activeSection={activeSection} onNavigate={setActiveSection} trackCount={library.tracks.length} />
      <main className={`main-panel menu-${{
        Resumen: 'summary',
        Eventos: 'events',
        Productores: 'producers',
        Reproducciones: 'playback',
        Temas: 'tracks',
        Estadísticas: 'summary',
        Playlists: 'tracks',
      }[activeSection] || 'default'}`}>
        <Header
          title={sectionTitles[activeSection]}
          search={search}
          onSearch={setSearch}
          trackCount={library.tracks.length}
          partyMode={partyMode}
          onToggleParty={togglePartyMode}
        />
        {!ready ? (
          <div className="loading-state">Preparando tu biblioteca...</div>
        ) : (
          <div
            key={activeSection}
            className={`page-content page-content-${{
              Resumen: 'summary',
              Eventos: 'events',
              Productores: 'producers',
              Reproducciones: 'playback',
              Temas: 'tracks',
              Estadísticas: 'summary',
              Playlists: 'tracks',
            }[activeSection] || 'default'} ${activeSection === 'Reproducciones' ? 'page-content-playback' : ''}`}
          >
            {activeSection === 'Reproducciones' && (
              <PlaybackView
                tracks={filteredTracks}
                activeTrackId={activeTrackId}
                onPlay={playTrack}
                search={search}
              />
            )}
            {activeSection === 'Eventos' && (
              <EventManager
                events={library.events || []}
                onAdd={addEvent}
                onUpdate={updateEvent}
                onDelete={deleteEvent}
                onEdit={setEditingEvent}
                editingEvent={editingEvent}
                onCancelEdit={() => setEditingEvent(null)}
                onNotice={notify}
              />
            )}
            {activeSection === 'Resumen' && (
              <>
                <section className="welcome-card">
                  <div className="welcome-copy">
                    <span className="eyebrow">TU ESPACIO CREATIVO</span>
                    <h1>Todo tu sonido.<br /><span>En armonía.</span></h1>
                    <p>Organiza productores, descubre tus lanzamientos y mantén tu música siempre a mano.</p>
                    <button className="button button-primary" onClick={() => setActiveSection('Temas')}>
                      <span aria-hidden="true">＋</span> Agregar un tema
                    </button>
                  </div>
                  <div className="welcome-art" aria-hidden="true">
                    <div className="art-orbit orbit-one" />
                    <div className="art-orbit orbit-two" />
                    <button
                      type="button"
                      className="vinyl-disc"
                      aria-label={library.tracks.length ? 'Reproducir tu primer tema' : 'Abrir reproducciones'}
                      title={library.tracks.length ? '¡Dale play!' : 'Abrir reproducciones'}
                      onClick={() => {
                        setActiveSection('Reproducciones');
                        if (library.tracks.length) playTrack(library.tracks[0].id);
                      }}
                    >
                      <span />
                      <i>▶</i>
                    </button>
                    <span className="welcome-graffiti graffiti-freak" aria-hidden="true">FREAK<br />YOUR BEATS!</span>
                    <span className="welcome-graffiti graffiti-sticker" aria-hidden="true">👽</span>
                    <span className="comic-sticker sticker-boom">BOOM!</span>
                    <span className="comic-sticker sticker-zap">ZAP!</span>
                    <span className="comic-sticker sticker-beat">BEAT!</span>
                    <span className="art-note note-one">♪</span>
                    <span className="art-note note-two">♫</span>
                    <span className="art-sparkle">✳</span>
                  </div>
                </section>

                <section className="stats-grid" aria-label="Resumen de la biblioteca">
                  <article className="stat-card">
                    <span className="stat-icon purple">💿</span>
                    <div><span className="stat-label">Temas guardados</span><strong>{library.tracks.length}</strong></div>
                    <span className="stat-caption">En tu biblioteca</span>
                    <span className="stat-doodle doodle-disc" aria-hidden="true"><i>♫</i></span>
                    <span className="stat-tag">SIDE A</span>
                  </article>
                  <article className="stat-card">
                    <span className="stat-icon coral">🎤</span>
                    <div><span className="stat-label">Productores</span><strong>{library.producers.length}</strong></div>
                    <span className="stat-caption">En tu equipo</span>
                    <span className="stat-doodle doodle-mic" aria-hidden="true">🎙️</span>
                    <span className="stat-tag">ALL STARS</span>
                  </article>
                  <article className="stat-card">
                    <span className="stat-icon green">⏱️</span>
                    <div><span className="stat-label">Duración total</span><strong>{formatTotalDuration(library.tracks)}</strong></div>
                    <span className="stat-caption">Tiempo de escucha</span>
                    <span className="stat-doodle doodle-bolt" aria-hidden="true">⚡</span>
                    <span className="stat-tag">ON AIR</span>
                  </article>
                </section>

                <section className="content-card">
                  <span className="card-scribble scribble-recent" aria-hidden="true">FRESH<br />TRACKS!</span>
                  <span className="card-sticker sticker-headphones" aria-hidden="true">🎧</span>
                  <div className="section-heading">
                    <div><span className="eyebrow">LO MÁS RECIENTE</span><h2>Tus últimos temas <span className="section-graffiti" aria-hidden="true">🎸</span></h2></div>
                    {library.tracks.length > 0 && (
                      <button className="text-button" onClick={() => setActiveSection('Temas')}>Ver biblioteca <span>→</span></button>
                    )}
                  </div>
                  <TrackList
                    tracks={library.tracks.slice(0, 4)}
                    activeTrackId={activeTrackId}
                    onPlay={playTrack}
                    onDelete={deleteTrack}
                    onEdit={setEditingTrack}
                    emptyTitle="Tu próximo lanzamiento empieza aquí"
                    emptyText="Agrega un tema para verlo en tu biblioteca."
                  />
                </section>
              </>
            )}

            {activeSection === 'Productores' && (
              <div className="two-column-layout">
                <section className="content-card form-card">
                  <span className="card-sticker producer-sticker" aria-hidden="true">🎛️</span>
                  <span className="card-scribble producer-scribble" aria-hidden="true">NEW<br />TALENT</span>
                  <div className="section-heading"><div><span className="eyebrow">NUEVO PERFIL</span><h2>Agregar productor <span className="section-graffiti" aria-hidden="true">🎙️</span></h2></div></div>
                  <ProducerForm
                    onAdd={editingProducer ? updateProducer : addProducer}
                    producer={editingProducer}
                    onCancel={() => setEditingProducer(null)}
                  />
                </section>
                <section className="content-card producer-directory">
                  <span className="card-sticker directory-sticker" aria-hidden="true">🪩</span>
                  <span className="card-scribble directory-scribble" aria-hidden="true">CREW<br />VIBES</span>
                  <div className="section-heading">
                    <div><span className="eyebrow">TU EQUIPO</span><h2>Productores <span className="count-pill">{library.producers.length}</span><span className="section-graffiti" aria-hidden="true">👽</span></h2></div>
                  </div>
                  {library.producers.length === 0 ? (
                    <div className="empty-state compact"><span className="empty-icon">♙</span><h3>Aún no hay productores</h3><p>Agrega tu primer perfil para empezar a organizar tus colaboraciones.</p></div>
                  ) : (
                    <div className="producer-list">
                      {library.producers.map((producer) => (
                        <article className="producer-row" key={producer.id}>
                          <div className={`avatar avatar-${producer.id.charCodeAt(0) % 4}`}><span>{['🎤', '🎹', '👾', '🎧'][producer.id.charCodeAt(0) % 4]}</span>{initials(producer.name)}</div>
                          <div className="producer-details"><strong>{producer.name}</strong><span>{producer.email}</span></div>
                          <span className="genre-pill">{producer.genre || 'Sin género'}</span>
                          <div className="producer-actions">
                            <button type="button" className="edit-track" onClick={() => setEditingProducer(producer)} aria-label={`Editar ${producer.name}`} title="Editar productor">✎</button>
                            <button type="button" className="delete-track" onClick={() => deleteProducer(producer.id)} aria-label={`Eliminar ${producer.name}`} title="Eliminar productor">×</button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeSection === 'Temas' && (
              <>
                <section className="content-card form-card uploader-card">
                  <span className="card-sticker uploader-sticker" aria-hidden="true">🚀</span>
                  <span className="card-scribble uploader-scribble" aria-hidden="true">DROP<br />A BEAT</span>
                  <div className="section-heading"><div><span className="eyebrow">NUEVO LANZAMIENTO</span><h2>Sube un tema <span className="section-graffiti" aria-hidden="true">🎚️</span></h2></div></div>
                  <TrackUploader producers={library.producers} onAdd={addTrack} onNotice={notify} />
                </section>
                <section className="content-card library-card">
                  <span className="card-sticker library-sticker" aria-hidden="true">🛸</span>
                  <span className="card-scribble library-scribble" aria-hidden="true">BEAT<br />BOX</span>
                  <div className="section-heading">
                    <div><span className="eyebrow">COLECCIÓN</span><h2>Todos tus temas <span className="count-pill">{filteredTracks.length}</span><span className="section-graffiti" aria-hidden="true">💥</span></h2></div>
                  </div>
                  <TrackList
                    tracks={filteredTracks}
                    activeTrackId={activeTrackId}
                    onPlay={playTrack}
                    onDelete={deleteTrack}
                    onEdit={setEditingTrack}
                    emptyTitle={search ? 'No encontramos resultados' : 'Tu biblioteca está esperando música'}
                    emptyText={search ? 'Prueba con otro título, productor o género.' : 'Carga un archivo de audio para agregar tu primer tema.'}
                  />
                </section>
              </>
            )}
            {activeSection === 'Estadísticas' && <InsightsView library={library} onNavigate={setActiveSection} />}
            {activeSection === 'Playlists' && (
              <PlaylistManager
                playlists={library.playlists || []}
                tracks={library.tracks}
                onSave={savePlaylist}
                onDelete={deletePlaylist}
                onPlay={playPlaylist}
              />
            )}
            {activeSection === 'Resumen' && (
              <>
                <InsightsView library={library} onNavigate={setActiveSection} />
                <BackupTools onExport={exportBackup} onImport={importBackup} />
              </>
            )}
          </div>
        )}
      </main>
      <AudioPlayer
        track={activeTrack}
        tracks={playQueue.map((trackId) => library.tracks.find((track) => track.id === trackId)).filter(Boolean)}
        onEnded={() => {
          if (canPlayNext) playAdjacentTrack(1);
          else {
            setActiveTrackId(null);
            setPlayQueueIds(null);
          }
        }}
        onPrevious={() => playAdjacentTrack(-1)}
        onNext={() => playAdjacentTrack(1)}
        onShuffleNext={playRandomTrack}
        canPlayPrevious={canPlayPrevious}
        canPlayNext={canPlayNext}
        onNotice={notify}
        onTrackStarted={recordTrackPlay}
      />
      {editingTrack && (
        <EditTrackDialog
          track={editingTrack}
          producers={library.producers}
          onSave={updateTrack}
          onClose={() => setEditingTrack(null)}
        />
      )}
      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
    {welcomeVisible && (
      <div className={`welcome-intro ${welcomeLeaving ? 'welcome-intro--leaving' : ''}`} role="status" aria-label="Bienvenido a CWM">
        <div className="welcome-intro-content">
          <div className="welcome-intro-impact" aria-hidden="true">
            <span className="welcome-intro-impact-word welcome-intro-impact-word--left">¡PUM!</span>
            <span className="welcome-intro-impact-word welcome-intro-impact-word--right">ZAP!</span>
            <span className="welcome-intro-impact-sticker">♫</span>
            <img className="welcome-intro-logo" src="/images/cwm-graffiti-logo-green.png" alt="" />
          </div>
          <p className="welcome-intro-tagline">Tu estudio. Tu sonido. <span>Tu mundo.</span></p>
          <div className="welcome-intro-equalizer" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
        </div>
      </div>
    )}
    {isRestoring && (
      <div className="restore-overlay" role="status" aria-live="polite">
        <div><strong>Restaurando tu respaldo...</strong><span>No cierres CWM mientras se recupera tu biblioteca y sus archivos multimedia.</span></div>
      </div>
    )}
    </>
  );
}

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function formatTotalDuration(tracks) {
  const total = tracks.reduce((sum, track) => sum + (Number(track.duration) || 0), 0);
  if (!total) return '0 min';
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return seconds ? `${minutes} min ${seconds} s` : `${minutes} min`;
}
