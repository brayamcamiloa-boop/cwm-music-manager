import { useEffect, useState } from 'react';
import { saveLocalMedia } from './mediaStorage.js';

const INITIAL_FORM = {
  name: '',
  description: '',
  category: '',
  status: 'Activo',
  date: '',
  startTime: '',
  endTime: '',
  venue: '',
  address: '',
  city: '',
  country: 'Colombia',
  tickets: [{ id: crypto.randomUUID(), name: 'General', price: '', quantity: '100' }],
  refunds: false,
  featured: false,
  saleStart: '',
  saleEnd: '',
  age: '0',
};

const EVENT_CATEGORIES = ['Concierto', 'Festival', 'Música electrónica', 'Hip-hop', 'Rock', 'Otro'];

export default function EventManager({ events, onAdd, onUpdate, onDelete, onEdit, editingEvent, onCancelEdit, onNotice }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [cover, setCover] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (!editingEvent) {
      setForm({ ...INITIAL_FORM, tickets: [{ id: crypto.randomUUID(), name: 'General', price: '', quantity: '100' }] });
      setCover(null);
      setCoverPreview('');
      return;
    }
    setForm({
      ...INITIAL_FORM,
      ...editingEvent,
      tickets: (editingEvent.tickets || []).map((ticket) => ({
        ...ticket,
        price: String(ticket.price ?? ''),
        quantity: String(ticket.quantity ?? '100'),
      })),
      age: String(editingEvent.age ?? 0),
    });
    setCover(null);
    setCoverPreview(editingEvent.imageUrl || editingEvent.imageDataUrl || '');
  }, [editingEvent]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateTicket(id, field, value) {
    setForm((current) => ({
      ...current,
      tickets: current.tickets.map((ticket) => ticket.id === id ? { ...ticket, [field]: value } : ticket),
    }));
  }

  function addTicket() {
    setForm((current) => ({
      ...current,
      tickets: [...current.tickets, { id: crypto.randomUUID(), name: '', price: '', quantity: '100' }],
    }));
  }

  function removeTicket(id) {
    setForm((current) => ({ ...current, tickets: current.tickets.filter((ticket) => ticket.id !== id) }));
  }

  function chooseCover(file) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      onNotice('La imagen debe ser JPG, PNG o WEBP y pesar menos de 10 MB.');
      return;
    }
    if (cover && coverPreview) URL.revokeObjectURL(coverPreview);
    setCover(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function submit(event) {
    event.preventDefault();
    if (form.tickets.length === 0) {
      onNotice('Agrega por lo menos un tipo de entrada.');
      return;
    }
    if (form.endTime && form.startTime && form.endTime <= form.startTime) {
      onNotice('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }

    setSaving(true);
    try {
      let imageId = editingEvent?.imageId || '';
      let imageDataUrl = editingEvent?.imageDataUrl || '';
      if (cover && window.musicLibrary?.saveMedia) {
        const savedImage = await window.musicLibrary.saveMedia({
          name: cover.name,
          bytes: new Uint8Array(await cover.arrayBuffer()),
        });
        imageId = savedImage.id;
        imageDataUrl = '';
      } else if (cover) {
        const savedImage = await saveLocalMedia(cover);
        imageId = savedImage.id;
        imageDataUrl = '';
      }

      const eventData = {
        ...form,
        id: editingEvent?.id || crypto.randomUUID(),
        name: form.name.trim(),
        description: form.description.trim(),
        venue: form.venue.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        age: Number(form.age) || 0,
        tickets: form.tickets.map((ticket) => ({
          id: ticket.id,
          name: ticket.name.trim(),
          price: Number(ticket.price) || 0,
          quantity: Number(ticket.quantity) || 0,
        })),
        imageId,
        imageDataUrl,
        imageUrl: coverPreview,
        createdAt: editingEvent?.createdAt || new Date().toISOString(),
      };
      if (editingEvent) onUpdate(eventData);
      else onAdd(eventData);
      setForm({ ...INITIAL_FORM, tickets: [{ id: crypto.randomUUID(), name: 'General', price: '', quantity: '100' }] });
      setCover(null);
      setCoverPreview('');
      if (editingEvent) onCancelEdit();
    } catch (error) {
      onNotice(`No se pudo guardar la imagen del evento: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(monthStart.getDate() - monthStart.getDay());
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });
  const eventsByDate = new Map();
  events.forEach((event) => {
    if (!eventsByDate.has(event.date)) eventsByDate.set(event.date, []);
    eventsByDate.get(event.date).push(event);
  });
  const selectedEvents = selectedDate ? (eventsByDate.get(selectedDate) || []) : [];
  const upcomingEvents = [...events]
    .filter((event) => event.date && new Date(`${event.date}T12:00:00`) >= new Date(new Date().toDateString()))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  return (
    <div className="events-page">
      <section className="events-banner">
        <div className="events-banner-copy">
          <span className="eyebrow">BOOK THE NIGHT · CWM EVENTS</span>
          <h1>Que empiece<br /><span>el ruido.</span></h1>
          <p>Arma tu próximo concierto, suelta los beats y reúne a tu gente.</p>
        </div>
        <div className="events-banner-art" aria-hidden="true">
          <span className="event-planet">🪩</span>
          <span className="event-spark event-spark-one">✳</span>
          <span className="event-spark event-spark-two">✦</span>
          <span className="event-banner-note">♫</span>
          <span className="event-banner-word">LET'S<br />ROCK!</span>
        </div>
        <span className="event-banner-sticker" aria-hidden="true">🎟️</span>
      </section>

      <section className="content-card event-calendar-card">
        <div className="section-heading">
          <div><span className="eyebrow">PLANEA TU PRÓXIMO SHOW</span><h2>Calendario de eventos <span>🗓️</span></h2></div>
          <div className="calendar-month-controls">
            <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} aria-label="Mes anterior">‹</button>
            <strong>{calendarMonth.toLocaleDateString('es', { month: 'long', year: 'numeric' })}</strong>
            <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} aria-label="Mes siguiente">›</button>
          </div>
        </div>
        <div className="event-calendar-layout">
          <div className="event-calendar-grid">
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => <span className="calendar-weekday" key={`${day}-${index}`}>{day}</span>)}
            {calendarDays.map((date) => {
              const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
              const hasEvent = eventsByDate.has(dateKey);
              return (
                <button
                  type="button"
                  key={dateKey}
                  className={`calendar-day ${date.getMonth() !== calendarMonth.getMonth() ? 'outside-month' : ''} ${hasEvent ? 'has-event' : ''} ${selectedDate === dateKey ? 'selected-day' : ''}`}
                  onClick={() => setSelectedDate(dateKey)}
                  aria-label={`${date.toLocaleDateString('es', { dateStyle: 'long' })}${hasEvent ? ', con eventos' : ''}`}
                >
                  {date.getDate()}{hasEvent && <i />}
                </button>
              );
            })}
          </div>
          <div className="calendar-event-list">
            <span className="eyebrow">{selectedDate ? `EVENTOS · ${new Date(`${selectedDate}T12:00:00`).toLocaleDateString('es', { day: 'numeric', month: 'short' })}` : 'PRÓXIMOS EN CARTELERA'}</span>
            {(selectedDate ? selectedEvents : upcomingEvents).length === 0
              ? <p>{selectedDate ? 'No tienes eventos para este día.' : 'Todavía no hay fechas próximas.'}</p>
              : (selectedDate ? selectedEvents : upcomingEvents).map((event) => (
                <button type="button" className="calendar-event-item" key={event.id} onClick={() => onEdit(event)}>
                  <span>{event.category || '♫'}</span><strong>{event.name}</strong><small>{event.startTime || ''} {event.venue ? `· ${event.venue}` : ''}</small>
                </button>
              ))}
          </div>
        </div>
      </section>

      <div className="events-page-heading">
        <div><span className="eyebrow">EVENTOS DE TU ESTUDIO</span><h2>{editingEvent ? 'Editar evento' : 'Crear un evento'} <span>🎸</span></h2></div>
        <span className="events-heading-note">MAKE IT LOUD! ✦</span>
      </div>

      <form className="event-layout" onSubmit={submit}>
        <div className="event-column event-column-main">
          <section className="content-card event-card event-basic-card">
            <span className="event-card-sticker" aria-hidden="true">🎤</span>
            <div className="event-card-heading"><span className="event-step">01</span><div><span className="eyebrow">EMPECEMOS POR LO BÁSICO</span><h3>Información básica</h3></div><span className="event-heading-scribble">THE<br />SHOW!</span></div>
            <div className="event-fields">
              <label className="field-label event-field-wide">Nombre del evento <span>*</span>
                <input required maxLength="100" value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Ej. Noche de beats: Vol. 1" />
              </label>
              <label className="field-label event-field-wide">Descripción
                <textarea maxLength="500" rows="3" value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Describe el evento para que todos quieran estar ahí..." />
                <small className="field-hint">{form.description.length}/500 caracteres</small>
              </label>
              <label className="field-label">Categoría
                <select value={form.category} onChange={(event) => update('category', event.target.value)}>
                  <option value="">Selecciona un género</option>
                  {EVENT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              <label className="field-label">Estado
                <select value={form.status} onChange={(event) => update('status', event.target.value)}>
                  <option>Activo</option><option>Borrador</option><option>Agotado</option>
                </select>
              </label>
            </div>
          </section>

          <section className="content-card event-card event-datetime-card">
            <span className="event-card-sticker date-sticker" aria-hidden="true">📆</span>
            <div className="event-card-heading"><span className="event-step step-coral">02</span><div><span className="eyebrow">MARCA EL CALENDARIO</span><h3>Fecha y hora</h3></div><span className="event-heading-scribble date-scribble">SAVE<br />THE DATE</span></div>
            <div className="event-fields event-date-fields">
              <label className="field-label">Fecha del evento <span>*</span>
                <input required type="date" value={form.date} onChange={(event) => update('date', event.target.value)} />
              </label>
              <label className="field-label">Hora de inicio <span>*</span>
                <input required type="time" value={form.startTime} onChange={(event) => update('startTime', event.target.value)} />
              </label>
              <label className="field-label">Hora de fin
                <input type="time" value={form.endTime} onChange={(event) => update('endTime', event.target.value)} />
              </label>
            </div>
            <p className="timezone-note"><span>🌐</span> La hora se mostrará según la zona horaria local.</p>
          </section>

          <section className="content-card event-card event-location-card">
            <span className="event-card-sticker location-sticker" aria-hidden="true">📍</span>
            <div className="event-card-heading"><span className="event-step step-teal">03</span><div><span className="eyebrow">¿DÓNDE NOS VEMOS?</span><h3>Ubicación</h3></div><span className="event-heading-scribble location-scribble">MEET<br />ME THERE!</span></div>
            <div className="event-fields">
              <label className="field-label event-field-wide">Lugar / recinto
                <input maxLength="100" value={form.venue} onChange={(event) => update('venue', event.target.value)} placeholder="Ej. Coliseo Metropolitano" />
              </label>
              <label className="field-label event-field-wide">Dirección
                <input maxLength="160" value={form.address} onChange={(event) => update('address', event.target.value)} placeholder="Ej. Calle 50 # 70-123" />
              </label>
              <label className="field-label">Ciudad
                <input maxLength="80" value={form.city} onChange={(event) => update('city', event.target.value)} placeholder="Selecciona o escribe una ciudad" />
              </label>
              <label className="field-label">País
                <select value={form.country} onChange={(event) => update('country', event.target.value)}>
                  {['Colombia', 'México', 'Argentina', 'Chile', 'España', 'Estados Unidos', 'Otro'].map((country) => <option key={country}>{country}</option>)}
                </select>
              </label>
            </div>
          </section>
        </div>

        <div className="event-column event-column-art">
          <section className="content-card event-card event-art-card">
            <div className="event-card-heading compact-heading"><span className="event-step step-purple">04</span><div><span className="eyebrow">VISTE TU EVENTO</span><h3>Imagen del evento</h3></div></div>
            <label className={`event-image-drop ${coverPreview ? 'has-cover' : ''}`}>
              <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(event) => chooseCover(event.target.files?.[0])} />
              {coverPreview ? <img src={coverPreview} alt="Vista previa de la imagen del evento" /> : (
                <span className="event-image-placeholder"><span>🛸</span><strong>Arrastra tu arte aquí</strong><small>o elige una imagen JPG, PNG o WEBP · Máx. 10 MB</small></span>
              )}
              <span className="event-image-button">{coverPreview ? 'Cambiar imagen' : '＋ Seleccionar imagen'}</span>
            </label>
            <div className="event-preview-label"><span>✦</span> VISTA PREVIA <span>✦</span></div>
            <article className="event-preview-card">
              {coverPreview
                ? <img className="event-preview-image" src={coverPreview} alt="" />
                : <div className="event-preview-art"><span>♫</span><i>✳</i><b>LIVE</b></div>}
              <span className="event-preview-category">{form.category || 'MÚSICA EN VIVO'}</span>
              <h4>{form.name || 'Tu evento va aquí'}</h4>
              <p>📅 {form.date || 'Elige una fecha'} {form.startTime && ` · ${form.startTime}`}</p>
              <p>📍 {form.venue || form.city || 'Tu escenario, tu ciudad'}</p>
            </article>
          </section>

          <section className="content-card event-card ticket-card">
            <span className="event-card-sticker ticket-sticker" aria-hidden="true">🎟️</span>
            <div className="event-card-heading compact-heading"><span className="event-step step-pink">05</span><div><span className="eyebrow">LISTOS PARA ENTRAR</span><h3>Entradas</h3></div></div>
            <div className="ticket-fields">
              {form.tickets.map((ticket, index) => (
                <div className="ticket-type" key={ticket.id}>
                  <div className="ticket-type-title"><span>🎫 TIPO DE ENTRADA {index + 1}</span>{form.tickets.length > 1 && <button type="button" onClick={() => removeTicket(ticket.id)} aria-label="Quitar tipo de entrada">×</button>}</div>
                  <label className="field-label">Nombre
                    <input required maxLength="50" value={ticket.name} onChange={(event) => updateTicket(ticket.id, 'name', event.target.value)} placeholder="General" />
                  </label>
                  <div className="ticket-price-quantity">
                    <label className="field-label">Precio
                      <span className="price-input"><b>$</b><input type="number" min="0" step="1000" value={ticket.price} onChange={(event) => updateTicket(ticket.id, 'price', event.target.value)} placeholder="0" /></span>
                    </label>
                    <label className="field-label">Cantidad
                      <input required type="number" min="1" value={ticket.quantity} onChange={(event) => updateTicket(ticket.id, 'quantity', event.target.value)} placeholder="100" />
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="add-ticket-button" onClick={addTicket}><span>＋</span> Agregar otro tipo de entrada</button>
          </section>

          <section className="content-card event-card event-settings-card">
            <div className="event-card-heading compact-heading"><span className="event-step step-yellow">06</span><div><span className="eyebrow">TÚ PONES LAS REGLAS</span><h3>Configuración adicional</h3></div></div>
            <ToggleSetting title="Permitir devoluciones" description="Los asistentes pueden solicitar reembolso." checked={form.refunds} onChange={(value) => update('refunds', value)} />
            <ToggleSetting title="Evento destacado" description="Dale un lugar especial en tu página." checked={form.featured} onChange={(value) => update('featured', value)} />
            <div className="event-fields event-sale-fields">
              <label className="field-label">Venta desde
                <input type="date" value={form.saleStart} onChange={(event) => update('saleStart', event.target.value)} />
              </label>
              <label className="field-label">Venta hasta
                <input type="date" value={form.saleEnd} onChange={(event) => update('saleEnd', event.target.value)} />
              </label>
            </div>
            <label className="field-label age-field">Edad mínima
              <span className="age-input"><input type="number" min="0" max="99" value={form.age} onChange={(event) => update('age', event.target.value)} /><b>años</b></span>
            </label>
          </section>

          <div className="event-submit-row">
            <span>🚀 Tu próximo show comienza con un clic.</span>
            {editingEvent && <button type="button" className="button button-outline" onClick={onCancelEdit}>Cancelar</button>}
            <button type="submit" className="button button-primary event-submit" disabled={saving}>{saving ? 'Guardando...' : <>{editingEvent ? 'Guardar cambios' : 'Guardar evento'} <span>✦</span></>}</button>
          </div>
        </div>
      </form>

      <section className="events-saved-section">
        <div className="events-page-heading"><div><span className="eyebrow">TU CARTELERA</span><h2>Eventos creados <span className="count-pill">{events.length}</span></h2></div><span className="events-heading-note">GOOD TIMES AHEAD ✨</span></div>
        {events.length === 0 ? (
          <div className="events-empty"><span>🎪</span><strong>Tu escenario está esperando.</strong><p>Crea tu primer evento y aquí aparecerá tu cartelera.</p></div>
        ) : (
          <div className="saved-event-grid">
            {events.map((savedEvent, index) => (
              <article className="saved-event-card" key={savedEvent.id}>
                {savedEvent.imageUrl ? <img src={savedEvent.imageUrl} alt="" /> : <div className={`saved-event-art saved-event-art-${index % 3}`}>🎵</div>}
                <div className="saved-event-info"><span>{savedEvent.category || 'MÚSICA'} · {savedEvent.status}</span><h3>{savedEvent.name}</h3><p>📅 {savedEvent.date} · {savedEvent.startTime}</p><p>📍 {savedEvent.venue || savedEvent.city || savedEvent.country}</p></div>
                <button type="button" className="edit-event-button" onClick={() => onEdit(savedEvent)} aria-label={`Editar evento ${savedEvent.name}`} title="Editar evento">✎</button>
                <button type="button" className="delete-event-button" onClick={() => onDelete(savedEvent.id)} aria-label={`Eliminar evento ${savedEvent.name}`}>×</button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ToggleSetting({ title, description, checked, onChange }) {
  return (
    <label className="event-toggle-row">
      <span><strong>{title}</strong><small>{description}</small></span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <i aria-hidden="true" />
    </label>
  );
}
