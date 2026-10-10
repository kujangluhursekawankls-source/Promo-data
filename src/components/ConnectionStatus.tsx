import React, { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, CloudAlert, RefreshCw, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { buildApiUrl } from '../utils/apiConfig';

export type StatusType = 'connected' | 'offline' | 'error' | 'checking';

export const ConnectionStatus: React.FC = () => {
  const [status, setStatus] = useState<StatusType>('checking');
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [lastChecked, setLastChecked] = useState<string>('');

  const checkConnection = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setStatus('offline');
      setHasApiKey(null);
      setLastChecked(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      return;
    }

    setStatus('checking');
    try {
      const healthUrl = buildApiUrl('/api/health');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json().catch(() => null);
        setStatus('connected');
        setHasApiKey(data?.hasApiKey ?? true);
      } else {
        setStatus('error');
      }
    } catch (err) {
      // Jika fetch gagal (koneksi terputus atau server down)
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setStatus('offline');
      } else {
        setStatus('error');
      }
    } finally {
      setLastChecked(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    }
  }, []);

  useEffect(() => {
    checkConnection();

    const handleOnline = () => checkConnection();
    const handleOffline = () => setStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periksa ulang setiap 45 detik
    const interval = setInterval(checkConnection, 45000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkConnection]);

  return (
    <div className="relative inline-block">
      {/* Tombol Ikon Status di Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer ${
          status === 'connected'
            ? 'bg-emerald-800 text-emerald-100 hover:bg-emerald-900 border border-emerald-600/60'
            : status === 'offline'
            ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-400/40'
            : status === 'error'
            ? 'bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 border border-rose-400/40'
            : 'bg-emerald-800/60 text-emerald-200'
        }`}
        title="Status Koneksi API & Offline"
        aria-label="Status Koneksi"
      >
        {status === 'connected' ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300"></span>
            </span>
            <Wifi className="w-3.5 h-3.5" />
          </>
        ) : status === 'offline' ? (
          <>
            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
            <WifiOff className="w-3.5 h-3.5 text-amber-300" />
          </>
        ) : status === 'error' ? (
          <>
            <span className="h-2 w-2 rounded-full bg-rose-400"></span>
            <CloudAlert className="w-3.5 h-3.5 text-rose-300" />
          </>
        ) : (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-300" />
        )}
      </button>

      {/* Popover / Dialog Kecil Info Koneksi */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 text-slate-800 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <span>Status Koneksi</span>
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {status === 'connected' ? (
              <div className="flex flex-col gap-2">
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Terhubung ke Server API</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Server aktif & siap membuat kata promosi dengan AI Gemini.
                    </p>
                  </div>
                </div>
                {hasApiKey === false && (
                  <p className="text-[11px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    ⚠️ API Key Gemini belum terkonfigurasi di server.
                  </p>
                )}
              </div>
            ) : status === 'offline' ? (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800">
                <WifiOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Mode Offline (Lokal)</p>
                  <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                    HP tidak terhubung ke internet. Anda tetap bisa menyimpan foto, mengetik, dan mengedit promosi di memori HP.
                  </p>
                </div>
              </div>
            ) : status === 'error' ? (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800">
                <CloudAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Server API Tidak Terjangkau</p>
                  <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                    Gagal terhubung ke endpoint backend. Fitur lokal tetap aktif normal.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-slate-600">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Memeriksa koneksi server...</span>
              </div>
            )}

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Cek: {lastChecked || '-'}</span>
              <button
                type="button"
                onClick={checkConnection}
                disabled={status === 'checking'}
                className="font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 p-1 rounded-md hover:bg-emerald-50 transition"
              >
                <RefreshCw className={`w-3 h-3 ${status === 'checking' ? 'animate-spin' : ''}`} />
                <span>Tes Ulang</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
