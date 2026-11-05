import React, { useState, useEffect } from 'react';
import { User } from '../../types/user';
import { Modal } from '../layout/Modal';
import { KeyRound, Eye, EyeOff, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: (userId: string, novaSenhaProvisoria: string) => Promise<boolean>;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  user,
  onConfirm,
}) => {
  const [senhaProvisoria, setSenhaProvisoria] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSenhaProvisoria('');
      setConfirmarSenha('');
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen, user]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!senhaProvisoria || senhaProvisoria.trim().length < 6) {
      setErrorMsg('A senha provisória deve conter no mínimo 6 caracteres.');
      return;
    }

    if (senhaProvisoria !== confirmarSenha) {
      setErrorMsg('A confirmação não confere com a senha provisória informada.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await onConfirm(user.id, senhaProvisoria.trim());
      if (ok) {
        onClose();
      } else {
        setErrorMsg('Erro ao redefinir a senha no servidor.');
      }
    } catch {
      setErrorMsg('Erro de comunicação ao redefinir a senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Redefinir Senha Provisória"
      subtitle={`Usuário: ${user.nome} (${user.matricula || 'POLCAL'})`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Informativo */}
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3.5 flex items-start gap-3 text-amber-900 text-xs shadow-2xs font-sans">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-950">
              Exigência de Alteração no Próximo Acesso
            </p>
            <p className="text-amber-800 leading-relaxed text-[11.5px]">
              Ao definir uma nova senha provisória, o usuário será <strong>obrigatoriamente direcionado</strong> a cadastrar uma nova senha definitiva e pessoal assim que realizar o login.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Campo: Nova Senha Provisória */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
            Nova Senha Provisória <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showSenha ? 'text' : 'password'}
              value={senhaProvisoria}
              onChange={(e) => {
                setSenhaProvisoria(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="Digite a senha provisória (mín. 6 caracteres)"
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 pr-10 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#274578] focus:border-[#274578] text-slate-800"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowSenha(!showSenha)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Campo: Confirmar Senha Provisória */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
            Confirmar Senha Provisória <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmarSenha ? 'text' : 'password'}
              value={confirmarSenha}
              onChange={(e) => {
                setConfirmarSenha(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="Repita a senha provisória"
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 pr-10 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#274578] focus:border-[#274578] text-slate-800"
            />
            <button
              type="button"
              onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showConfirmarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Botões */}
        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold text-white bg-[#122443] hover:bg-[#274578] rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5 text-[#C5B641]" />
                <span>Salvar e Exigir Troca</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
