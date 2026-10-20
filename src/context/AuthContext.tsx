import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, PermissionKey, PermissionMatrix } from '../types/user';
import { StorageService } from '../services/storageService';
import { ROLE_PERMISSIONS, hasPermission } from '../services/permissionService';
import { useToast } from './ToastContext';

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
    const updated = users.map((u) => (u.id === id ? { ...u, ...userData } : u));
    setUsers(updated);
    StorageService.saveUsers(updated);
    success('Usuário Atualizado', 'As informações do usuário foram salvas com sucesso.');
    return true;
  };

  const deleteUser = (id: string): boolean => {
    if (id === currentUserId) {
      error('Operação Não Permitida', 'Não é possível excluir o usuário da sessão atualmente ativa.');
      return false;
    }
    const target = users.find((u) => u.id === id);
    const updated = users.filter((u) => u.id !== id);
    setUsers(updated);
    StorageService.saveUsers(updated);
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
