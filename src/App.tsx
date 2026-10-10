import { useState } from 'react';
import { Promotion, ViewMode } from './types';
import { usePromotions } from './hooks/usePromotions';
import { usePWAInstall, useOnlineStatus } from './hooks/usePWA';
import { Header } from './components/Header';
import { PromotionCard } from './components/PromotionCard';
import { PromotionForm } from './components/PromotionForm';
import { PromotionDetail } from './components/PromotionDetail';
import { ShareModal } from './components/ShareModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ToastContainer } from './components/ToastContainer';
import {
  Plus,
  Camera,
  FolderOpen,
  SearchX,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const {
    promotions,
    filteredPromotions,
    loading,
    searchQuery,
    setSearchQuery,
    toasts,
    showToast,
    dismissToast,
    savePromotion,
    deletePromotion,
    exportBackup,
    validateBackupContent,
    restoreBackup,
  } = usePromotions();

  const { isInstallable, install } = usePWAInstall();
  const isOnline = useOnlineStatus();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingPromotion, setSharingPromotion] = useState<Promotion | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [deletingPromotion, setDeletingPromotion] = useState<Promotion | null>(null);

  const handleAddNew = () => {
    setSelectedPromotion(null);
    setViewMode('add');
  };

  const handleEdit = (promo: Promotion) => {
    setSelectedPromotion(promo);
    setViewMode('edit');
  };

  const handleViewDetail = (promo: Promotion) => {
    setSelectedPromotion(promo);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedPromotion(null);
  };

  const handleSaveForm = async (promo: Promotion): Promise<boolean> => {
    const success = await savePromotion(promo);
    if (success) {
      setSelectedPromotion(promo);
      setViewMode('detail');
    }
    return success;
  };

  const handleTriggerShare = (promo: Promotion) => {
    setSharingPromotion(promo);
    setIsShareModalOpen(true);
  };

  const handleTriggerDelete = (promo: Promotion) => {
    setDeletingPromotion(promo);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPromotion) return;
    const success = await deletePromotion(deletingPromotion.id);
    if (success) {
      setDeletingPromotion(null);
      if (selectedPromotion?.id === deletingPromotion.id) {
        handleBackToList();
      }
    }
  };

  const handleAddSampleData = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 600, 600);
      grad.addColorStop(0, '#059669');
      grad.addColorStop(1, '#0f766e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 600);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FOTO CONTOH PRODUK', 300, 280);
      ctx.font = '22px sans-serif';
      ctx.fillStyle = '#a7f3d0';
      ctx.fillText('Kualitas Tinggi & Siap Promosi', 300, 330);
    }

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const now = Date.now();
      const samplePromo: Promotion = {
        id: 'promo_sample_' + now,
        title: 'TAS RANSEL LAPTOP WATERPROOF URBAN 2026',
        content: `TAS RANSEL LAPTOP WATERPROOF URBAN 2026\nHarga Promo: Rp 149.000 (Normal Rp 250.000)\n\nSpesifikasi Produk:\n- Bahan: Oxford Polyester Anti Air (Waterproof)\n- Muat Laptop hingga 15.6 Inch\n- Dilengkapi Port USB Charger eksternal\n- Bantalan punggung empuk & breathable\n- Tersedia warna: Hitam Elegan, Navy, Abu\n\nGaransi retur 7 hari jika barang rusak!\nSiap kirim ke seluruh Indonesia, bisa COD.\nKlik link di bio atau WhatsApp sekarang untuk klaim diskon!\n#taspria #taslaptop #promoolshop #tasransel`,
        photos: [
          {
            id: 'photo_sample_1',
            blob: blob,
            name: 'tas_ransel_waterproof.jpg',
            mimeType: 'image/jpeg',
            size: blob.size,
            createdAt: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
      };

      await savePromotion(samplePromo);
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none pb-safe">
      <div className="w-full max-w-md mx-auto min-h-screen bg-slate-50 shadow-xl flex flex-col relative border-x border-slate-200/60">
        {viewMode === 'add' || viewMode === 'edit' ? (
          <PromotionForm
            initialPromotion={selectedPromotion}
            onSave={handleSaveForm}
            onCancel={() => {
              if (selectedPromotion) {
                setViewMode('detail');
              } else {
                setViewMode('list');
              }
            }}
          />
        ) : viewMode === 'detail' && selectedPromotion ? (
          <PromotionDetail
            promotion={selectedPromotion}
            onBack={handleBackToList}
            onEdit={handleEdit}
            onDeleteRequest={handleTriggerDelete}
            onShareRequest={handleTriggerShare}
            onToast={showToast}
          />
        ) : (
          <div className="flex flex-col min-h-screen pb-24">
            <Header
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenBackup={() => setIsBackupModalOpen(true)}
              onOpenInstallModal={() => setIsInstallModalOpen(true)}
              isInstallable={isInstallable}
              isOnline={isOnline}
              totalCount={promotions.length}
            />

            <main className="flex-1 p-4 flex flex-col gap-3">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                  <span className="text-xs font-medium">Memuat promosi dari IndexedDB...</span>
                </div>
              ) : promotions.length === 0 ? (
                <div className="py-16 px-4 flex flex-col items-center text-center justify-center my-auto">
                  <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center mb-4 text-emerald-600 shadow-inner">
                    <Camera className="w-10 h-10" />
                  </div>

                  <h3 className="font-bold text-slate-800 text-lg mb-1">
                    Belum ada promosi
                  </h3>
                  <p className="text-slate-500 text-sm max-w-xs mb-6">
                    Tekan Tambah Promosi untuk memulai.
                  </p>

                  <button
                    type="button"
                    onClick={handleAddNew}
                    className="py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-lg shadow-emerald-700/25 flex items-center gap-2 transition cursor-pointer active:scale-98"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Tambah Promosi</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddSampleData}
                    className="mt-6 text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Isi Otomatis Contoh Promosi</span>
                  </button>
                </div>
              ) : filteredPromotions.length === 0 ? (
                <div className="py-16 px-4 flex flex-col items-center text-center justify-center text-slate-400 my-auto">
                  <SearchX className="w-12 h-12 mb-3 opacity-40 text-slate-400" />
                  <p className="font-bold text-slate-700 text-sm">
                    Tidak ada promosi yang cocok
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Coba kata kunci pencarian yang lain
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-3 text-xs text-emerald-600 font-semibold underline"
                  >
                    Hapus Filter Pencarian
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredPromotions.map((item) => (
                    <PromotionCard
                      key={item.id}
                      promotion={item}
                      onSelect={handleViewDetail}
                      onShare={handleTriggerShare}
                      onCopySuccess={() =>
                        showToast('Teks promosi berhasil disalin ke clipboard!', 'success')
                      }
                    />
                  ))}
                </div>
              )}
            </main>

            <div className="fixed bottom-5 max-w-md mx-auto inset-x-0 px-4 flex items-center justify-between pointer-events-none z-20">
              <button
                type="button"
                onClick={() => setIsBackupModalOpen(true)}
                className="pointer-events-auto p-3 bg-white/95 text-slate-700 rounded-2xl shadow-lg border border-slate-200/80 hover:bg-slate-100 active:scale-95 transition flex items-center gap-2 backdrop-blur-xs text-xs font-bold"
                title="Buka Menu Backup & Restore"
              >
                <FolderOpen className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Backup & Restore</span>
              </button>

              <button
                type="button"
                onClick={handleAddNew}
                className="pointer-events-auto py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl shadow-xl shadow-emerald-700/30 flex items-center gap-2 text-sm font-bold active:scale-95 transition ml-auto"
                aria-label="Tambah Promosi"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>Tambah Promosi</span>
              </button>
            </div>
          </div>
        )}

        {sharingPromotion && (
          <ShareModal
            isOpen={isShareModalOpen}
            promotion={sharingPromotion}
            onClose={() => {
              setIsShareModalOpen(false);
              setSharingPromotion(null);
            }}
            onToast={showToast}
          />
        )}

        <BackupRestoreModal
          isOpen={isBackupModalOpen}
          totalPromotions={promotions.length}
          onClose={() => setIsBackupModalOpen(false)}
          onExport={exportBackup}
          onValidate={validateBackupContent}
          onRestore={restoreBackup}
        />

        <PWAInstallModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
          isInstallable={isInstallable}
          onInstall={install}
        />

        <ConfirmModal
          isOpen={Boolean(deletingPromotion)}
          title="Hapus Promosi Ini?"
          message={`Apakah Anda yakin ingin menghapus "${deletingPromotion?.title}"?\nSemua teks dan foto yang tersimpan akan dihapus permanen dari memori HP.`}
          confirmLabel="Hapus Permanen"
          cancelLabel="Batal"
          isDestructive={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingPromotion(null)}
        />

        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    </div>
  );
}
