import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, UserRole, PermissionKey } from '../../types/user';
import {
  ROLE_PERMISSIONS,
  PERMISSION_DESCRIPTIONS,
} from '../../services/permissionService';
import { UserFormModal } from './UserFormModal';
import { ConfirmDialog } from '../layout/ConfirmDialog';
import {
  Plus,
  FilterX,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Shield,
  KeyRound,
  Check,
  X,
  UserCheck,
  User as UserIcon,
  Search,
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { users, currentUser, switchUser, currentRole, addUser, updateUser, deleteUser } =
    useAuth();

  // Abas principais: "Usuários" e "Matriz de Permissões"
  const [activeTab, setActiveTab] = useState<'usuarios' | 'permissoes'>('usuarios');

  // Filtros
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  // Paginação
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modais de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Mapeamento dos nomes de perfil
  const roleDisplayNames: Record<UserRole, string> = {
    Administrador: 'ADMINISTRADOR',
    Supervisor: 'GESTOR',
    Operador: 'OPERACIONAL',
    Visualizador: 'VISUALIZADOR',
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setIsModalOpen(true);
  };

  const handleSaveUser = (userData: Omit<User, 'id'>) => {
    if (editingUser) {
      updateUser(editingUser.id, userData);
    } else {
      addUser(userData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (u: User) => {
    setUserToDelete(u);
  };

  const handleClearFilters = () => {
    setSearch('');
    setFilterRole('todos');
    setFilterStatus('todos');
    setCurrentPage(1);
  };

  // Filtragem dos Usuários
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Busca por nome, email ou cpf
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = u.nome.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        const matchesCpf = (u.cpf || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesCpf) return false;
      }

      // Filtro por Perfil
      if (filterRole !== 'todos' && u.role !== filterRole) {
        return false;
      }

      // Filtro por Status
      if (filterStatus !== 'todos' && u.status !== filterStatus) {
        return false;
      }

      return true;
    });
  }, [users, search, filterRole, filterStatus]);

  // Paginação
  const totalRecords = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Permissões
  const permissionKeys = Object.keys(PERMISSION_DESCRIPTIONS) as PermissionKey[];
  const categories = Array.from(
    new Set(permissionKeys.map((k) => PERMISSION_DESCRIPTIONS[k].category))
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Gestão de Usuários
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gerencie as credenciais corporativas, cargos e permissões de acesso ao sistema
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Seletor de Abas */}
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('usuarios')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'usuarios'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Usuários Cadastrados ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('permissoes')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'permissoes'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Matriz de Permissões
            </button>
          </div>

          {/* Botão Novo Usuário */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Novo Usuário
          </button>
        </div>
      </div>

      {activeTab === 'usuarios' ? (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
              {/* Buscar Nome / E-mail / CPF */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Buscar Nome / E-mail / CPF
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Buscar..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Perfil de Acesso */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Perfil de Acesso
                </label>
                <select
                  value={filterRole}
                  onChange={(e) => {
                    setFilterRole(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors text-slate-700"
                >
                  <option value="todos">Todos</option>
                  <option value="Administrador">Administrador (Acesso Total)</option>
                  <option value="Supervisor">Gestor (Edição/Operação/Relatórios)</option>
                  <option value="Operador">Operacional (Cadastro/Movimentações)</option>
                  <option value="Visualizador">Visualizador (Apenas Leitura)</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors text-slate-700"
                >
                  <option value="todos">Todos</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>

              {/* Botão Limpar Filtros */}
              <div>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs h-[38px]"
                >
                  <FilterX className="w-3.5 h-3.5 text-slate-500" />
                  Limpar Filtros
                </button>
              </div>
            </div>
          </div>

          {/* Tabela de Usuários */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">Avatar</th>
                    <th className="py-3 px-4">Colaborador / E-mail</th>
                    <th className="py-3 px-4">CPF</th>
                    <th className="py-3 px-4">Cargo</th>
                    <th className="py-3 px-4">Perfil</th>
                    <th className="py-3 px-4 text-center">Situação</th>
                    <th className="py-3 px-4 text-center w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedUsers.map((u) => {
                    const isCurrent = u.id === currentUser.id;

                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-slate-50/60 transition-colors ${
                          isCurrent ? 'bg-blue-50/20' : ''
                        }`}
                      >
                        {/* Avatar */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 border border-slate-200 mx-auto flex items-center justify-center font-bold text-slate-600 text-xs shadow-2xs">
                            {u.avatarUrl ? (
                              <img
                                src={u.avatarUrl}
                                alt={u.nome}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              u.nome
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')
                            )}
                          </div>
                        </td>

                        {/* Colaborador / E-mail */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-blue-600 hover:underline cursor-pointer">
                              {u.nome}
                            </span>
                            {isCurrent && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Você
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {u.email}
                          </span>
                        </td>

                        {/* CPF */}
                        <td className="py-3.5 px-4 font-mono text-slate-700 font-medium">
                          {u.cpf || '—'}
                        </td>

                        {/* Cargo */}
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {u.cargo}
                        </td>

                        {/* Perfil */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[11px] text-slate-800 tracking-wider">
                            {roleDisplayNames[u.role] || u.role.toUpperCase()}
                          </span>
                        </td>

                        {/* Situação */}
                        <td className="py-3.5 px-4 text-center">
                          {u.status === 'Ativo' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Inativo
                            </span>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Trocar sessão caso não seja o usuário ativo */}
                            {!isCurrent && (
                              <button
                                type="button"
                                onClick={() => switchUser(u.id)}
                                title="Alternar sessão para este usuário"
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                            )}

                            {/* Editar */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(u)}
                              title="Editar Usuário"
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Excluir */}
                            <button
                              type="button"
                              disabled={isCurrent}
                              onClick={() => handleDelete(u)}
                              title={isCurrent ? 'Não é possível excluir o usuário ativo' : 'Excluir Usuário'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isCurrent
                                  ? 'text-slate-200 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {paginatedUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        Nenhum usuário encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Barra de Paginação */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/60 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Mostrar:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                >
                  <option value={5}>5 registros</option>
                  <option value={10}>10 registros</option>
                  <option value={20}>20 registros</option>
                </select>
                <span>por página</span>
              </div>

              <div>
                Mostrando {totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1} a{' '}
                {Math.min(currentPage * pageSize, totalRecords)} de {totalRecords} registros
              </div>

              <div className="flex items-center gap-1.5 self-center sm:self-auto">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setCurrentPage(pg)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                      currentPage === pg
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-200 hover:bg-white text-slate-600'
                    }`}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Aba da Matriz de Permissões */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                <KeyRound className="w-4 h-4 text-blue-600" />
                Matriz de Controle de Acesso (RBAC)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Competências institucionais autorizadas para cada nível hierárquico
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                  <th className="py-3 px-4">Funcionalidade / Ação</th>
                  <th className="py-3 px-4 text-center">Administrador</th>
                  <th className="py-3 px-4 text-center">Gestor (Supervisor)</th>
                  <th className="py-3 px-4 text-center">Operacional</th>
                  <th className="py-3 px-4 text-center">Visualizador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat) => {
                  const items = permissionKeys.filter(
                    (k) => PERMISSION_DESCRIPTIONS[k].category === cat
                  );

                  return (
                    <React.Fragment key={cat}>
                      <tr className="bg-slate-50 font-bold text-slate-700">
                        <td colSpan={5} className="py-2 px-4 text-[11px] uppercase tracking-wider">
                          {cat}
                        </td>
                      </tr>
                      {items.map((perm) => {
                        const meta = PERMISSION_DESCRIPTIONS[perm];
                        const adminOk = ROLE_PERMISSIONS.Administrador[perm];
                        const supOk = ROLE_PERMISSIONS.Supervisor[perm];
                        const opOk = ROLE_PERMISSIONS.Operador[perm];
                        const viewOk = ROLE_PERMISSIONS.Visualizador[perm];

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

                            {/* Gestor */}
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

                            {/* Operacional */}
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

                            {/* Visualizador */}
                            <td className="py-2.5 px-4 text-center">
                              {viewOk ? (
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
      )}

      {/* Modal de Cadastro / Edição de Usuário */}
      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        initialUser={editingUser}
      />

      {/* Confirmação Segura de Exclusão */}
      <ConfirmDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={() => {
          if (userToDelete) {
            deleteUser(userToDelete.id);
            setUserToDelete(null);
          }
        }}
        title="Confirmar Exclusão de Usuário"
        message={`Tem certeza que deseja excluir o usuário "${userToDelete?.nome}"? Esta ação removerá os acessos e permissões imediatamente.`}
        confirmLabel="Sim, Excluir Usuário"
        cancelLabel="Cancelar"
        isDestructive
      />
    </div>
  );
};
