import { useState } from 'react';
import { saveLocalMedia } from './mediaStorage.js';

const EMPTY_FORM = { title: '', producerId: '', genre: '', bpm: '' };
const MAX_AUDIO_BYTES = 100 * 1024 * 1024;
const AUDIO_TYPES = new Set(['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/flac', 'audio/webm']);
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export default function TrackUploader({ producers, onAdd, onNotice }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [audio, setAudio] = useState(null);
  const [cover, setCover] = useState(null);
  const [duration, setDuration] = useState(0);
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }
  function chooseAudio(file) {
    if (!file) return;
    if ((!AUDIO_TYPES.has(file.type) && !/\.(mp3|wav|ogg|m4a|mp4|aac|flac|webm)$/i.test(file.name)) || file.size > MAX_AUDIO_BYTES) {
      onNotice('Elige un audio MP3, WAV, OGG, M4A o FLAC de hasta 100 MB.');
      return;
    }
    setAudio(file);
    const objectUrl = URL.createObjectURL(file);
    const player = new Audio(objectUrl);
    player.addEventListener('loadedmetadata', () => {
      setDuration(Number.isFinite(player.duration) ? Math.round(player.duration) : 0);
      URL.revokeObjectURL(objectUrl);
    }, { once: true });
    player.addEventListener('error', () => URL.revokeObjectURL(objectUrl), { once: true });
  }
  function chooseCover(file) {
    if (!file) return;
    if ((!IMAGE_TYPES.has(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) || file.size > 10 * 1024 * 1024) {
      onNotice('La portada debe ser JPG, PNG o WEBP y pesar menos de 10 MB.');
      return;
    }
    setCover(file);
  }
  async function saveFile(file) {
    if (window.musicLibrary?.saveMedia) {
      return window.musicLibrary.saveMedia({ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
    }
    const saved = await saveLocalMedia(file);
    return { id: saved.id, previewUrl: URL.createObjectURL(file) };
  }
  async function submit(event) {
    event.preventDefault();
    if (!audio) {
      onNotice('Selecciona el archivo de audio que quieres agregar.');
      return;
    }
    setSaving(true);
    try {
      const producer = producers.find((item) => item.id === form.producerId);
      const audioFile = await saveFile(audio);
      const coverFile = cover ? await saveFile(cover) : null;
      onAdd({
        id: crypto.randomUUID(),
        title: form.title.trim(),
        producerId: producer?.id || '',
        producerName: producer?.name || 'Sin productor',
        genre: form.genre.trim(),
        bpm: form.bpm ? Number(form.bpm) : null,
        duration,
        audioId: audioFile.id,
        coverId: coverFile?.id || '',
        audioUrl: audioFile.previewUrl || '',
        coverUrl: coverFile?.previewUrl || '',
        fileName: audio.name,
        createdAt: new Date().toISOString(),
      });
      setForm(EMPTY_FORM);
      setAudio(null);
      setCover(null);
      setDuration(0);
    } catch (error) {
      onNotice(`No se pudo guardar el archivo: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="track-form" onSubmit={submit}>
      <div className="track-form-fields">
        <label className="field-label">Título del tema <span>*</span>
          <input required maxLength="100" value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Ej. Luces de la ciudad" />
        </label>
        <label className="field-label">Productor
          <select value={form.producerId} onChange={(event) => update('producerId', event.target.value)}>
            <option value="">Selecciona un productor</option>
            {producers.map((producer) => <option value={producer.id} key={producer.id}>{producer.name}</option>)}
          </select>
        </label>
        <label className="field-label">Género
          <input maxLength="50" value={form.genre} onChange={(event) => update('genre', event.target.value)} placeholder="Ej. Indie pop" />
        </label>
        <label className="field-label">BPM
          <input type="number" min="1" max="999" value={form.bpm} onChange={(event) => update('bpm', event.target.value)} placeholder="Ej. 120" />
        </label>
      </div>
      <div className="upload-row">
        <label className={`drop-zone audio-drop ${audio ? 'has-file' : ''}`}>
          <input type="file" accept=".mp3,.wav,.ogg,.m4a,.mp4,.aac,.flac,.webm,audio/*" onChange={(event) => chooseAudio(event.target.files?.[0])} />
          <span className="drop-icon">🎵</span>
          <span className="drop-copy"><strong>{audio ? audio.name : 'Selecciona un archivo de audio'}</strong><small>{audio ? `${formatBytes(audio.size)}${duration ? ` · ${formatDuration(duration)}` : ''}` : 'MP3, WAV, OGG, M4A o FLAC · Máx. 100 MB'}</small></span>
          <span className="button button-outline">{audio ? 'Cambiar' : 'Explorar'}</span>
        </label>
        <label className={`drop-zone cover-drop ${cover ? 'has-file' : ''}`}>
          <input type="file" accept=".jpg,.jpeg,.png,.webp,image/*" onChange={(event) => chooseCover(event.target.files?.[0])} />
          <span className="cover-placeholder">🎨</span>
          <span className="drop-copy"><strong>{cover ? cover.name : 'Portada (opcional)'}</strong><small>JPG, PNG o WEBP · Máx. 10 MB</small></span>
          <span className="button button-outline">{cover ? 'Cambiar' : 'Elegir'}</span>
        </label>
      </div>
      <div className="upload-footer">
        <span className="privacy-note"><span>⌑</span> Tus archivos se guardan en este computador.</span>
        <button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : <><span aria-hidden="true">＋</span> Agregar a la biblioteca</>}</button>
      </div>
    </form>
  );
}

function formatBytes(bytes) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function formatDuration(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}