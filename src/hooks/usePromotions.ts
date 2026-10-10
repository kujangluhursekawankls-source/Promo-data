import { useState, useEffect, useMemo, useCallback } from 'react';
import { Promotion, BackupData } from '../types';
import { db } from '../db/indexedDB';
import {
  serializePromotionsForBackup,
  deserializePromotionsFromBackup,
  triggerFileDownload,
} from '../utils/fileUtils';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export function usePromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.getAllPromotions();
      setPromotions(data);
    } catch (err) {
      console.error('Error saat membaca IndexedDB:', err);
      showToast('Gagal memuat data promosi dari penyimpanan HP.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshPromotions();
  }, [refreshPromotions]);

  const filteredPromotions = useMemo(() => {
    if (!searchQuery.trim()) return promotions;
    const q = searchQuery.toLowerCase().trim();
    return promotions.filter((p) => {
      return (
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
      );
    });
  }, [promotions, searchQuery]);

  const handleSavePromotion = useCallback(
    async (promo: Promotion): Promise<boolean> => {
      try {
        await db.savePromotion(promo);
        await refreshPromotions();
        showToast('Promosi berhasil disimpan!', 'success');
        return true;
      } catch (err) {
        console.error('Gagal menyimpan promosi:', err);
        showToast(
          err instanceof Error
            ? `Penyimpanan gagal: ${err.message}`
            : 'Penyimpanan gagal. Memori HP mungkin hampir penuh.',
          'error'
        );
        return false;
      }
    },
    [refreshPromotions, showToast]
  );

  const handleDeletePromotion = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await db.deletePromotion(id);
        await refreshPromotions();
        showToast('Promosi berhasil dihapus.', 'info');
        return true;
      } catch (err) {
        console.error('Gagal menghapus promosi:', err);
        showToast('Gagal menghapus promosi dari database.', 'error');
        return false;
      }
    },
    [refreshPromotions, showToast]
  );

  const handleExportBackup = useCallback(async (): Promise<boolean> => {
    try {
      if (promotions.length === 0) {
        showToast('Tidak ada data promosi untuk diekspor.', 'info');
        return false;
      }

      showToast('Sedang menyiapkan file backup...', 'info');
      const serialized = await serializePromotionsForBackup(promotions);

      const backupObj: BackupData = {
        app: 'FotoPromosi',
        version: 1,
        exportDate: new Date().toISOString(),
        totalPromotions: serialized.length,
        promotions: serialized,
      };

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
      const filename = `FotoPromosi_Backup_${dateStr}_${timeStr}.json`;

      const jsonString = JSON.stringify(backupObj, null, 2);
      triggerFileDownload(jsonString, filename, 'application/json');

      showToast(`Backup berhasil diekspor! (${promotions.length} promosi)`, 'success');
      return true;
    } catch (err) {
      console.error('Gagal ekspor backup:', err);
      showToast('Gagal membuat file backup.', 'error');
      return false;
    }
  }, [promotions, showToast]);

  const validateBackupContent = useCallback((rawJson: string): { isValid: boolean; error?: string; data?: BackupData } => {
    try {
      const parsed = JSON.parse(rawJson);
      if (!parsed || typeof parsed !== 'object') {
        return { isValid: false, error: 'File bukan format JSON yang valid.' };
      }

      if (parsed.app !== 'FotoPromosi' && !Array.isArray(parsed.promotions)) {
        return {
          isValid: false,
          error: 'Format file tidak sesuai. File ini bukan backup resmi FotoPromosi.',
        };
      }

      const promos = parsed.promotions;
      if (!Array.isArray(promos)) {
        return { isValid: false, error: 'Data promosi tidak ditemukan dalam file backup.' };
      }

      for (let i = 0; i < promos.length; i++) {
        const item = promos[i];
        if (!item || typeof item !== 'object') {
          return { isValid: false, error: `Data promosi ke-${i + 1} tidak valid.` };
        }
        if (typeof item.content !== 'string') {
          return { isValid: false, error: `Teks pada promosi ke-${i + 1} rusak atau tidak ada.` };
        }
      }

      return {
        isValid: true,
        data: {
          app: 'FotoPromosi',
          version: parsed.version || 1,
          exportDate: parsed.exportDate || new Date().toISOString(),
          totalPromotions: promos.length,
          promotions: promos,
        },
      };
    } catch (e) {
      return { isValid: false, error: 'File backup rusak atau tidak dapat dibaca.' };
    }
  }, []);

  const handleRestoreBackup = useCallback(
    async (backupData: BackupData, mode: 'merge' | 'replace'): Promise<{ success: boolean; count: number; error?: string }> => {
      try {
        const restoredPromotions = deserializePromotionsFromBackup(backupData.promotions);
        
        if (restoredPromotions.length === 0) {
          return { success: false, count: 0, error: 'Tidak ada data promosi yang dapat dipulihkan.' };
        }

        if (mode === 'replace') {
          await db.clearAllPromotions();
          await db.bulkSavePromotions(restoredPromotions);
        } else {
          const existingIds = new Set(promotions.map((p) => p.id));
          const adjustedPromotions = restoredPromotions.map((p) => {
            if (existingIds.has(p.id)) {
              return {
                ...p,
                id: 'promo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
              };
            }
            return p;
          });

          await db.bulkSavePromotions(adjustedPromotions);
        }

        await refreshPromotions();
        showToast(
          `Berhasil memulihkan ${restoredPromotions.length} promosi!`,
          'success'
        );
        return { success: true, count: restoredPromotions.length };
      } catch (err) {
        console.error('Gagal restore backup:', err);
        const errMsg = err instanceof Error ? err.message : 'Terjadi kegagalan saat memulihkan data.';
        showToast(`Restore gagal: ${errMsg}`, 'error');
        return { success: false, count: 0, error: errMsg };
      }
    },
    [promotions, refreshPromotions, showToast]
  );

  return {
    promotions,
    filteredPromotions,
    loading,
    searchQuery,
    setSearchQuery,
    toasts,
    showToast,
    dismissToast,
    refreshPromotions,
    savePromotion: handleSavePromotion,
    deletePromotion: handleDeletePromotion,
    exportBackup: handleExportBackup,
    validateBackupContent,
    restoreBackup: handleRestoreBackup,
  };
}
