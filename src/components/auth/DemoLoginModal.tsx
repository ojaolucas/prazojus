import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../layout/Modal';
import { ShieldCheck, UserCheck, ShieldAlert, Check, LogOut, Info } from 'lucide-react';

export const DemoLoginModal: React.FC = () => {
  const { users, currentUser, switchUser, isLoginModalOpen, setIsLoginModalOpen } = useAuth();

  return (
    <Modal
      isOpen={isLoginModalOpen}
      onClose={() => setIsLoginModalOpen(false)}
      title="Alternar Sessão de Trabalho"
      subtitle="Selecione o operador ou servidor para operar no sistema"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Lista de Contas */}
        <div className="grid grid-cols-1 gap-2.5 max-h-96 overflow-y-auto">
          {users.map((user) => {
            const isSelected = user.id === currentUser.id;

            let roleBadge = (
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                Operacional
              </span>
            );

            if (user.role === 'Administrador') {
              roleBadge = (
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-[#122443] text-white">
                  Administrador
                </span>
              );
            } else if (user.role === 'Visualizador') {
              roleBadge = (
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                  Visualizador
                </span>
              );
            }

            return (
              <div
                key={user.id}
                onClick={() => {
                  switchUser(user.id);
                  setIsLoginModalOpen(false);
                }}
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ${
                      user.role === 'Administrador'
                        ? 'bg-purple-600 text-white'
                        : user.role === 'Operacional'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-600 text-white'
                    }`}
                  >
                    {user.nome
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{user.nome}</span>
                      {roleBadge}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{user.cargo}</p>
                    <p className="text-[11px] text-slate-400">
                      {user.email} • Matrícula: {user.matricula}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isSelected ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-md">
                      <Check className="w-3.5 h-3.5" />
                      Ativo
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-500 hover:text-slate-800 border border-slate-200 px-2.5 py-1 rounded-md bg-white">
                      Entrar como
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumo de Permissões Rápidas */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-600" /> Resumo das Permissões por Papel:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-slate-500">
            <li>
              <strong className="text-slate-700">Administrador:</strong> Acesso Total (Cadastrar / Edição / Excluir / Gestão de Usuários e Sistema).
            </li>
            <li>
              <strong className="text-slate-700">Operacional:</strong> Cadastrar Requisição e Edição nos setores atribuídos. Sem permissão de exclusão de requisições.
            </li>
            <li>
              <strong className="text-slate-700">Visualizador:</strong> Apenas Leitura (consulta de prazos, calendário e autos).
            </li>
          </ul>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsLoginModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};
