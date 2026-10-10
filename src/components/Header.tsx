import React from 'react';
import { Camera, Search, X, DatabaseBackup, Download, WifiOff } from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenBackup: () => void;
  onOpenInstallModal: () => void;
  isInstallable: boolean;
  isOnline: boolean;
  totalCount: number;
}

export const Header: React.FC<Props> = ({
  searchQuery,
  onSearchChange,
  onOpenBackup,
  onOpenInstallModal,
  isInstallable,
  isOnline,
  totalCount,
}) => {
  const [showSearch, setShowSearch] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 bg-emerald-700 text-white shadow-md">
      {!isOnline && (
        <div className="bg-amber-600 px-4 py-1 text-xs font-medium text-white flex items-center justify-center gap-1.5 shadow-inner">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Mode Offline — Aplikasi dan data tetap aktif normal</span>
        </div>
      )}

      <div className="max-w-md mx-auto px-4 py-3">
        {!showSearch ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center shadow-inner border border-emerald-600">
                <Camera className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight leading-tight flex items-center gap-1.5">
                  FotoPromosi
                </h1>
                <p className="text-xs text-emerald-100 font-medium leading-none">
                  {totalCount > 0 ? `${totalCount} Promosi Tersimpan` : 'Katalog Offline Android'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <ConnectionStatus />

              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-emerald-800/80 active:bg-emerald-900 transition"
                aria-label="Cari Promosi"
                title="Cari Promosi"
              >
                <Search className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={onOpenBackup}
                className="p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-emerald-800/80 active:bg-emerald-900 transition flex items-center gap-1 text-xs font-semibold"
                aria-label="Backup & Restore"
                title="Backup dan Restore"
              >
                <DatabaseBackup className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={onOpenInstallModal}
                className={`px-2.5 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition ${
                  isInstallable
                    ? 'bg-amber-400 text-slate-900 shadow hover:bg-amber-300'
                    : 'bg-emerald-800/80 text-emerald-100 hover:text-white hover:bg-emerald-800'
                }`}
                title="Pasang Aplikasi di HP"
              >
                <Download className="w-4 h-4" />
                <span>Instal</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-emerald-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari produk, harga, teks promosi..."
                autoFocus
                className="w-full bg-emerald-800/90 text-white placeholder-emerald-200 text-sm pl-9 pr-8 py-2 rounded-xl border border-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-300 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-emerald-300 hover:text-white"
                  aria-label="Hapus pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setShowSearch(false);
                onSearchChange('');
              }}
              className="px-2.5 py-2 text-xs font-semibold text-emerald-100 hover:text-white"
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
