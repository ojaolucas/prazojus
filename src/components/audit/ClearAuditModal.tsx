import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { AuditService } from '../../services/auditService';
import { useToast } from '../../context/ToastContext';
import {
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  AlertCircle,
  Loader2,
  X,
  UserCheck,
} from 'lucide-react';

interface ClearAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  totalLogs: number;
}

export const ClearAuditModal: React.FC<ClearAuditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  totalLogs,
}) => {
  const { currentUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPassword(false);
      setErrorMessage(null);
      setIsSubmitting(false);
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Por favor, informe sua senha de acesso.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await AuditService.clearAllLogs(currentUser, password);

      if (result.success) {
        success(
          'Base de Auditoria Limpa',
          'Todos os registros anteriores foram expurgados e o log inaugural de controle foi registrado.'
        );
        onSuccess();
        onClose();
      } else {
        setErrorMessage(result.error || 'Senha incorreta. A limpeza não foi autorizada.');
      }
    } catch {
      setErrorMessage('Ocorreu uma falha ao comunicar com o servidor. Tente novamente.');
      toastError('Erro na Operação', 'Não foi possível processar a limpeza da base de auditoria.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clear-audit-title"
    >
      {/* Backdrop estático */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centralizador no Viewport */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all border border-slate-200 animate-scale-up font-sans my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabeçalho Oficial POLCAL */}
          <div className="bg-[#122443] px-6 py-5 text-white flex items-center justify-between border-b border-[#274578]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-300 flex items-center justify-center shrink-0 shadow-inner">
                <ShieldAlert className="w-5 h-5 text-rose-300" />
              </div>
              <div>
                <h3 id="clear-audit-title" className="text-base font-bold text-white tracking-wide">
                  Limpeza de Registros de Auditoria
                </h3>
                <p className="text-xs text-[#C9D7EE]/80">
                  Polícia Científica de Alagoas — PrazoJus
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Fechar janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Formulário com Autenticação de Senha */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Alerta de Irreversibilidade */}
            <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-3.5 flex items-start gap-3 text-rose-900 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-rose-950">Atenção: Ação Irreversível</p>
                <p className="text-rose-800 leading-relaxed text-[11.5px]">
                  Esta operação excluirá permanentemente todos os <strong>{totalLogs} registros</strong> de histórico e rastreabilidade da base de dados.
                  Por segurança da custódia, informe sua <strong>senha de acesso pessoal</strong> para autorizar a limpeza.
                </p>
              </div>
            </div>

            {/* Dados do Administrador Logado */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Administrador:</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                  {currentUser.nome}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">CPF:</span>
                <span className="font-mono font-medium text-slate-700">
                  {currentUser.cpf || '000.000.000-00'}
                </span>
              </div>
            </div>

            {/* Mensagem de Erro de Validação */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Campo de Senha do Administrador */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Senha de Acesso do Administrador *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Digite sua senha para autorizar"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all placeholder:text-slate-400 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !password.trim()}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Validando e Limpando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirmar e Limpar Registros</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

