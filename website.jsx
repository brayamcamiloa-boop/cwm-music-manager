import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './website.css';

const DOWNLOAD_URL = 'https://github.com/brayamcamiloa-boop/cwm-music-manager/releases/download/v1.0.1/CWM.Setup.1.0.1.exe';

const features = [
  {
    number: '01',
    emoji: '👾',
    title: 'Tu equipo, bien organizado',
    description: 'Crea fichas de productores con su nombre, correo, género y una breve descripción. Encuentra sus temas en un solo lugar.',
    image: './images/menu-producers-cyan.jpg',
    alt: 'Ilustración de monstruos azules estilo cómic',
    className: 'feature-producers',
    tag: 'PRODUCTORES',
  },
  {
    number: '02',
    emoji: '💿',
    title: 'Una biblioteca hecha a tu medida',
    description: 'Agrega canciones con su portada, productor, género y BPM. Busca y filtra tus archivos cuando quieras.',
    image: './images/menu-tracks-purple.jpg',
    alt: 'Ilustración psicodélica de alienígenas y música',
    className: 'feature-library',
    tag: 'TEMAS',
  },
  {
    number: '03',
    emoji: '🎧',
    title: 'Dale play a tus ideas',
    description: 'Escucha tus archivos desde CWM, recorre la cola y vuelve a los temas que más suenan en tu estudio.',
    image: './images/menu-playback-orange.jpg',
    alt: 'Ilustración de música y energía en tonos naranjas',
    className: 'feature-playback',
    tag: 'REPRODUCCIÓN',
  },
  {
    number: '04',
    emoji: '🎪',
    title: 'Cada show, en el calendario',
    description: 'Planea conciertos y festivales con fecha, lugar, horarios, entradas y una imagen para cada evento.',
    image: './images/menu-events-red.jpg',
    alt: 'Ilustración roja de monstruos y escenario',
    className: 'feature-events',
    tag: 'EVENTOS',
  },
];

const faqs = [
  {
    question: '¿CWM funciona en línea?',
    answer: 'CWM es una aplicación de escritorio. Tu biblioteca y tus archivos se guardan localmente en este computador; no necesitas crear una cuenta.',
  },
  {
    question: '¿Cómo paso mi biblioteca a otro computador?',
    answer: 'En la aplicación, exporta un respaldo desde la herramienta “Respaldo de biblioteca”. El archivo incluye tu información y los archivos multimedia para que puedas restaurarlo en el otro equipo.',
  },
  {
    question: '¿Qué archivos de audio puedo agregar?',
    answer: 'CWM acepta MP3, WAV, OGG, M4A, MP4, AAC, FLAC y WEBM. Cada archivo de audio puede pesar hasta 100 MB. Las portadas admiten JPG, PNG y WEBP.',
  },
  {
    question: '¿Qué incluye la descarga?',
    answer: 'La descarga disponible aquí es el instalador para Windows (.exe), versión 1.0.1. Al abrirlo puedes elegir dónde instalar CWM y crear accesos directos.',
  },
];

function Logo({ light = false }) {
  return (
    <a className={`site-logo ${light ? 'site-logo-light' : ''}`} href="#inicio" aria-label="CWM, volver al inicio">
      <span className="logo-mark"><span>C</span><i>✳</i></span>
      <span className="logo-name">CWM<small>MUSIC MANAGER</small></span>
    </a>
  );
}

function DownloadLink({ className = '', children }) {
  return (
    <a className={className} href={DOWNLOAD_URL} download="CWM.Setup.1.0.1.exe">
      {children}
    </a>
  );
}

function EmojiSpray({ className = '' }) {
  return (
    <div className={`emoji-spray ${className}`} aria-hidden="true">
      <span>⚡</span><span>🎧</span><span>👾</span><span>💿</span><span>🤘</span>
    </div>
  );
}

function AppPreview() {
  return (
    <div className="preview-wrap" aria-label="Vista ilustrativa de la biblioteca de CWM">
      <div className="preview-float preview-float-top"><span>✦</span> Vista ilustrativa · CWM</div>
      <div className="app-preview">
        <aside className="preview-sidebar">
          <div className="preview-brand"><span className="preview-brand-mark">C</span><b>CWM<small>MUSIC MANAGER</small></b></div>
          <span className="preview-menu-label">MENÚ PRINCIPAL</span>
          <span className="preview-nav preview-nav-active"><i>⌂</i> Resumen</span>
          <span className="preview-nav"><i>♧</i> Eventos</span>
          <span className="preview-nav"><i>♬</i> Productores</span>
          <span className="preview-nav"><i>▣</i> Temas</span>
          <span className="preview-nav"><i>♫</i> Reproducciones</span>
          <span className="preview-nav"><i>▤</i> Playlists</span>
          <div className="preview-sidebar-note"><span>✳</span><b>El sonido<br />es todo tuyo.</b><small>Tu estudio, a tu ritmo.</small></div>
        </aside>
        <div className="preview-main">
          <div className="preview-topbar"><span>CWM&nbsp; / &nbsp;<b>Tu estudio, en un solo lugar</b></span><i>● &nbsp;Mi estudio</i></div>
          <div className="preview-content">
            <section className="preview-welcome">
              <span>✳&nbsp; TU ESPACIO CREATIVO</span>
              <h2>Todo tu sonido.<br /><em>En armonía.</em></h2>
              <p>Productores, beats y nuevas ideas en un solo lugar.</p>
              <span className="preview-add">＋ Agregar un tema</span>
              <div className="preview-record"><i>♫</i></div>
              <span className="preview-sticker">ZAP!</span>
            </section>
            <div className="preview-stats">
              <div><small>💿 &nbsp;TEMAS GUARDADOS</small><b>24</b></div>
              <div><small>🎤 &nbsp;PRODUCTORES</small><b>08</b></div>
              <div><small>⏱️ &nbsp;DURACIÓN TOTAL</small><b>2 h 16</b></div>
            </div>
            <div className="preview-list">
              <div className="preview-list-heading"><b>Lo último en tu biblioteca</b><span>Ver temas&nbsp; ↗</span></div>
              <div className="preview-track"><span className="preview-art art-one">♫</span><b>Luces de la ciudad<small>Alex Rivera · Indie pop</small></b><span>♬</span><i>03:42</i></div>
              <div className="preview-track"><span className="preview-art art-two">✳</span><b>Otra dimensión<small>Nova Beats · Electrónica</small></b><span>♬</span><i>02:58</i></div>
            </div>
          </div>
        </div>
      </div>
      <div className="preview-float preview-float-bottom"><span>♫</span> Tu biblioteca. Tu computador.</div>
    </div>
  );
}

function Website() {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="website">
      <a className="brand-masthead" href="#inicio" aria-label="CWM, volver al inicio">
        <img src="./images/cwm-graffiti-logo-green.png" alt="Logo CWM verde en estilo grafiti" />
        <span className="masthead-emoji masthead-emoji-left" aria-hidden="true">🤘</span>
        <span className="masthead-emoji masthead-emoji-right" aria-hidden="true">👽</span>
      </a>
      <header className="site-header" id="inicio">
        <div className="nav-container">
          <Logo />
          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span /><span />
          </button>
          <nav className={`site-nav ${menuOpen ? 'site-nav-open' : ''}`} aria-label="Navegación">
            <a href="#funciones" onClick={closeMenu}>Funciones</a>
            <a href="#guia" onClick={closeMenu}>Guía de uso</a>
            <a href="#preguntas" onClick={closeMenu}>Preguntas</a>
            <DownloadLink className="button button-dark nav-download">⬇️ <span>Descargar CWM</span></DownloadLink>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-copy">
              <div className="hero-eyebrow"><span className="live-dot" /> TU ESTUDIO MUSICAL, EN ORDEN</div>
              <h1>Tu música.<br />Tu mundo.<br /><span>Todo en CWM.</span></h1>
              <p>Organiza productores, guarda tus temas, prepara playlists y ten tus próximos shows a la vista. Todo desde tu computador.</p>
              <div className="hero-actions">
                <DownloadLink className="button button-lime">Descargar para Windows <span>↗</span></DownloadLink>
                <a className="button button-quiet" href="#funciones">Conoce CWM <span>↓</span></a>
              </div>
              <div className="hero-note"><span>◉</span> Aplicación de escritorio <i /> Windows · 128 MB <i /> Datos locales</div>
            </div>
            <AppPreview />
            <div className="hero-doodles" aria-hidden="true">
              <span className="hero-doodle-music">♫</span>
              <span className="hero-doodle-zap">ZAP!</span>
              <span className="hero-doodle-alien">👾</span>
              <span className="hero-doodle-star">✳</span>
            </div>
          </div>
          <div className="hero-bottom-line"><span>MADE FOR THE MUSIC YOU MAKE</span><span>DESLIZA PARA DESCUBRIR&nbsp; ↓</span></div>
          <EmojiSpray className="stickers-hero" />
        </section>

        <section className="quick-facts" aria-label="Características principales">
          <div><span className="fact-icon fact-purple">🎹</span><b>Tu biblioteca musical</b><small>Audio y portadas, en un lugar</small></div>
          <div><span className="fact-icon fact-coral">✨</span><b>Hecho para tu estudio</b><small>Productores, eventos y playlists</small></div>
          <div><span className="fact-icon fact-green">🏠</span><b>Privado y local</b><small>Tu biblioteca vive en tu equipo</small></div>
          <EmojiSpray className="stickers-facts" />
        </section>

        <section className="features section-wrap" id="funciones">
          <div className="section-intro">
            <span className="eyebrow">MÁS QUE UNA BIBLIOTECA</span>
            <h2>Todo lo que mueve<br />tu música, <span>en un mismo lugar.</span></h2>
            <p>Menos archivos perdidos. Más tiempo para escuchar, organizar y crear.</p>
          </div>
          <div className="feature-grid">
            {features.map((feature) => (
              <article className={`feature-card ${feature.className}`} key={feature.number}>
                <div className="feature-image">
                  <img src={feature.image} alt={feature.alt} loading="lazy" />
                  <span className="feature-image-label">{feature.tag} <i>{feature.emoji}</i></span>
                </div>
                <div className="feature-copy">
                  <span className="feature-number">{feature.number} / CWM</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="extra-features">
            <article><span className="extra-icon extra-lilac">📼</span><div><h3>Playlists para cada momento</h3><p>Elige tus temas, ordénalos en colecciones y reprodúcelos como una cola.</p></div></article>
            <article><span className="extra-icon extra-yellow">📈</span><div><h3>Estadísticas de tu estudio</h3><p>Revisa las reproducciones que inicias en CWM, tus temas destacados y próximos eventos.</p></div></article>
            <article><span className="extra-icon extra-mint">💾</span><div><h3>Respalda tu biblioteca</h3><p>Exporta y restaura tus productores, eventos, playlists, temas y archivos multimedia.</p></div></article>
          </div>
          <EmojiSpray className="stickers-features" />
        </section>

        <section className="guide" id="guia">
          <div className="guide-inner section-wrap">
            <div className="guide-heading">
              <span className="eyebrow">EMPIEZA EN UNOS PASOS</span>
              <h2>De la descarga<br />a tu primer <span>play.</span></h2>
              <p>CWM está listo para acompañar el día a día de tu estudio.</p>
              <DownloadLink className="button button-lime">Descargar CWM <span>↗</span></DownloadLink>
              <div className="guide-art" aria-hidden="true"><span>♫</span><i>✳</i><b>MAKE<br />NOISE!</b></div>
            </div>
            <div className="guide-steps">
              <article className="guide-step">
                <span className="step-number">01</span>
                <div><h3>Descarga e instala</h3><p>Descarga el instalador para Windows, ábrelo y sigue los pasos. Puedes elegir dónde instalar la aplicación.</p></div>
                <span className="step-symbol">📥</span>
              </article>
              <article className="guide-step">
                <span className="step-number">02</span>
                <div><h3>Registra a tus productores</h3><p>Entra en “Productores” y guarda su nombre y correo. Puedes añadir género y una descripción para completar cada ficha.</p></div>
                <span className="step-symbol">🎤</span>
              </article>
              <article className="guide-step">
                <span className="step-number">03</span>
                <div><h3>Agrega tus temas y escucha</h3><p>En “Temas”, elige un audio, añade sus datos y, si quieres, una portada. Luego dale play desde Reproducciones.</p></div>
                <span className="step-symbol">🎵</span>
              </article>
              <article className="guide-step">
                <span className="step-number">04</span>
                <div><h3>Organiza y haz tu respaldo</h3><p>Arma playlists, agenda tus eventos y exporta un respaldo para mantener una copia de tu biblioteca.</p></div>
                <span className="step-symbol">✨</span>
              </article>
            </div>
            <EmojiSpray className="stickers-guide" />
          </div>
        </section>

        <section className="local-note section-wrap">
          <div className="local-note-icon">🏠</div>
          <div><span className="eyebrow">TU MÚSICA SE QUEDA CONTIGO</span><h2>Un espacio para tu música.<br /><span>Guardado en tu computador.</span></h2><p>CWM guarda localmente tu biblioteca y archivos. Crea respaldos con regularidad y guárdalos en un lugar seguro para poder restaurarlos cuando los necesites.</p></div>
          <div className="local-note-stamp">LOCAL<br /><b>FIRST</b><span>✳</span></div>
          <EmojiSpray className="stickers-local" />
        </section>

        <section className="faq section-wrap" id="preguntas">
          <div className="faq-heading">
            <span className="eyebrow">ANTES DE DARLE PLAY</span>
            <h2>Preguntas<br /><span>frecuentes.</span></h2>
            <p>Lo esencial para arrancar sin perder el ritmo.</p>
          </div>
          <div className="faq-list">
            {faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}<span>＋</span></summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
          <EmojiSpray className="stickers-faq" />
        </section>

        <section className="download-cta">
          <div className="download-cta-content">
            <span className="eyebrow">TU SIGUIENTE SESIÓN EMPIEZA AQUÍ</span>
            <h2>Tu música merece<br />su propio <span>espacio.</span></h2>
            <p>Descarga CWM Music Manager y empieza a organizar tu estudio.</p>
            <DownloadLink className="button button-lime">Descargar para Windows <span>↗</span></DownloadLink>
            <small>Windows · Instalador .exe · 128 MB · Versión 1.0.1</small>
          </div>
          <div className="download-cta-art" aria-hidden="true">
            <img src="./images/menu-summary-green.jpg" alt="" loading="lazy" />
            <span>¡QUE EMPIECE<br />EL BEAT! <i>♫</i></span>
          </div>
          <span className="cta-record" aria-hidden="true">🎵</span>
          <EmojiSpray className="stickers-download" />
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand"><Logo light /><p>Todo tu sonido.<br />En armonía.</p></div>
          <div className="footer-links"><a href="#funciones">Funciones</a><a href="#guia">Guía de uso</a><a href="#preguntas">Preguntas frecuentes</a></div>
          <div className="footer-download"><span>¿Listo para empezar?</span><DownloadLink className="button button-lime">Descargar CWM ↗</DownloadLink></div>
        </div>
        <div className="footer-bottom"><span>© 2026 CWM Music Manager · Camilo Ariza Velasco&nbsp; 👾</span><span>Hecho para la música que haces&nbsp; 🎧</span></div>
      </footer>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('No se encontró el contenedor de la página web de CWM.');

const root = createRoot(rootElement);
root.render(<Website />);

if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
