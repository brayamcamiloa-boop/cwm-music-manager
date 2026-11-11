const sections = [
  { name: 'Resumen', icon: '🏠' },
  { name: 'Eventos', icon: '🎪' },
  { name: 'Productores', icon: '🎤' },
  { name: 'Temas', icon: '💿' },
  { name: 'Reproducciones', icon: '🎧' },
  { name: 'Estadísticas', icon: '📈' },
  { name: 'Playlists', icon: '📼' },
];

export default function Sidebar({ activeSection, onNavigate, trackCount }) {
  return (
    <aside className="sidebar">
      <a className="brand" href="#" onClick={(event) => { event.preventDefault(); onNavigate('Resumen'); }}>
        <img className="brand-graffiti-logo" src="/images/cwm-graffiti-logo-green.png" alt="CWM" />
        <span className="brand-mark"><span>C</span><i>✳</i></span>
        <span className="brand-name">CWM<small>MUSIC MANAGER</small></span>
      </a>
      <div className="sidebar-label">MENÚ PRINCIPAL</div>
      <nav className="side-nav" aria-label="Navegación principal">
        {sections.map((section) => (
          <button
            className={`nav-item ${activeSection === section.name ? 'active' : ''}`}
            key={section.name}
            onClick={() => onNavigate(section.name)}
            aria-current={activeSection === section.name ? 'page' : undefined}
          >
            <span className="nav-icon" aria-hidden="true">{section.icon}</span>
            <span>{section.name}</span>
            {section.name === 'Temas' && <span className="nav-count">{trackCount}</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="upgrade-card">
          <span className="upgrade-spark" aria-hidden="true">⚡<i>✦</i></span>
          <strong>El sonido<br />es todo tuyo.</strong>
          <p>Productores, beats y nuevas ideas en un solo lugar.</p>
          <span className="upgrade-link">CREA SIN LÍMITES <span>↗</span></span>
        </div>
        <div className="sidebar-footer"><span className="status-dot" /> Biblioteca local</div>
      </div>
    </aside>
  );
}