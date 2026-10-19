export type UserRole = 'Administrador' | 'Supervisor' | 'Operador';

export interface User {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  departamento: string;
  matricula: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface PermissionMatrix {
  canViewDashboard: boolean;
  canViewCalendar: boolean;
  canViewRequests: boolean;
  canCreateRequest: boolean;
  canEditRequest: boolean;
  canDeleteRequest: boolean;
  canConcludeRequest: boolean;
  canCancelRequest: boolean;
  canManageUsers: boolean;
  canConfigurePermissions: boolean;
  canExportBackup: boolean;
  canImportBackup: boolean;
  canResetDemoData: boolean;
}

export type PermissionKey = keyof PermissionMatrix;
