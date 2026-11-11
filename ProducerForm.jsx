import { useEffect, useState } from 'react';

const INITIAL_FORM = { name: '', email: '', genre: '', bio: '' };

export default function ProducerForm({ onAdd, producer: initialProducer, onCancel }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const isEditing = Boolean(initialProducer);

  useEffect(() => {
    setForm(initialProducer
      ? { name: initialProducer.name || '', email: initialProducer.email || '', genre: initialProducer.genre || '', bio: initialProducer.bio || '' }
      : INITIAL_FORM);
  }, [initialProducer]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }
  function submit(event) {
    event.preventDefault();
    const producer = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      genre: form.genre.trim(),
      bio: form.bio.trim(),
      id: initialProducer?.id || crypto.randomUUID(),
      createdAt: initialProducer?.createdAt || new Date().toISOString(),
    };
    if (onAdd(producer)) {
      setForm(INITIAL_FORM);
      onCancel?.();
    }
  }

  return (
    <form className="stacked-form" onSubmit={submit}>
      <label className="field-label">Nombre del productor <span>*</span>
        <input required maxLength="80" value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Ej. Alex Rivera" />
      </label>
      <label className="field-label">Correo electrónico <span>*</span>
        <input required type="email" maxLength="160" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="alex@correo.com" />
      </label>
      <label className="field-label">Género musical
        <input maxLength="50" value={form.genre} onChange={(event) => update('genre', event.target.value)} placeholder="Ej. Hip-hop, electrónica, pop..." />
      </label>
      <label className="field-label">Descripción
        <textarea maxLength="300" rows="4" value={form.bio} onChange={(event) => update('bio', event.target.value)} placeholder="Una breve presentación del productor..." />
      </label>
      <div className="form-actions">
        {isEditing && <button className="button button-outline" type="button" onClick={onCancel}>Cancelar</button>}
        <button className="button button-primary form-submit" type="submit">{isEditing ? 'Guardar cambios' : <><span aria-hidden="true">＋</span> Guardar productor</>}</button>
      </div>
    </form>
  );
}