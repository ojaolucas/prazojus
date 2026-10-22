import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, PermissionKey, PermissionMatrix } from '../types/user';
import { StorageService } from '../services/storageService';
import { ROLE_PERMISSIONS, hasPermission } from '../services/permissionService';
import { useToast } from './ToastContext';

import { AuditService, buildDiff } from '../services/auditService';

interface AuthContextType {
  currentUser: User;
  users: User[];
  currentRole: UserRole;
  permissions: PermissionMatrix;
  can: (permission: PermissionKey) => boolean;
  switchUser: (userId: string) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  refreshUsers: () => void;
  addUser: (userData: Omit<User, 'id'>) => boolean;
  updateUser: (id: string, userData: Partial<User>) => boolean;
  deleteUser: (id: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { info, success, error } = useToast();
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [currentUserId, setCurrentUserId] = useState<string>(() => StorageService.getCurrentUserId());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  useEffect(() => {
    StorageService.initialize();
  }, []);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];
  const currentRole = currentUser?.role || 'Administrador';
  const permissions = ROLE_PERMISSIONS[currentRole] || ROLE_PERMISSIONS.Administrador;

  const can = (permission: PermissionKey): boolean => {
    return hasPermission(currentRole, permission);
  };

  const switchUser = (userId: string) => {
    const selected = users.find((u) => u.id === userId);
    if (selected) {
      setCurrentUserId(selected.id);
      StorageService.setCurrentUserId(selected.id);

      // Log de auditoria de autenticação e acesso
      AuditService.log({
        usuario: selected,
        modulo: 'autenticacao',
        acao: 'acesso',
        descricao: `Acesso autenticado ao sistema como ${selected.nome} (${selected.role}) - ${selected.cargo}.`,
        status: 'sucesso',
        metadados: {
          departamento: selected.departamento,
          matricula: selected.matricula,
        },
      });

      info(
        'Perfil Alternado',
        `Agora operando como ${selected.nome} (${selected.role}) - ${selected.cargo}`
      );
    }
  };

  const refreshUsers = () => {
    setUsers(StorageService.getUsers());
  };

  const addUser = (userData: Omit<User, 'id'>): boolean => {
    if (!can('canManageUsers')) {
      AuditService.log({
        usuario: currentUser,
        modulo: 'usuarios',
        acao: 'criacao',
        descricao: `Tentativa não autorizada de cadastrar o usuário "${userData.nome}".`,
        status: 'falha',
        motivoFalha: 'Perfil sem permissão canManageUsers.',
      });
      error('Ação Bloqueada', 'Apenas o Administrador pode cadastrar novos usuários.');
      return false;
    }

    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
    };
    const updated = [newUser, ...users];
    setUsers(updated);
    StorageService.saveUsers(updated);

    AuditService.log({
      usuario: currentUser,
      modulo: 'usuarios',
      acao: 'criacao',
      descricao: `Cadastro de novo usuário institucional: ${newUser.nome} (${newUser.role} - ${newUser.cargo}).`,
      entidadeId: newUser.id,
      entidadeReferencia: newUser.nome,
      status: 'sucesso',
      detalhes: [
        { campo: 'nome', rotulo: 'Nome', valorAnterior: null, valorNovo: newUser.nome },
        { campo: 'email', rotulo: 'E-mail', valorAnterior: null, valorNovo: newUser.email },
        { campo: 'role', rotulo: 'Perfil de Acesso', valorAnterior: null, valorNovo: newUser.role },
        { campo: 'cargo', rotulo: 'Cargo', valorAnterior: null, valorNovo: newUser.cargo },
        { campo: 'matricula', rotulo: 'Matrícula', valorAnterior: null, valorNovo: newUser.matricula || '-' },
      ],
    });

    success('Usuário Cadastrado', `O usuário ${newUser.nome} foi cadastrado com sucesso.`);
    return true;
  };

  const updateUser = (id: string, userData: Partial<User>): boolean => {
    if (!can('canManageUsers')) {
      AuditService.log({
        usuario: currentUser,
        modulo: 'usuarios',
        acao: 'edicao',
        descricao: `Tentativa não autorizada de editar o usuário ID "${id}".`,
        entidadeId: id,
        status: 'falha',
        motivoFalha: 'Perfil sem permissão canManageUsers.',
      });
      error('Ação Bloqueada', 'Apenas o Administrador pode modificar cadastros de usuários.');
      return false;
    }

    const targetUser = users.find((u) => u.id === id);
    if (!targetUser) return false;

    let nextUser: User = { ...targetUser, ...userData };
    if (!userData.avatarUrl) {
      delete nextUser.avatarUrl;
    }

    const diffs = buildDiff(targetUser, nextUser);

    const updated = users.map((u) => (u.id === id ? nextUser : u));
    setUsers(updated);
    StorageService.saveUsers(updated);

    AuditService.log({
      usuario: currentUser,
      modulo: 'usuarios',
      acao: 'edicao',
      descricao: `Atualização cadastral do usuário ${targetUser.nome}.`,
      entidadeId: targetUser.id,
      entidadeReferencia: targetUser.nome,
      status: 'sucesso',
      detalhes: diffs,
    });

    success('Usuário Atualizado', 'As informações do usuário foram salvas com sucesso.');
    return true;
  };

  const deleteUser = (id: string): boolean => {
    if (!can('canManageUsers')) {
      AuditService.log({
        usuario: currentUser,
        modulo: 'usuarios',
        acao: 'exclusao',
        descricao: `Tentativa não autorizada de excluir usuário ID "${id}".`,
        entidadeId: id,
        status: 'falha',
        motivoFalha: 'Perfil sem permissão canManageUsers.',
      });
      error('Ação Bloqueada', 'Apenas o Administrador pode remover usuários.');
      return false;
    }

    if (id === currentUserId) {
      AuditService.log({
        usuario: currentUser,
        modulo: 'usuarios',
        acao: 'exclusao',
        descricao: 'Tentativa bloqueada de exclusão da própria conta em sessão ativa.',
        entidadeId: id,
        entidadeReferencia: currentUser.nome,
        status: 'falha',
        motivoFalha: 'Não é possível excluir o usuário da sessão atualmente ativa.',
      });
      error('Operação Não Permitida', 'Não é possível excluir o usuário da sessão atualmente ativa.');
      return false;
    }

    const target = users.find((u) => u.id === id);
    const updated = users.filter((u) => u.id !== id);
    setUsers(updated);
    StorageService.saveUsers(updated);

    AuditService.log({
      usuario: currentUser,
      modulo: 'usuarios',
      acao: 'exclusao',
      descricao: `Exclusão do cadastro do usuário institucional ${target?.nome ?? id}.`,
      entidadeId: id,
      entidadeReferencia: target?.nome,
      status: 'sucesso',
      detalhes: target
        ? [
            { campo: 'nome', rotulo: 'Nome', valorAnterior: target.nome, valorNovo: '(removido)' },
            { campo: 'email', rotulo: 'E-mail', valorAnterior: target.email, valorNovo: null },
            { campo: 'role', rotulo: 'Perfil', valorAnterior: target.role, valorNovo: null },
          ]
        : undefined,
    });

    success('Usuário Removido', `O usuário ${target?.nome ?? ''} foi excluído do sistema.`);
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        currentRole,
        permissions,
        can,
        switchUser,
        isLoginModalOpen,
        setIsLoginModalOpen,
        refreshUsers,
        addUser,
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
