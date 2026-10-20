export type UserRole =
  | 'Administrador'
  | 'Supervisor'
  | 'Operador'
  | 'Visualizador';

export interface User {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  departamento?: string;
  matricula?: string;
  cpf?: string;
  role: UserRole;
  status: 'Ativo' | 'Inativo';
  avatarUrl?: string;
  senha?: string;
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
