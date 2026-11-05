import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, PermissionKey, PermissionMatrix } from '../types/user';
import { StorageService } from '../services/storageService';
import { ApiService } from '../services/apiService';
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
    ApiService.getUsers().then((dbUsers) => {
      if (dbUsers && Array.isArray(dbUsers) && dbUsers.length > 0) {
        setUsers(dbUsers);
        StorageService.saveUsers(dbUsers);
      }
    });
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
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      return {
        success: false,
        error: 'Informe seu e-mail institucional ou CPF.',
      };
    }

    if (!password || !password.trim()) {
      return {
        success: false,
        error: 'Informe sua senha institucional de acesso.',
      };
    }

    const cleanCpfDigits = cleanId.replace(/\D/g, '');

    // Autenticação direta no banco PostgreSQL com validação de senha bcrypt
    const apiRes = await ApiService.login(cleanId, password);
    
    if (!apiRes.success || !apiRes.user) {
      // Fallback para desenvolvimento local caso a API não consiga alcançar o banco remoto
      if (
        (cleanId === 'admin@polcal.al.gov.br' || cleanCpfDigits === '00000000000') &&
        (password === 'admin@2026' || password === 'admin123' || password === 'polcal@2026')
      ) {
        const localAdmin: User = {
          id: 'a0000000-0000-0000-0000-000000000001',
          nome: 'Administrador Geral POLCAL',
          email: 'admin@polcal.al.gov.br',
          cargo: 'Diretor-Geral Forense',
          departamento: 'DGPC - Direção-Geral de Perícia Científica',
          matricula: 'POLCAL-0001',
          cpf: '000.000.000-00',
          role: 'Administrador',
          status: 'Ativo',
          setores: [
            'Seção de Balística Forense',
            'Seção de Perícias em Veículos e Acidentes de Trânsito',
            'Seção de Perícias em Locais de Crime Contra a Vida',
            'Seção de Perícias em Crimes Contra o Patrimônio',
            'Seção de Química Forense',
            'Seção de Toxicologia Forense',
            'Seção de Genética Forense / DNA',
            'Seção de Computação Forense e Exames em Dispositivos Eletrônicos',
            'Seção de Documentoscopia e Grafotécnica',
            'Seção de Engenharia Legal e Meio Ambiente',
            'Seção de Audiovisual e Identificação Biométrica Facial',
            'Seção de Identificação Papiloscópica Forense',
            'Seção de Antropologia Forense e Odontologia Legal',
            'Seção de Tanatologia e Exames Necroscópicos',
            'Seção de Sexologia Forense e Exames de Lesão Corporal',
          ],
        };
        setCurrentUserId(localAdmin.id);
        StorageService.setCurrentUserId(localAdmin.id);
        StorageService.setLoggedIn(true);
        setIsAuthenticated(true);
        success('Acesso Autorizado (Modo Local)', `Bem-vindo(a), ${localAdmin.nome}!`);
        return { success: true };
      }

      return {
        success: false,
        error: apiRes.error || 'Credenciais institucionais incorretas. Verifique seu e-mail/CPF ou senha.',
      };
    }

    const found = apiRes.user;

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

    // Garante que o usuário esteja na lista em memória
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === found.id);
      if (exists) {
        return prev.map((u) => (u.id === found.id ? found : u));
      }
      return [found, ...prev];
    });

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

    ApiService.logout(currentUser.id).catch(() => {});
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

    // Persistência assíncrona no PostgreSQL
    ApiService.createUser(userData).then((res) => {
      if (res.success && res.user) {
        setUsers((prev) => [res.user!, ...prev.filter((u) => u.id !== res.user!.id)]);
        StorageService.saveUsers([res.user!, ...users.filter((u) => u.id !== res.user!.id)]);
      } else if (res.error) {
        error('Erro no Banco de Dados', res.error);
      }
    });

    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
    };
    const updated = [newUser, ...users];
    setUsers(updated);
    StorageService.saveUsers(updated);

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

    // Persistência assíncrona no PostgreSQL
    ApiService.updateUser(id, userData).then((res) => {
      if (res.success && res.user) {
        setUsers((prev) => prev.map((u) => (u.id === id ? res.user! : u)));
        StorageService.saveUsers(users.map((u) => (u.id === id ? res.user! : u)));
      }
    });

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
