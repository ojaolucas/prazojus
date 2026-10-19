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
      title="Autenticação Demonstrativa"
      subtitle="Alterne entre perfis fictícios para testar a matriz de permissões do sistema"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Banner de aviso explicativo */}
        <div className="flex items-start gap-3 p-3.5 bg-amber-50/80 border border-amber-200 rounded-lg text-amber-900 text-xs leading-relaxed">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-950">Ambiente de Demonstração (Client-Side)</p>
            <p className="mt-0.5 text-amber-800">
              Esta autenticação é puramente didática e executada no navegador via LocalStorage. Não
              há backend, banco de dados ou autenticação criptográfica segura nesta versão. Em
              produção, as regras devem ser validadas por servidor com JWT e banco PostgreSQL.
            </p>
          </div>
        </div>

        {/* Lista de Contas */}
        <div className="grid grid-cols-1 gap-3">
          {users.map((user) => {
            const isSelected = user.id === currentUser.id;

            let roleBadge = (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                Operador
              </span>
            );

            if (user.role === 'Administrador') {
              roleBadge = (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  Administrador
                </span>
              );
            } else if (user.role === 'Supervisor') {
              roleBadge = (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Supervisor
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
                        : user.role === 'Supervisor'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 text-white'
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
              <strong className="text-slate-700">Administrador:</strong> Acesso total, gerencia usuários, importar/restaurar backups e matriz de controle.
            </li>
            <li>
              <strong className="text-slate-700">Supervisor:</strong> Cadastra, edita, conclui laudos e exclui requisições. Sem acesso a gestão de usuários.
            </li>
            <li>
              <strong className="text-slate-700">Operador:</strong> Cadastra e edita requisições. Não pode excluir nem homologar conclusão direta.
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
