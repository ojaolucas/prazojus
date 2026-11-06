import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  hasUnsavedChanges?: boolean;
  confirmCloseMessage?: string;
  zIndex?: string;
  headerVariant?: 'default' | 'polcal';
  headerIcon?: React.ReactNode;
  headerExtra?: React.ReactNode;
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
  zIndex = 'z-50',
  headerVariant = 'default',
  headerIcon,
  headerExtra,
}) => {
  // Regra 1: Não fechar com tecla ESC (prevenção contra fechamento acidental de dados preenchidos)
  // Regra 1: Não fechar ao clicar fora (backdrop estático, sem onClick)

  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = useState(false);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm sm:w-[24rem]',
    md: 'max-w-md sm:w-[28rem]',
    lg: 'max-w-lg sm:w-[32rem]',
    xl: 'max-w-xl sm:w-[36rem]',
    '2xl': 'max-w-2xl sm:w-[42rem]',
    '3xl': 'max-w-3xl sm:w-[48rem]',
    '4xl': 'max-w-4xl sm:w-[56rem]',
    '5xl': 'max-w-5xl sm:w-[64rem]',
  }[maxWidth];

  const handleExplicitClose = () => {
    // Regra 1: Confirmar antes de descartar alterações não salvas via ConfirmDialog do sistema
    if (hasUnsavedChanges) {
      setIsConfirmDiscardOpen(true);
      return;
    }
    onClose();
  };

  return createPortal(
    <>
      <div className={`fixed inset-0 ${zIndex} overflow-y-auto font-sans`}>
        {/* Backdrop estático: NÃO fecha ao clicar fora */}
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
          aria-hidden="true"
        />

        {/* Dialog container centralizado na tela */}
        <div className="flex min-h-full w-full items-center justify-center p-3 sm:p-4 text-center">
          <div
            className={`w-full ${maxWidthClass} transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all border border-slate-200 animate-scale-up font-sans my-4`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {headerVariant === 'polcal' ? (
              <div className="bg-[#122443] px-6 py-5 text-white flex items-center justify-between border-b border-[#274578]">
                <div className="flex items-center gap-3 min-w-0">
                  {headerIcon && (
                    <div className="w-11 h-11 rounded-xl bg-[#274578] text-[#C5B641] flex items-center justify-center shrink-0 shadow-inner">
                      {headerIcon}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white tracking-wide truncate">
                      {title}
                    </h3>
                    {subtitle && (
                      <p className="text-xs text-[#C9D7EE]/80 truncate mt-0.5">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {headerExtra}
                  <button
                    type="button"
                    onClick={handleExplicitClose}
                    className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="Fechar"
                    title="Fechar janela"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/70">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-slate-800 leading-tight truncate">{title}</h3>
                  {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {headerExtra}
                  <button
                    type="button"
                    onClick={handleExplicitClose}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    aria-label="Fechar"
                    title="Fechar janela"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-5 max-h-[82vh] overflow-y-auto">{children}</div>
          </div>
        </div>
      </div>

      {/* Confirmação interna do próprio sistema para descartar alterações ao fechar no X */}
      {isConfirmDiscardOpen && (
        <ConfirmDialog
          isOpen={isConfirmDiscardOpen}
          onClose={() => setIsConfirmDiscardOpen(false)}
          onConfirm={() => {
            setIsConfirmDiscardOpen(false);
            onClose();
          }}
          title="Descartar Alterações?"
          message={confirmCloseMessage}
          confirmLabel="Descartar e Fechar"
          cancelLabel="Continuar Editando"
          isDestructive
          iconType="warning"
          zIndex="z-[70]"
        />
      )}
    </>,
    document.body
  );
};
