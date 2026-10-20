import { PermissionMatrix, PermissionKey, UserRole } from '../types/user';

export const ROLE_PERMISSIONS: Record<UserRole, PermissionMatrix> = {
  Administrador: {
    canViewDashboard: true,
    canViewCalendar: true,
    canViewRequests: true,
    canCreateRequest: true,
    canEditRequest: true,
    canDeleteRequest: true,
    canConcludeRequest: true,
    canCancelRequest: true,
    canManageUsers: true,
    canConfigurePermissions: true,
    canExportBackup: true,
    canImportBackup: true,
    canResetDemoData: true,
  },
  Supervisor: {
    canViewDashboard: true,
    canViewCalendar: true,
    canViewRequests: true,
    canCreateRequest: true,
    canEditRequest: true,
    canDeleteRequest: true,
    canConcludeRequest: true,
    canCancelRequest: true,
    canManageUsers: false,
    canConfigurePermissions: false,
    canExportBackup: true,
    canImportBackup: false,
    canResetDemoData: false,
  },
  Operador: {
    canViewDashboard: true,
    canViewCalendar: true,
    canViewRequests: true,
    canCreateRequest: true,
    canEditRequest: true,
    canDeleteRequest: true,
    canConcludeRequest: true,
    canCancelRequest: true,
    canManageUsers: false,
    canConfigurePermissions: false,
    canExportBackup: true,
    canImportBackup: true,
    canResetDemoData: true,
  },
  Visualizador: {
    canViewDashboard: true,
    canViewCalendar: true,
    canViewRequests: true,
    canCreateRequest: false,
    canEditRequest: false,
    canDeleteRequest: false,
    canConcludeRequest: false,
    canCancelRequest: false,
    canManageUsers: false,
    canConfigurePermissions: false,
    canExportBackup: true,
    canImportBackup: false,
    canResetDemoData: false,
  },
};

export const PERMISSION_DESCRIPTIONS: Record<PermissionKey, { label: string; desc: string; category: string }> = {
  canViewDashboard: {
    label: 'Visualizar Dashboard e Indicadores',
    desc: 'Permite acompanhar métricas agregadas e estatísticas de prazos judiciais.',
    category: 'Visualização',
  },
  canViewCalendar: {
    label: 'Acessar Calendário Geral',
    desc: 'Permite navegar pelos prazos em visualização mensal, semanal e diária.',
    category: 'Visualização',
  },
  canViewRequests: {
    label: 'Consultar Requisições e Detalhes',
    desc: 'Permite buscar, filtrar e inspecionar os autos das requisições judiciais.',
    category: 'Operacional',
  },
  canCreateRequest: {
    label: 'Cadastrar Novas Requisições',
    desc: 'Permite protocolar novas demandas e prazos no sistema.',
    category: 'Operacional',
  },
  canEditRequest: {
    label: 'Editar Dados de Requisições',
    desc: 'Permite alterar descrição, setor, tipo de exame e datas de prazos.',
    category: 'Operacional',
  },
  canDeleteRequest: {
    label: 'Excluir Requisições',
    desc: 'Permite remover permanentemente registros do sistema com confirmação.',
    category: 'Gestão Crítica',
  },
  canConcludeRequest: {
    label: 'Concluir Laudo e Homologar Prazo',
    desc: 'Permite dar baixa definitiva na requisição com emissão de laudo.',
    category: 'Gestão Pericial',
  },
  canCancelRequest: {
    label: 'Cancelar Requisição Judicial',
    desc: 'Permite revogar requisições por determinação judicial ou perda de objeto.',
    category: 'Gestão Pericial',
  },
  canManageUsers: {
    label: 'Gerenciar Usuários e Perfis',
    desc: 'Permite adicionar, editar contas e alternar atribuições de equipe.',
    category: 'Administração',
  },
  canConfigurePermissions: {
    label: 'Configurar Matriz de Permissões',
    desc: 'Permite alterar regras de controle de acesso entre perfis.',
    category: 'Administração',
  },
  canExportBackup: {
    label: 'Exportar Backup em Arquivo JSON',
    desc: 'Permite baixar cópia completa dos registros para segurança local.',
    category: 'Dados e Sistema',
  },
  canImportBackup: {
    label: 'Importar Backup com Restauração',
    desc: 'Permite carregar e validar arquivos de backup JSON no navegador.',
    category: 'Dados e Sistema',
  },
  canResetDemoData: {
    label: 'Restaurar Dados Padrão de Demonstração',
    desc: 'Permite redefinir os registros locais para a base de exemplo inicial.',
    category: 'Dados e Sistema',
  },
};

export function hasPermission(role: UserRole, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}
