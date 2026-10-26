import { PermissionMatrix, PermissionKey, UserRole, User } from '../types/user';
import { SETORES_SOLICITANTES } from '../data/constants';

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
    canViewAudit: true,
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
    canViewAudit: true,
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
    canViewAudit: false,
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
    canViewAudit: false,
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
  canViewAudit: {
    label: 'Consultar Módulo de Auditoria e Logs',
    desc: 'Permite inspecionar o histórico completo de ações, alterações de status e rastreabilidade.',
    category: 'Segurança e Auditoria',
  },
};

export function hasPermission(role: UserRole, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}

/**
 * Retorna os setores periciais aos quais o usuário tem permissão de acesso.
 * O Administrador possui acesso irrestrito a todos os setores cadastrados no sistema.
 */
export function getUserAllowedSectors(user?: User | null): string[] {
  if (!user) return [];
  if (user.role === 'Administrador') {
    return SETORES_SOLICITANTES;
  }
  return user.setores && user.setores.length > 0 ? user.setores : [];
}

/**
 * Verifica se o usuário tem permissão para acessar um determinado setor.
 * O Administrador possui acesso total a qualquer setor.
 */
export function userCanAccessSector(user?: User | null, sector?: string | null): boolean {
  if (!user) return false;
  if (user.role === 'Administrador') return true;
  if (!sector) return false;
  const allowed = user.setores || [];
  return allowed.includes(sector);
}

/**
 * Validação rigorosa combinando Nível de Acesso (Perfil) + Setores Atribuídos.
 * Regra principal: A seleção de um setor não concede privilégios superiores
 * aos definidos pelo perfil de acesso.
 */
export function checkUserSectorAndRolePermission(
  user: User,
  sector: string,
  action: 'view' | 'create' | 'edit' | 'delete' | 'conclude' | 'cancel'
): { allowed: boolean; reason?: string } {
  // 1. Administrador tem acesso global irrestrito
  if (user.role === 'Administrador') {
    return { allowed: true };
  }

  // 2. Validação de Setores Atribuídos
  const userSectors = user.setores || [];
  if (userSectors.length === 0) {
    return {
      allowed: false,
      reason: 'Usuário sem setor atribuído. Acesso operacional bloqueado até vinculação pelo Administrador.',
    };
  }

  if (!userSectors.includes(sector)) {
    return {
      allowed: false,
      reason: `Você não possui atribuição ao setor "${sector}". Operação restrita aos seus setores responsáveis.`,
    };
  }

  // 3. Validação do Perfil de Acesso Geral (Matriz de Permissões)
  const actionPermissionMap: Record<typeof action, PermissionKey> = {
    view: 'canViewRequests',
    create: 'canCreateRequest',
    edit: 'canEditRequest',
    delete: 'canDeleteRequest',
    conclude: 'canConcludeRequest',
    cancel: 'canCancelRequest',
  };

  const requiredPerm = actionPermissionMap[action];
  if (requiredPerm && !hasPermission(user.role, requiredPerm)) {
    return {
      allowed: false,
      reason: `Seu perfil de acesso (${user.role}) não possui privilégios para executar esta ação (${action}).`,
    };
  }

  return { allowed: true };
}
