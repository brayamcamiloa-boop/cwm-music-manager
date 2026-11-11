const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

app.setName('CWM');
if (process.platform === 'win32') app.setAppUserModelId('com.cwm.musicmanager');

const MAX_MEDIA_BYTES = 100 * 1024 * 1024;
const MIME_BY_EXTENSION = {
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4', '.mp4': 'audio/mp4', '.aac': 'audio/aac',
  '.flac': 'audio/flac', '.webm': 'audio/webm',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
};
const MEDIA_ID_PATTERN = /^[0-9a-f-]{36}\.(mp3|wav|ogg|m4a|mp4|aac|flac|webm|jpg|jpeg|png|webp)$/i;

const userDataPath = () => app.getPath('userData');
const libraryPath = () => path.join(userDataPath(), 'library.json');
const mediaPath = () => path.join(userDataPath(), 'media');

ipcMain.handle('library:load', async () => {
  try {
    const library = JSON.parse(await fs.readFile(libraryPath(), 'utf8'));
    if (!Array.isArray(library.producers) || !Array.isArray(library.tracks)) {
      throw new Error('El archivo de biblioteca no tiene el formato esperado.');
    }
    return {
      ...library,
      events: Array.isArray(library.events) ? library.events : [],
      playlists: Array.isArray(library.playlists) ? library.playlists : [],
    };
  } catch (error) {
    if (error.code === 'ENOENT') return { producers: [], tracks: [], events: [], playlists: [] };
    throw error;
  }
});

let writeQueue = Promise.resolve();
ipcMain.handle('library:save', (_event, library) => {
  if (!library || !Array.isArray(library.producers) || !Array.isArray(library.tracks)) {
    throw new Error('No se puede guardar una biblioteca con formato inválido.');
  }
  const write = writeQueue.then(async () => {
    await fs.mkdir(userDataPath(), { recursive: true });
    const destination = libraryPath();
    const temporary = `${destination}.${randomUUID()}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(library, null, 2), 'utf8');
    await fs.rename(temporary, destination);
  });
  writeQueue = write.catch(() => {});
  return write;
});

ipcMain.handle('media:save', async (_event, { name, bytes }) => {
  if (typeof name !== 'string' || !(bytes instanceof Uint8Array)) {
    throw new Error('El archivo seleccionado no es válido.');
  }
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_MEDIA_BYTES) {
    throw new Error('El archivo debe tener contenido y pesar menos de 100 MB.');
  }
  const extension = path.extname(path.basename(name)).toLowerCase();
  if (!Object.hasOwn(MIME_BY_EXTENSION, extension)) {
    throw new Error('Formato no compatible. Usa MP3, WAV, OGG, M4A, FLAC o una imagen JPG, PNG o WEBP.');
  }
  const id = `${randomUUID()}${extension}`;
  await fs.mkdir(mediaPath(), { recursive: true });
  await fs.writeFile(path.join(mediaPath(), id), Buffer.from(bytes));
  return { id, mimeType: MIME_BY_EXTENSION[extension] };
});

ipcMain.handle('media:read', async (_event, id) => {
  if (typeof id !== 'string' || !MEDIA_ID_PATTERN.test(id)) {
    throw new Error('La referencia al archivo multimedia no es válida.');
  }
  const bytes = await fs.readFile(path.join(mediaPath(), id));
  return { bytes, mimeType: MIME_BY_EXTENSION[path.extname(id).toLowerCase()] };
});

ipcMain.handle('media:delete', async (_event, id) => {
  if (typeof id !== 'string' || !MEDIA_ID_PATTERN.test(id)) {
    throw new Error('La referencia al archivo multimedia no es válida.');
  }
  await fs.unlink(path.join(mediaPath(), id));
});

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 960,
    minHeight: 680,
    backgroundColor: '#101c1d',
    title: 'CWM — Music Manager',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    window.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});