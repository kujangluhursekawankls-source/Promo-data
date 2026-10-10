import React, { useState, useRef } from 'react';
import { BackupData } from '../types';
import {
  X,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileJson,
  Loader2,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface Props {
  isOpen: boolean;
  totalPromotions: number;
  onClose: () => void;
  onExport: () => Promise<boolean>;
  onValidate: (rawJson: string) => { isValid: boolean; error?: string; data?: BackupData };
  onRestore: (data: BackupData, mode: 'merge' | 'replace') => Promise<{ success: boolean; count: number; error?: string }>;
}

export const BackupRestoreModal: React.FC<Props> = ({
  isOpen,
  totalPromotions,
  onClose,
  onExport,
  onValidate,
  onRestore,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'restore'>('export');
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');

  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [validatedData, setValidatedData] = useState<BackupData | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [restoreSuccessMessage, setRestoreSuccessMessage] = useState<string | null>(null);

  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportClick = async () => {
    setIsExporting(true);
    await onExport();
    setIsExporting(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setValidationError(null);
    setValidatedData(null);
    setRestoreSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = onValidate(content);
      if (res.isValid && res.data) {
        setValidatedData(res.data);
      } else {
        setValidationError(res.error || 'Format file backup tidak valid.');
      }
    };
    reader.onerror = () => {
      setValidationError('Gagal membaca isi file dari perangkat.');
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!validatedData) return;

    if (restoreMode === 'replace') {
      setShowReplaceConfirm(true);
      return;
    }

    await performRestore('merge');
  };

  const performRestore = async (mode: 'merge' | 'replace') => {
    if (!validatedData) return;
    setIsRestoring(true);
    setRestoreSuccessMessage(null);
    setValidationError(null);

    const result = await onRestore(validatedData, mode);
    setIsRestoring(false);

    if (result.success) {
      setRestoreSuccessMessage(`Berhasil memulihkan ${result.count} promosi dan seluruh fotonya!`);
      setValidatedData(null);
      setSelectedFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      setValidationError(result.error || 'Gagal memulihkan promosi.');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Backup & Restore</h3>
              <p className="text-xs text-slate-500">Amankan data promosi dan foto Anda</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('export');
                setValidationError(null);
                setRestoreSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'export'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Backup</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('restore');
                setValidationError(null);
                setRestoreSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'restore'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Restore Backup</span>
            </button>
          </div>

          {activeTab === 'export' && (
            <div className="flex flex-col gap-3 py-1">
              <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-start gap-3">
                <FileJson className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <p className="font-bold text-emerald-900 mb-1">Simpan Cadangan Lengkap</p>
                  Semua {totalPromotions} promosi beserta teks dan file foto aslinya akan dikemas ke dalam satu file JSON aman yang dapat dipulihkan kapan saja.
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportClick}
                disabled={isExporting || totalPromotions === 0}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengemas Data & Foto...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Unduh File Backup JSON</span>
                  </>
                )}
              </button>

              {totalPromotions === 0 && (
                <p className="text-[11px] text-slate-400 text-center">
                  Belum ada promosi untuk dibackup. Tambah promosi terlebih dahulu.
                </p>
              )}
            </div>
          )}

          {activeTab === 'restore' && (
            <div className="flex flex-col gap-3 py-1">
              {restoreSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-emerald-800 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{restoreSuccessMessage}</span>
                </div>
              )}

              {validationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 px-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex flex-col items-center justify-center gap-2 transition"
                >
                  <FileJson className="w-8 h-8 text-slate-400" />
                  <span>
                    {selectedFileName ? selectedFileName : 'Pilih File Backup (.json)'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Klik untuk memilih file dari memori HP
                  </span>
                </button>
              </div>

              {validatedData && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>File Valid: FotoPromosi</span>
                    <span className="text-emerald-600 font-bold">
                      {validatedData.totalPromotions} Promosi
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Diekspor pada:{' '}
                    {new Date(validatedData.exportDate).toLocaleString('id-ID')}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-200 flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      Pilihan Pemulihan Data:
                    </span>

                    <label
                      className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition ${
                        restoreMode === 'merge'
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-semibold'
                          : 'border-slate-200 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === 'merge'}
                        onChange={() => setRestoreMode('merge')}
                        className="mt-0.5 text-emerald-600"
                      />
                      <div>
                        <div className="flex items-center gap-1 font-bold">
                          <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Gabungkan Data (Direkomendasikan)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                          Menambahkan data backup ke promosi yang ada tanpa menghapus data di HP saat ini.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition ${
                        restoreMode === 'replace'
                          ? 'border-rose-500 bg-rose-50/50 text-rose-900 font-semibold'
                          : 'border-slate-200 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === 'replace'}
                        onChange={() => setRestoreMode('replace')}
                        className="mt-0.5 text-rose-600"
                      />
                      <div>
                        <div className="flex items-center gap-1 font-bold text-rose-700">
                          <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
                          <span>Ganti Seluruh Data</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                          Hapus seluruh promosi lama dan gantikan sepenuhnya dengan file backup ini.
                        </p>
                      </div>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleExecuteRestore}
                    disabled={isRestoring}
                    className="mt-2 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    {isRestoring ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memulihkan Data...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Mulai Restore Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 py-1"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showReplaceConfirm}
        title="Ganti Seluruh Data Promosi?"
        message={`PERINGATAN: Memilih opsi ini akan MENGHAPUS SEMUA ${totalPromotions} promosi yang tersimpan saat ini di HP dan menggantinya dengan ${validatedData?.totalPromotions || 0} promosi dari file backup.\n\nTindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Ganti Seluruh Data"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={() => {
          setShowReplaceConfirm(false);
          performRestore('replace');
        }}
        onCancel={() => setShowReplaceConfirm(false)}
      />
    </>
  );
};
