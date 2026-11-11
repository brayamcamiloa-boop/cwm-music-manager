import { useRef, useState } from 'react';

export default function BackupTools({ onExport, onImport }) {
  const fileInput = useRef(null);
  const [busy, setBusy] = useState(false);

  async function exportBackup() {
    setBusy(true);
    try {
      await onExport();
    } catch (error) {
      window.alert(`No se pudo exportar el respaldo: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function importBackup(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const backup = JSON.parse(await file.text());
      if (backup.format !== 'CWM_BACKUP' || backup.version !== 1) {
        throw new Error('El archivo no es un respaldo CWM compatible.');
      }
      if (!Array.isArray(backup.library?.producers) || !Array.isArray(backup.library?.tracks)
        || (backup.library.events !== undefined && !Array.isArray(backup.library.events))
        || (backup.library.playlists !== undefined && !Array.isArray(backup.library.playlists))) {
        throw new Error('El respaldo no contiene una biblioteca válida.');
      }
      const { producers, tracks, events = [], playlists = [] } = backup.library;
      const missingAudio = tracks.filter((track) => !track.audioBackup?.dataUrl && !track.audioDataUrl);
      const summary = [
        `Productores: ${producers.length}`,
        `Temas: ${tracks.length}`,
        `Eventos: ${events.length}`,
        `Playlists: ${playlists.length}`,
      ].join('\n');
      if (!window.confirm(`El respaldo contiene:\n${summary}\n\nRestaurarlo reemplazará toda la biblioteca actual. ¿Deseas continuar?`)) return;
      if (missingAudio.length > 0) {
        const titles = missingAudio.slice(0, 5).map((track) => `• ${track.title || 'Tema sin título'}`).join('\n');
        const remainder = missingAudio.length > 5 ? `\n• y ${missingAudio.length - 5} más` : '';
        if (!window.confirm(`ATENCIÓN: ${missingAudio.length} tema(s) no incluyen su archivo de audio:\n${titles}${remainder}\n\nSe restaurarán sin audio y no se podrán reproducir. ¿Continuar de todos modos?`)) return;
      }
      await onImport(backup);
    } catch (error) {
      window.alert(`No se pudo restaurar el respaldo: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="content-card backup-card">
      <div className="backup-copy">
        <span className="backup-icon">🧰</span>
        <div><span className="eyebrow">CUIDA TU TRABAJO</span><h2>Respaldo de biblioteca</h2><p>Exporta productores, eventos, playlists, estadísticas y archivos multimedia para moverlos a otro computador.</p></div>
      </div>
      <div className="backup-actions">
        <button type="button" className="button button-outline" onClick={() => fileInput.current?.click()} disabled={busy}>↥ Restaurar respaldo</button>
        <button type="button" className="button button-primary" onClick={exportBackup} disabled={busy}>{busy ? 'Preparando...' : <>↓ Exportar respaldo</>}</button>
        <input ref={fileInput} type="file" accept=".json,application/json" onChange={importBackup} hidden />
      </div>
    </section>
  );
}
