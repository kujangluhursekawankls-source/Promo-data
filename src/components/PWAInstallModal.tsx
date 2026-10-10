import React from 'react';
import { X, Smartphone, Download, CheckCircle2, MoreVertical, PlusSquare } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  onInstall: () => Promise<boolean>;
}

export const PWAInstallModal: React.FC<Props> = ({
  isOpen,
  onClose,
  isInstallable,
  onInstall,
}) => {
  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await onInstall();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-100 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                Pasang di HP Android
              </h3>
              <p className="text-xs text-slate-500">Aplikasi Web Progresif (PWA)</p>
            </div>
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

        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-900 flex flex-col gap-1.5 leading-relaxed">
          <p className="font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Keunggulan FotoPromosi PWA:</span>
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-700">
            <li>Dapat dibuka langsung dari layar utama HP tanpa membuka browser.</li>
            <li>Bekerja 100% offline tanpa perlu koneksi internet.</li>
            <li>Ringan, tidak membebani memori HP, dan bebas iklan/login.</li>
          </ul>
        </div>

        {isInstallable && (
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Pasang Sekarang ke Layar Utama</span>
          </button>
        )}

        <div className="flex flex-col gap-2.5 pt-1">
          <span className="text-xs font-bold text-slate-800">
            Cara Pasang Manual di Google Chrome / Browser HP:
          </span>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                <MoreVertical className="w-3.5 h-3.5" />
              </div>
              <p>
                <strong>Langkah 1:</strong> Tekan tombol menu titik tiga (<strong>⋮</strong>) di sudut kanan atas peramban Anda.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                <PlusSquare className="w-3.5 h-3.5" />
              </div>
              <p>
                <strong>Langkah 2:</strong> Pilih <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Instal Aplikasi"</strong>.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1 rounded bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p>
                <strong>Langkah 3:</strong> Konfirmasi instalasi. Ikon FotoPromosi akan langsung muncul di menu aplikasi HP Anda.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
