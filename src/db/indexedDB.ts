import { Promotion } from '../types';

const DB_NAME = 'fotopromosi_db';
const DB_VERSION = 1;
const STORE_NAME = 'promotions';

class IndexedDBStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    if (typeof window === 'undefined' || !window.indexedDB) {
      throw new Error('Penyimpanan IndexedDB tidak didukung oleh perangkat atau peramban ini.');
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          this.dbPromise = null;
        };
        resolve(db);
      };

      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error || new Error('Gagal membuka database lokal FotoPromosi.'));
      };

      request.onblocked = () => {
        console.warn('Database diblokir karena versi terbuka di tab lain.');
      };
    });

    return this.dbPromise;
  }

  async getAllPromotions(): Promise<Promotion[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result as Promotion[]) || [];
        results.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(results);
      };

      request.onerror = () => {
        reject(request.error || new Error('Gagal memuat daftar promosi dari penyimpanan lokal.'));
      };
    });
  }

  async getPromotion(id: string): Promise<Promotion | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve((request.result as Promotion) || null);
      };

      request.onerror = () => {
        reject(request.error || new Error(`Gagal memuat promosi dengan ID ${id}.`));
      };
    });
  }

  async savePromotion(promo: Promotion): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(promo);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error || new Error('Gagal menyimpan data promosi ke IndexedDB.'));
        };

        transaction.onabort = () => {
          reject(transaction.error || new Error('Transaksi penyimpanan dibatalkan.'));
        };
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Terjadi kesalahan saat menyimpan data.'));
      }
    });
  }

  async deletePromotion(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error || new Error('Gagal menghapus data promosi.'));
      };
    });
  }

  async clearAllPromotions(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error || new Error('Gagal membersihkan database promosi.'));
      };
    });
  }

  async bulkSavePromotions(promos: Promotion[]): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      if (promos.length === 0) {
        resolve();
        return;
      }

      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error || new Error('Gagal menyimpan kumpulan promosi sekaligus.'));
      };

      for (const item of promos) {
        store.put(item);
      }
    });
  }
}

export const db = new IndexedDBStorage();
