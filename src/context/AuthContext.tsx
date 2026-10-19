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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { info } = useToast();
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [currentUserId, setCurrentUserId] = useState<string>(() => StorageService.getCurrentUserId());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  useEffect(() => {
    StorageService.initialize();
  }, []);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];
  const currentRole = currentUser.role;
  const permissions = ROLE_PERMISSIONS[currentRole];

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
