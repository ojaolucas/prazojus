import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ROLE_PERMISSIONS,
  PERMISSION_DESCRIPTIONS,
} from '../../services/permissionService';
import { PermissionKey, UserRole } from '../../types/user';
import {
  Users,
  Shield,
  Check,
  X,
  AlertTriangle,
  Info,
  UserCheck,
  KeyRound,
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { users, currentUser, switchUser, currentRole, can } = useAuth();

  const permissionKeys = Object.keys(PERMISSION_DESCRIPTIONS) as PermissionKey[];

  // Agrupa permissões por categoria
  const categories = Array.from(
    new Set(permissionKeys.map((k) => PERMISSION_DESCRIPTIONS[k].category))
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-700" />
            Controle de Perfis e Matriz de Permissões
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão de acessos baseada em papéis (RBAC): Administrador, Supervisor e Operador
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Perfil ativo:</span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            {currentRole}
          </span>
        </div>
      </div>

      {/* Banner de Esclarecimento sobre Segurança Local */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-950 block">
            Aviso de Arquitetura Demonstrativa (Client-Side MVP)
          </span>
          <p className="text-amber-800 mt-1 leading-relaxed">
            As permissões apresentadas controlam estritamente o comportamento da interface do usuário
            (ocultando e bloqueando botões de exclusão, conclusão ou gestão). Como esta aplicação não
            possui backend nesta fase inicial, essas restrições ocorrem no navegador e podem ser
            contornadas via console. Em uma versão de produção, todas as operações devem ser validadas
            por regras de negócio no servidor Node.js com autenticação segura JWT.
          </p>
        </div>
      </div>

      {/* Cartões dos Usuários Fictícios */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-blue-700" />
          Usuários Fictícios do Sistema (1-Click Switch)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {users.map((u) => {
            const isActive = u.id === currentUser.id;

            let roleColor = 'bg-blue-100 text-blue-800 border-blue-200';
            if (u.role === 'Administrador')
              roleColor = 'bg-purple-100 text-purple-800 border-purple-200';
            if (u.role === 'Supervisor')
              roleColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';

            return (
              <div
                key={u.id}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                  isActive
                    ? 'border-blue-600 bg-blue-50/30 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${roleColor}`}>
                      {u.role}
                    </span>
                    {isActive && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded">
                        <Check className="w-3 h-3" /> Conectado
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm">{u.nome}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{u.cargo}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {u.departamento} • Matrícula: {u.matricula}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isActive}
                    onClick={() => switchUser(u.id)}
                    className={`w-full py-1.5 px-3 text-xs font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-slate-100 text-slate-400 cursor-default'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-2xs'
                    }`}
                  >
                    {isActive ? 'Perfil em Uso' : 'Alternar para este Perfil'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Matriz Centralizada de Permissões */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <KeyRound className="w-4 h-4 text-blue-700" />
              Matriz Centralizada de Acessos
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparativo das ações autorizadas para cada nível hierárquico
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <th className="py-3 px-4">Funcionalidade / Ação</th>
                <th className="py-3 px-4 text-center">Administrador</th>
                <th className="py-3 px-4 text-center">Supervisor</th>
                <th className="py-3 px-4 text-center">Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((cat) => {
                const items = permissionKeys.filter(
                  (k) => PERMISSION_DESCRIPTIONS[k].category === cat
                );

                return (
                  <React.Fragment key={cat}>
                    <tr className="bg-slate-50/80 font-bold text-slate-700">
                      <td colSpan={4} className="py-2 px-4 text-[11px] uppercase tracking-wider">
                        {cat}
                      </td>
                    </tr>
                    {items.map((perm) => {
                      const meta = PERMISSION_DESCRIPTIONS[perm];
                      const adminOk = ROLE_PERMISSIONS.Administrador[perm];
                      const supOk = ROLE_PERMISSIONS.Supervisor[perm];
                      const opOk = ROLE_PERMISSIONS.Operador[perm];

                      return (
                        <tr key={perm} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-4">
                            <span className="font-semibold text-slate-800 block">
                              {meta.label}
                            </span>
                            <span className="text-[11px] text-slate-400">{meta.desc}</span>
                          </td>

                          {/* Admin */}
                          <td className="py-2.5 px-4 text-center">
                            {adminOk ? (
                              <span className="inline-flex p-1 rounded-full bg-emerald-100 text-emerald-700">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="inline-flex p-1 rounded-full bg-rose-100 text-rose-700">
                                <X className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </td>

                          {/* Supervisor */}
                          <td className="py-2.5 px-4 text-center">
                            {supOk ? (
                              <span className="inline-flex p-1 rounded-full bg-emerald-100 text-emerald-700">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="inline-flex p-1 rounded-full bg-slate-100 text-slate-400">
                                <X className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </td>

                          {/* Operador */}
                          <td className="py-2.5 px-4 text-center">
                            {opOk ? (
                              <span className="inline-flex p-1 rounded-full bg-emerald-100 text-emerald-700">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="inline-flex p-1 rounded-full bg-slate-100 text-slate-400">
                                <X className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
