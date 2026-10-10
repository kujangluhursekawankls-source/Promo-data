import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../hooks/usePromotions';

interface Props {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<Props> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((toast) => {
        let bg = 'bg-slate-900 text-white';
        let Icon = Info;

        if (toast.type === 'success') {
          bg = 'bg-emerald-700 text-white shadow-emerald-900/20';
          Icon = CheckCircle2;
        } else if (toast.type === 'error') {
          bg = 'bg-rose-700 text-white shadow-rose-900/20';
          Icon = AlertCircle;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all transform animate-in fade-in slide-in-from-bottom-2 duration-200 w-full ${bg}`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Icon className="w-5 h-5 shrink-0" />
              <span className="leading-snug break-words">{toast.message}</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-full hover:bg-white/20 transition shrink-0 ml-1"
              aria-label="Tutup"
            >
              <X className="w-4 h-4 opacity-80" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
