const DATABASE_NAME = 'cwm-media';
const STORE_NAME = 'media';
const DATABASE_VERSION = 1;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('No se pudo abrir el almacenamiento multimedia.'));
    request.onblocked = () => reject(new Error('El almacenamiento multimedia está bloqueado por otra ventana de CWM.'));
  });
}

export async function saveLocalMedia(file) {
  const bytes = file.bytes instanceof Uint8Array
    ? file.bytes
    : new Uint8Array(await file.arrayBuffer());
  const mimeType = file.type || file.mimeType || 'application/octet-stream';
  const id = crypto.randomUUID();
  const database = await openDatabase();

  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).add({
        id,
        name: file.name || id,
        mimeType,
        blob: new Blob([bytes], { type: mimeType }),
      });
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error('No se pudo guardar el archivo multimedia.'));
      transaction.onabort = () => reject(transaction.error || new Error('Se canceló el guardado del archivo multimedia.'));
    });
    return { id, mimeType };
  } finally {
    database.close();
  }
}

export async function readLocalMedia(id) {
  const database = await openDatabase();

  try {
    const record = await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => {
        if (!request.result) {
          reject(new Error(`No se encontró el archivo multimedia ${id}.`));
          return;
        }
        resolve(request.result);
      };
      request.onerror = () => reject(request.error || new Error('No se pudo leer el archivo multimedia.'));
    });
    return {
      bytes: new Uint8Array(await record.blob.arrayBuffer()),
      mimeType: record.mimeType,
    };
  } finally {
    database.close();
  }
}

export async function deleteLocalMedia(id) {
  const database = await openDatabase();

  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(id);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error('No se pudo eliminar el archivo multimedia.'));
      transaction.onabort = () => reject(transaction.error || new Error('Se canceló la eliminación del archivo multimedia.'));
    });
  } finally {
    database.close();
  }
}
