import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      setToasts((prev) => {
        // Evitar mensagens duplicadas: não exibir notificações idênticas simultâneas
        const isDuplicate = prev.some(
          (t) => t.type === type && t.title === title && t.message === message
        );
        if (isDuplicate) return prev;

        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const newToast: Toast = { id, type, title, message };

        setTimeout(() => {
          removeToast(id);
        }, 4500);

        return [...prev, newToast];
      });
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, message?: string) => showToast('success', title, message),
    [showToast]
  );
  const warning = useCallback(
    (title: string, message?: string) => showToast('warning', title, message),
    [showToast]
  );
  const error = useCallback(
    (title: string, message?: string) => showToast('error', title, message),
    [showToast]
  );
  const info = useCallback(
    (title: string, message?: string) => showToast('info', title, message),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, warning, error, info }}>
      {children}
      {/* Toast container renderizado no topo absoluto (z-[9999]) via Portal para ficar à frente de quaisquer modais e formulários */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
            {toasts.map((toast) => {
              let bgClass = 'bg-slate-900 text-white border-slate-700 shadow-2xl';
              let icon = <Info className="w-5 h-5 text-blue-400 shrink-0" />;

              if (toast.type === 'success') {
                bgClass = 'bg-emerald-900/95 text-white border-emerald-700 shadow-2xl';
                icon = <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />;
              } else if (toast.type === 'warning') {
                bgClass = 'bg-amber-950/95 text-amber-50 border-amber-800 shadow-2xl';
                icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
              } else if (toast.type === 'error') {
                bgClass = 'bg-rose-950/95 text-rose-50 border-rose-800 shadow-2xl';
                icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
              }

              return (
                <div
                  key={toast.id}
                  className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-md animate-fade-in transition-all ${bgClass}`}
                >
                  {icon}
                  <div className="flex-1 text-sm">
                    <p className="font-semibold leading-tight">{toast.title}</p>
                    {toast.message && (
                      <p className="text-xs opacity-90 mt-1 leading-relaxed">{toast.message}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="opacity-70 hover:opacity-100 p-0.5 text-white"
                    aria-label="Fechar alerta"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider');
  }
  return context;
}
