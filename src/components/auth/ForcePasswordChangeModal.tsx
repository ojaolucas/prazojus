import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  KeyRound,
  ShieldAlert,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  LogOut,
  AlertCircle,
  Lock,
} from 'lucide-react';

export const ForcePasswordChangeModal: React.FC = () => {
  const { currentUser, changePassword, logout } = useAuth();

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Regras de validação
  const hasMinLength = novaSenha.length >= 6;
  const passwordsMatch = novaSenha.length > 0 && novaSenha === confirmarNovaSenha;
  const isFormValid = hasMinLength && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const result = await changePassword(novaSenha, confirmarNovaSenha);
      if (!result.success) {
        setErrorMsg(result.error || 'Não foi possível atualizar a senha. Tente novamente.');
        setIsSubmitting(false);
      }
      // Se sucesso, o estado currentUser.precisaTrocarSenha torna-se false no contexto e o modal desmonta
    } catch {
      setErrorMsg('Erro inesperado de comunicação com o servidor.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="force-password-change-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col font-sans border-0">
        {/* Cabeçalho Oficial POLCAL */}
        <div className="bg-[#122443] px-6 py-5 text-white flex items-center justify-between border-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#274578] text-[#C5B641] flex items-center justify-center shrink-0 shadow-inner">
              <KeyRound className="w-5 h-5 text-[#C5B641]" />
            </div>
            <div>
              <h3
                id="force-password-change-title"
                className="text-base font-bold text-white tracking-wide"
              >
                Definição Obrigatória de Senha
              </h3>
              <p className="text-xs text-slate-300">
                Polícia Científica de Alagoas — PrazoJus
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo do Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Alerta de Segurança Forense */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-3.5 flex items-start gap-3 text-amber-900 text-xs shadow-2xs">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-950">
                Primeiro Acesso ou Redefinição Provisória
              </p>
              <p className="text-amber-800 leading-relaxed text-[11.5px]">
                Identificamos que você está utilizando uma <strong>senha provisória</strong>.
                Por exigência da política de segurança da POLCAL, você deve cadastrar uma nova
                senha pessoal e intransferível para desbloquear seu acesso aos autos processuais.
              </p>
            </div>
          </div>

          {/* Dados do Usuário */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Nome Completo:</span>
              <span className="font-bold text-slate-900">{currentUser.nome}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CPF / Perfil:</span>
              <span className="font-medium text-slate-800 font-mono">
                {currentUser.cpf || '—'} ({currentUser.role})
              </span>
            </div>
          </div>

          {/* Mensagem de Erro */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Campo 1: Nova Senha */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              Nova Senha Pessoal <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNovaSenha ? 'text' : 'password'}
                value={novaSenha}
                onChange={(e) => {
                  setNovaSenha(e.target.value);
                  setErrorMsg(null);
                }}
                disabled={isSubmitting}
                placeholder="Digite sua nova senha"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#274578] focus:border-[#274578] text-sm text-slate-800 font-sans"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowNovaSenha(!showNovaSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Campo 2: Confirmar Nova Senha */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              Confirmar Nova Senha <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmarSenha ? 'text' : 'password'}
                value={confirmarNovaSenha}
                onChange={(e) => {
                  setConfirmarNovaSenha(e.target.value);
                  setErrorMsg(null);
                }}
                disabled={isSubmitting}
                placeholder="Repita a nova senha exatamente igual"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#274578] focus:border-[#274578] text-sm text-slate-800 font-sans"
              />
              <button
                type="button"
                onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showConfirmarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Checklist de Requisitos de Segurança */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              {hasMinLength ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-slate-300 shrink-0" />
              )}
              <span className={hasMinLength ? 'text-emerald-800 font-medium' : 'text-slate-500'}>
                Mínimo de 6 caracteres
              </span>
            </div>

            <div className="flex items-center gap-2">
              {passwordsMatch ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-slate-300 shrink-0" />
              )}
              <span className={passwordsMatch ? 'text-emerald-800 font-medium' : 'text-slate-500'}>
                Confirmação idêntica à nova senha
              </span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={logout}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span>Sair do Sistema</span>
            </button>

            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-sm transition-all ${
                isFormValid && !isSubmitting
                  ? 'bg-[#122443] hover:bg-[#274578] shadow-md cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed opacity-70'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cadastrando Senha...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Salvar Nova Senha e Desbloquear</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

