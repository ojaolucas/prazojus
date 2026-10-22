import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, HelpCircle, Loader2, X } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isProcessing?: boolean;
  iconType?: 'trash' | 'warning' | 'question';
  zIndex?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isDestructive = false,
  isProcessing = false,
  iconType,
  zIndex = 'z-[60]',
}) => {
  if (!isOpen) return null;

  const effectiveIcon = iconType || (isDestructive ? 'trash' : 'question');

  return createPortal(
    <div className={`fixed inset-0 ${zIndex} overflow-y-auto`}>
      {/* Backdrop estático: não fecha acidentalmente ao clicar fora */}
      <div
        className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs transition-opacity animate-fade-in"
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div
          className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all border border-slate-200 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/70">
            <h3 className="text-base font-semibold text-slate-800 leading-tight">{title}</h3>
            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 flex flex-col items-center text-center">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-3.5 shadow-2xs ${
                effectiveIcon === 'trash'
                  ? 'bg-rose-100 text-rose-600'
                  : effectiveIcon === 'warning'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-blue-100 text-blue-600'
              }`}
            >
              {effectiveIcon === 'trash' ? (
                <Trash2 className="w-6 h-6" />
              ) : effectiveIcon === 'warning' ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <HelpCircle className="w-6 h-6" />
              )}
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
          </div>

          {/* Footer de Ações */}
          <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-slate-400 disabled:opacity-50 shadow-2xs"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => {
                if (isProcessing) return;
                onConfirm();
              }}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-offset-1 disabled:opacity-70 ${
                isDestructive
                  ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
                  : 'bg-blue-700 hover:bg-blue-800 focus:ring-blue-600'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <span>{confirmLabel}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
