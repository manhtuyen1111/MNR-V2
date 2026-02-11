
import { RepairRecord } from './types';

// --- IMAGE COMPRESSION ---
// Adjusted defaults: 900x600 max resolution, quality 0.5
// This drastically reduces file size (~40-60KB) for fast 3G/4G uploads.
export const compressImage = (base64Str: string, maxWidth = 1200, maxHeight = 900, quality = 0.65): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate scale ratio to fit within maxWidth x maxHeight
      // We take the smaller ratio to ensure the image fits entirely within the box
      const scale = Math.min(maxWidth / width, maxHeight / height);

      // Only scale down, never scale up
      if (scale < 1) {
          width = width * scale;
          height = height * scale;
      }

      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Using JPEG format with optimized quality (0.5) for fastest transmission
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(base64Str); // Fallback if canvas fails
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// --- INDEXED DB STORAGE ---
const DB_NAME = 'ContainerQC_DB';
const DB_VERSION = 1;
const STORE_NAME = 'repair_records';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const dbService = {
  getAllRecords: async (): Promise<RepairRecord[]> => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('DB Error:', error);
      return [];
    }
  },

  saveRecord: async (record: RepairRecord): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  deleteRecord: async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};
