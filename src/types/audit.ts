import { UserRole } from './user';

export type AuditActionType =
  | 'criacao'
  | 'edicao'
  | 'exclusao'
  | 'status'
  | 'documento'
  | 'acesso'
  | 'sistema'
  | 'backup';

export type AuditModule =
  | 'requisicoes'
  | 'usuarios'
  | 'documentos'
  | 'autenticacao'
  | 'backup'
  | 'sistema';

export type AuditOperationStatus = 'sucesso' | 'falha';

export interface AuditDiffField {
  campo: string;
  rotulo: string;
  valorAnterior: string | number | boolean | null | undefined;
  valorNovo: string | number | boolean | null | undefined;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  dataHoraFormatada: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioRole: UserRole;
  usuarioMatricula?: string;
  modulo: AuditModule;
  acao: AuditActionType;
  descricao: string;
  entidadeId?: string;
  entidadeReferencia?: string; // Ex: Processo nº 0712345-89.2026.8.02.0001
  status: AuditOperationStatus;
  motivoFalha?: string;
  detalhes?: AuditDiffField[];
  metadados?: Record<string, any>;
}

export interface AuditFilters {
  busca: string;
  usuarioId: string;
  modulo: string;
  acao: string;
  status: string;
  dataInicio: string;
  dataFim: string;
}
