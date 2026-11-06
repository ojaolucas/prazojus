import React from 'react';
import { createPortal } from 'react-dom';
import { User, UserRole } from '../../types/user';
import {
  X,
  User as UserIcon,
  Shield,
  Mail,
  CreditCard,
  Building2,
  Briefcase,
  CheckCircle2,
  XCircle,
  KeyRound,
  Clock,
  Layers,
  Edit3,
} from 'lucide-react';

interface UserDetailModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (user: User) => void;
  canEdit?: boolean;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  isOpen,
  onClose,
  onEdit,
  canEdit = true,
}) => {
  if (!isOpen || !user) return null;

  const roleBadgeStyles: Record<UserRole, { bg: string; text: string; border: string }> = {
    Administrador: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
    },
    Operacional: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
    Visualizador: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
    },
  };

  const badge = roleBadgeStyles[user.role] || roleBadgeStyles.Operacional;

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Nunca acessou';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-detail-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Container Centralizado */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          className="relative w-full max-w-xl transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all border border-slate-200 animate-scale-up font-sans my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabeçalho Oficial POLCAL */}
          <div className="bg-[#122443] px-6 py-5 text-white flex items-center justify-between border-b border-[#274578]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#274578] text-[#C5B641] flex items-center justify-center shrink-0 shadow-inner">
                <UserIcon className="w-6 h-6 text-[#C5B641]" />
              </div>
              <div>
                <h3 id="user-detail-title" className="text-base font-bold text-white tracking-wide">
                  Dados Cadastrais do Usuário
                </h3>
                <p className="text-xs text-[#C9D7EE]/80">
                  Polícia Científica de Alagoas — PrazoJus
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Fechar janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Conteúdo com Informações do Cadastro */}
          <div className="p-6 space-y-5">
            {/* Bloco Superior: Identificação e Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-extrabold text-slate-900">{user.nome}</h4>
                </div>
                <p className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {user.cargo}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  {user.role}
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                    user.status === 'Ativo'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {user.status === 'Ativo' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  )}
                  {user.status}
                </span>
              </div>
            </div>

            {/* Grid de Detalhes Pessoais e Institucionais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              {/* CPF */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  CPF
                </span>
                <span className="font-mono font-bold text-slate-800 text-sm block">
                  {user.cpf || 'Não informado'}
                </span>
              </div>

              {/* Matrícula */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                  Matrícula Institucional
                </span>
                <span className="font-mono font-bold text-slate-800 text-sm block">
                  {user.matricula || 'POLCAL'}
                </span>
              </div>

              {/* E-mail */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  E-mail Funcional
                </span>
                <span className="font-medium text-slate-700 break-all block">
                  {user.email}
                </span>
              </div>

              {/* Departamento / Divisão */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  Departamento / Lotação
                </span>
                <span className="font-medium text-slate-700 block">
                  {user.departamento || 'Polícia Científica de Alagoas'}
                </span>
              </div>
            </div>

            {/* Setores Periciais Autorizados */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#274578]" />
                Setores Periciais com Acesso Liberado:
              </span>

              {user.setores && user.setores.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {user.setores.map((setor) => (
                    <span
                      key={setor}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200"
                    >
                      {setor}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  {user.role === 'Administrador'
                    ? 'Acesso Geral e Irrestrito a todos os setores forenses.'
                    : 'Nenhum setor pericial especificamente vinculado.'}
                </p>
              )}
            </div>

            {/* Status de Senha e Último Acesso */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>
                  Último Acesso: <strong>{formatDate(user.ultimoAcesso)}</strong>
                </span>
              </div>

              {user.precisaTrocarSenha && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  <KeyRound className="w-3 h-3 text-amber-600" />
                  Troca de senha obrigatória no próximo login
                </span>
              )}
            </div>
          </div>

          {/* Rodapé com Botões */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
            >
              Fechar
            </button>

            {canEdit && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(user);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#122443] hover:bg-[#274578] rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Cadastro</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
