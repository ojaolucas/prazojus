export type UserRole =
  | 'Administrador'
  | 'Operacional'
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
  setores?: string[];
}

export interface PermissionMatrix {
  canViewDashboard: boolean;
  canViewCalendar: boolean;
  canViewRequests: boolean;
  canViewKanban: boolean;
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
  canViewAudit: boolean;
}

export type PermissionKey = keyof PermissionMatrix;
