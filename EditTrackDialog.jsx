import { useEffect, useState } from 'react';

export default function EditTrackDialog({ track, producers, onSave, onClose }) {
  const [form, setForm] = useState({ title: '', producerId: '', genre: '', bpm: '' });

  useEffect(() => {
    if (!track) return;
    setForm({
      title: track.title || '',
      producerId: track.producerId || '',
      genre: track.genre || '',
      bpm: track.bpm || '',
    });
  }, [track]);

  if (!track) return null;

  function submit(event) {
    event.preventDefault();
    const producer = producers.find((item) => item.id === form.producerId);
    onSave({
      ...track,
      title: form.title.trim(),
      producerId: producer?.id || '',
      producerName: producer?.name || 'Sin productor',
      genre: form.genre.trim(),
      bpm: form.bpm ? Number(form.bpm) : null,
    });
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="edit-dialog content-card" role="dialog" aria-modal="true" aria-labelledby="edit-track-title">
        <button type="button" className="dialog-close" onClick={onClose} aria-label="Cerrar">×</button>
        <span className="eyebrow">AJUSTA TU LANZAMIENTO</span>
        <h2 id="edit-track-title">Editar tema 🎚️</h2>
        <form className="stacked-form" onSubmit={submit}>
          <label className="field-label">Título <span>*</span>
            <input required maxLength="100" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>
          <label className="field-label">Productor
            <select value={form.producerId} onChange={(event) => setForm({ ...form, producerId: event.target.value })}>
              <option value="">Sin productor</option>
              {producers.map((producer) => <option value={producer.id} key={producer.id}>{producer.name}</option>)}
            </select>
          </label>
          <label className="field-label">Género
            <input maxLength="50" value={form.genre} onChange={(event) => setForm({ ...form, genre: event.target.value })} />
          </label>
          <label className="field-label">BPM
            <input type="number" min="1" max="999" value={form.bpm} onChange={(event) => setForm({ ...form, bpm: event.target.value })} />
          </label>
          <div className="dialog-actions">
            <button type="button" className="button button-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="button button-primary">Guardar cambios</button>
          </div>
        </form>
      </section>
    </div>
  );
}
