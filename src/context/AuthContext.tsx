import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, PermissionKey, PermissionMatrix } from '../types/user';
import { StorageService } from '../services/storageService';
import { MOCK_USERS } from '../data/mockUsers';
import {
  ROLE_PERMISSIONS,
  hasPermission,
  getUserAllowedSectors,
  userCanAccessSector,
} from '../services/permissionService';
import { useToast } from './ToastContext';

import { AuditService, buildDiff } from '../services/auditService';

interface AuthContextType {
  currentUser: User;
  users: User[];
  currentRole: UserRole;
  permissions: PermissionMatrix;
  can: (permission: PermissionKey) => boolean;
  allowedSectors: string[];
  canAccessSector: (sector?: string | null) => boolean;
  switchUser: (userId: string) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  refreshUsers: () => void;
  addUser: (userData: Omit<User, 'id'>) => boolean;
  updateUser: (id: string, userData: Partial<User>) => boolean;
  deleteUser: (id: string) => boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { info, success, error } = useToast();
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [currentUserId, setCurrentUserId] = useState<string>(() => StorageService.getCurrentUserId());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => StorageService.isLoggedIn());

  useEffect(() => {
    StorageService.initialize();
  }, []);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0] || MOCK_USERS[0];
  const currentRole = currentUser?.role || 'Administrador';
  const permissions = ROLE_PERMISSIONS[currentRole] || ROLE_PERMISSIONS.Administrador;

  const can = (permission: PermissionKey): boolean => {
    return hasPermission(currentRole, permission);
  };

  const allowedSectors = getUserAllowedSectors(currentUser);

  const canAccessSector = (sector?: string | null): boolean => {
    return userCanAccessSector(currentUser, sector);
  };

  const switchUser = (userId: string) => {
    const selected = users.find((u) => u.id === userId);
    if (selected) {
      setCurrentUserId(selected.id);
      StorageService.setCurrentUserId(selected.id);
      StorageService.setLoggedIn(true);
      setIsAuthenticated(true);

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

  const login = async (
    identifier: string,
    _password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      return {
        success: false,
        error: 'Informe seu e-mail institucional, CPF ou matrícula.',
      };
    }

    const cleanCpfDigits = cleanId.replace(/\D/g, '');

    const found = users.find((u) => {
      const emailMatch = u.email.toLowerCase() === cleanId;
      const matriculaMatch = u.matricula?.toLowerCase() === cleanId;
      const cpfDigits = u.cpf?.replace(/\D/g, '');
      const cpfMatch = Boolean(cpfDigits && cleanCpfDigits && cpfDigits === cleanCpfDigits);
      const nameMatch = u.nome.toLowerCase() === cleanId;
      return emailMatch || matriculaMatch || cpfMatch || nameMatch;
    });

    if (!found) {
      return {
        success: false,
        error: 'Credenciais institucionais não localizadas. Verifique os dados digitados ou selecione um perfil de acesso.',
      };
    }

    if (found.status === 'Inativo') {
      return {
        success: false,
        error: 'Este usuário encontra-se inativo no sistema. Contate a Diretoria-Geral (DGPC).',
      };
    }

    setCurrentUserId(found.id);
    StorageService.setCurrentUserId(found.id);
    StorageService.setLoggedIn(true);
    setIsAuthenticated(true);

    AuditService.log({
      usuario: found,
      modulo: 'autenticacao',
      acao: 'acesso',
      descricao: `Acesso autenticado ao sistema por login institucional: ${found.nome} (${found.role}) - ${found.cargo}.`,
      status: 'sucesso',
      metadados: {
        departamento: found.departamento,
        matricula: found.matricula,
        identificadorUsado: identifier,
      },
    });

    success(
      'Acesso Autorizado',
      `Bem-vindo(a), ${found.nome}! Operando como ${found.role}.`
    );

    return { success: true };
  };

  const logout = () => {
    AuditService.log({
      usuario: currentUser,
      modulo: 'autenticacao',
      acao: 'acesso',
      descricao: `Sessão encerrada pelo usuário ${currentUser.nome}.`,
      status: 'sucesso',
    });

    StorageService.setLoggedIn(false);
    setIsAuthenticated(false);
    info('Sessão Encerrada', 'Você saiu do sistema PrazoJus com segurança.');
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
        {
          campo: 'setores',
          rotulo: 'Setores Responsáveis',
          valorAnterior: null,
          valorNovo:
            newUser.setores && newUser.setores.length > 0
              ? newUser.setores.join(', ')
              : '(Nenhum setor atribuído)',
        },
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
        allowedSectors,
        canAccessSector,
        switchUser,
        isLoginModalOpen,
        setIsLoginModalOpen,
        refreshUsers,
        addUser,
        updateUser,
        deleteUser,
        isAuthenticated,
        login,
        logout,
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
