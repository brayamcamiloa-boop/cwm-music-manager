const formatDuration = (seconds) => {
  const total = (Number(seconds) || 0);
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return remainder ? `${minutes} min ${remainder} s` : `${minutes} min`;
};

function daysUntil(date) {
  if (!date) return null;
  const eventDate = new Date(`${date}T00:00:00`);
  if (Number.isNaN(eventDate.getTime())) return null;
  return Math.ceil((eventDate - new Date(new Date().toDateString())) / 86400000);
}

export default function InsightsView({ library, onNavigate }) {
  const sortedTracks = [...library.tracks].sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
  const totalPlays = library.tracks.reduce((sum, track) => sum + (Number(track.playCount) || 0), 0);
  const totalDuration = library.tracks.reduce((sum, track) => sum + (Number(track.duration) || 0), 0);
  const upcoming = library.events
    .map((event) => ({ ...event, days: daysUntil(event.date) }))
    .filter((event) => event.days !== null && event.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, 4);
  const peak = Math.max(1, ...sortedTracks.slice(0, 5).map((track) => Number(track.playCount) || 0));

  return (
    <div className="insights-page">
      <section className="insights-hero">
        <span className="eyebrow">CWM · TU MÚSICA EN NÚMEROS</span>
        <h1>El pulso de tu estudio <span>📈</span></h1>
        <p>Reproducciones que inicias desde CWM y próximos shows en un mismo vistazo.</p>
        <span className="insights-hero-doodle" aria-hidden="true">♫</span>
      </section>
      <div className="insight-stat-grid">
        <article className="insight-stat"><span>▶️</span><small>Reproducciones</small><strong>{totalPlays}</strong><i>PLAY IT AGAIN</i></article>
        <article className="insight-stat"><span>💿</span><small>Temas en biblioteca</small><strong>{library.tracks.length}</strong><i>ALL YOUR BEATS</i></article>
        <article className="insight-stat"><span>⏱️</span><small>Tiempo de música</small><strong>{formatDuration(totalDuration)}</strong><i>NON-STOP</i></article>
        <article className="insight-stat"><span>🎪</span><small>Eventos próximos</small><strong>{upcoming.length}</strong><i>SEE YOU THERE</i></article>
      </div>
      <div className="insights-columns">
        <section className="content-card insights-panel">
          <div className="section-heading"><div><span className="eyebrow">LO QUE MÁS SUENA</span><h2>Temas destacados <span>🔥</span></h2></div></div>
          {sortedTracks.length === 0 ? (
            <div className="empty-state"><span className="empty-icon">♫</span><h3>Aún no hay estadísticas</h3><p>Agrega y reproduce temas para ver su actividad.</p><button className="text-button" onClick={() => onNavigate('Temas')}>Ir a temas →</button></div>
          ) : (
            <div className="chart-list">
              {sortedTracks.slice(0, 5).map((track, index) => {
                const count = Number(track.playCount) || 0;
                return (
                  <div className="chart-row" key={track.id}>
                    <span className="chart-rank">{String(index + 1).padStart(2, '0')}</span>
                    <span className={`chart-art chart-art-${index % 4}`}>♫</span>
                    <div className="chart-track"><strong>{track.title}</strong><small>{track.producerName || 'Sin productor'}</small><div className="chart-bar"><i style={{ width: `${count ? Math.max(6, (count / peak) * 100) : 0}%` }} /></div></div>
                    <b>{count} <small>plays</small></b>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        <section className="content-card insights-panel upcoming-panel">
          <div className="section-heading"><div><span className="eyebrow">MARCA EL CALENDARIO</span><h2>Próximos eventos <span>🗓️</span></h2></div><button className="text-button" onClick={() => onNavigate('Eventos')}>Ver calendario →</button></div>
          {upcoming.length === 0 ? (
            <div className="empty-state"><span className="empty-icon">🎪</span><h3>Escenario libre</h3><p>Cuando programes un evento, su cuenta regresiva aparecerá aquí.</p><button className="text-button" onClick={() => onNavigate('Eventos')}>Crear evento →</button></div>
          ) : (
            <div className="upcoming-list">
              {upcoming.map((event) => (
                <article className="upcoming-row" key={event.id}>
                  <div className="upcoming-date"><strong>{event.date.slice(8, 10)}</strong><span>{new Date(`${event.date}T12:00:00`).toLocaleDateString('es', { month: 'short' })}</span></div>
                  <div><strong>{event.name}</strong><small>📍 {event.venue || event.city || event.country}</small></div>
                  <span className="upcoming-countdown">{event.days === 0 ? 'HOY' : `EN ${event.days} D`}</span>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
