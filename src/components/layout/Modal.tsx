import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  hasUnsavedChanges?: boolean;
  confirmCloseMessage?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '2xl',
  hasUnsavedChanges = false,
  confirmCloseMessage = 'Você possui alterações não salvas. Deseja realmente descartar os dados e fechar a janela?',
}) => {
  // Regra 1: Não fechar com tecla ESC (prevenção contra fechamento acidental de dados preenchidos)
  // Regra 1: Não fechar ao clicar fora (backdrop estático, sem onClick)

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  }[maxWidth];

  const handleExplicitClose = () => {
    // Regra 1: Confirmar antes de descartar alterações não salvas
    if (hasUnsavedChanges) {
      const confirmDiscard = window.confirm(confirmCloseMessage);
      if (!confirmDiscard) return;
    }
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop estático: NÃO fecha ao clicar fora */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
        aria-hidden="true"
      />

      {/* Dialog container centralizado na tela */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div
          className={`w-full ${maxWidthClass} transform overflow-hidden rounded-xl bg-white text-left align-middle shadow-2xl transition-all border border-slate-200 animate-fade-in`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/70">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 leading-tight">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            {/* Fechamento explícito pelo botão X com confirmação se houver dados não salvos */}
            <button
              type="button"
              onClick={handleExplicitClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Fechar"
              title="Fechar janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
};
