import {
  AuditLogEntry,
  AuditActionType,
  AuditModule,
  AuditOperationStatus,
  AuditDiffField,
  AuditFilters,
} from '../types/audit';
import { User, UserRole } from '../types/user';
import { StorageService } from './storageService';
import { ApiService } from './apiService';

/**
 * Formata data e hora para o padrão institucional brasileiro (DD/MM/AAAA HH:mm:ss)
 */
export function formatAuditDateTime(dateInput: string | Date = new Date()): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '-';

  const pad = (n: number) => n.toString().padStart(2, '0');
  const dia = pad(d.getDate());
  const mes = pad(d.getMonth() + 1);
  const ano = d.getFullYear();
  const hora = pad(d.getHours());
  const min = pad(d.getMinutes());
  const seg = pad(d.getSeconds());

  return `${dia}/${mes}/${ano} ${hora}:${min}:${seg}`;
}

export interface LogAuditParams {
  usuario?: User | null;
  usuarioId?: string;
  usuarioNome?: string;
  usuarioRole?: UserRole;
  usuarioCpf?: string;
  modulo: AuditModule;
  acao: AuditActionType;
  descricao: string;
  entidadeId?: string;
  entidadeReferencia?: string;
  status?: AuditOperationStatus;
  motivoFalha?: string;
  detalhes?: AuditDiffField[];
  metadados?: Record<string, any>;
}

export const FIELD_LABELS: Record<string, string> = {
  numeroProcesso: 'Nº do Processo',
  descricao: 'Número do Ofício / Requisição de Exame Pericial',
  setorSolicitante: 'Setor Requisitante',
  tipoExame: 'Tipo de Exame',
  prazoJudicial: 'Prazo Estabelecido',
  status: 'Situação Operacional',
  prioridadeManual: 'Prioridade Manual',
  vestigio: 'Vestígio',
  acusadoVitima: 'Partes (Acusado / Vítima)',
  protocolo: 'Protocolo Geral',
  rep: 'Registro de Exame Pericial (REP)',
  origem: 'Origem / Vara Solicitante',
  referencias: 'Referências',
  tipoPrazo: 'Regra de Prazo',
  temPrazoJudicial: 'Possui Prazo Expresso',
  motivoPrazoInterno: 'Justificativa de Prazo',
  anexos: 'Documentos Anexados',
  anexoComprovacao: 'Comprovante de Conclusão',
  anexosComprovacao: 'Comprovantes de Conclusão',
  // Usuários
  nome: 'Nome Completo',
  email: 'E-mail Institucional',
  cargo: 'Cargo',
  departamento: 'Departamento / Lotação',
  role: 'Perfil de Acesso',
  cpf: 'CPF',
  usuarioStatus: 'Status do Usuário',
  setores: 'Setores Responsáveis',
  avatarUrl: 'Foto de Perfil',
};

/**
 * Cria a lista de diferenças entre o estado anterior e o novo estado
 */
export function buildDiff(
  anterior: Record<string, any> | null | undefined,
  novo: Record<string, any> | null | undefined,
  chavesIgnoradas: string[] = ['atualizadoEm', 'criadoEm', 'historico', 'id', 'criadoPor']
): AuditDiffField[] {
  if (!anterior || !novo) return [];

  const diffs: AuditDiffField[] = [];
  const todasChaves = Array.from(new Set([...Object.keys(anterior), ...Object.keys(novo)]));

  for (const chave of todasChaves) {
    if (chavesIgnoradas.includes(chave)) continue;

    const valAnt = anterior[chave];
    const valNovo = novo[chave];

    // Se ambos forem vazios/indefinidos/nulos, não é alteração
    const isEmpty = (v: any) =>
      v === null ||
      v === undefined ||
      v === '' ||
      (Array.isArray(v) && v.length === 0);

    if (isEmpty(valAnt) && isEmpty(valNovo)) continue;

    // Se forem idênticos em stringify, ignora
    if (JSON.stringify(valAnt) === JSON.stringify(valNovo)) continue;

    // Formatador amigável de exibição
    const formatValue = (k: string, v: any): string => {
      if (isEmpty(v)) return '(não definido)';
      if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
      if (k === 'prioridadeManual') return v || '(Automática)';
      if (k === 'tipoPrazo') return v === 'judicial' ? 'Prazo Judicial' : 'Sem Prazo Judicial';

      if (k === 'setores' && Array.isArray(v)) {
        if (v.length === 0) return '(Nenhum setor)';
        return v.join(', ');
      }

      // Anexos de comprovação ou arrays de anexos
      if (k === 'anexoComprovacao' && typeof v === 'object') {
        return v.nome || 'Documento PDF';
      }
      if ((k === 'anexos' || k === 'anexosComprovacao') && Array.isArray(v)) {
        if (v.length === 0) return '(Nenhum documento)';
        return v
          .map((item) => (typeof item === 'object' && item.nome ? item.nome : String(item)))
          .join(', ');
      }

      if (typeof v === 'object') {
        return JSON.stringify(v);
      }
      return String(v);
    };

    const exibicaoAnt = formatValue(chave, valAnt);
    const exibicaoNovo = formatValue(chave, valNovo);

    if (exibicaoAnt === exibicaoNovo) continue;

    diffs.push({
      campo: chave,
      rotulo: FIELD_LABELS[chave] || chave,
      valorAnterior: exibicaoAnt,
      valorNovo: exibicaoNovo,
    });
  }

  return diffs;
}

/**
 * Serviço de Auditoria do PrazoJus
 */
export const AuditService = {
  /**
   * Registra um novo evento no log de auditoria
   */
  log(params: LogAuditParams): AuditLogEntry {
    const now = new Date();

    // Resgata o usuário cadastrado no sistema para obter a matrícula real se não passada
    let userObj = params.usuario;
    if (!userObj && params.usuarioId) {
      try {
        userObj = StorageService.getUsers().find((u) => u.id === params.usuarioId);
      } catch {
        userObj = undefined;
      }
    }

    const usuarioCpf =
      params.usuario?.cpf ||
      params.usuarioCpf ||
      userObj?.cpf ||
      '';

    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now.toISOString(),
      dataHoraFormatada: formatAuditDateTime(now),
      usuarioId: params.usuario?.id || params.usuarioId || userObj?.id || 'system',
      usuarioNome: params.usuario?.nome || params.usuarioNome || userObj?.nome || 'Sistema PrazoJus',
      usuarioRole: params.usuario?.role || params.usuarioRole || userObj?.role || 'Administrador',
      usuarioCpf: usuarioCpf || undefined,
      modulo: params.modulo,
      acao: params.acao,
      descricao: params.descricao,
      entidadeId: params.entidadeId,
      entidadeReferencia: params.entidadeReferencia,
      status: params.status || 'sucesso',
      motivoFalha: params.motivoFalha,
      detalhes: params.detalhes && params.detalhes.length > 0 ? params.detalhes : undefined,
      metadados: params.metadados,
    };

    StorageService.appendAuditLog(entry);
    return entry;
  },

  /**
   * Obtém todos os logs ordenados do mais recente para o mais antigo
   */
  getLogs(): AuditLogEntry[] {
    const logs = StorageService.getAuditLogs();
    return [...logs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  },

  /**
   * Aplica filtros à lista de logs de auditoria
   */
  filterLogs(logs: AuditLogEntry[], filters: AuditFilters): AuditLogEntry[] {
    return logs.filter((log) => {
      // Busca livre
      if (filters.busca.trim()) {
        const query = filters.busca.toLowerCase().trim();
        const matchDesc = log.descricao.toLowerCase().includes(query);
        const matchUser = log.usuarioNome.toLowerCase().includes(query);
        const matchCpf = log.usuarioCpf?.toLowerCase().includes(query) ?? false;
        const matchEntidade = log.entidadeReferencia?.toLowerCase().includes(query) ?? false;
        const matchId = log.id.toLowerCase().includes(query);

        if (!matchDesc && !matchUser && !matchCpf && !matchEntidade && !matchId) {
          return false;
        }
      }

      // Filtro por usuário (por ID ou Nome)
      if (
        filters.usuarioId &&
        log.usuarioId !== filters.usuarioId &&
        log.usuarioNome !== filters.usuarioId
      ) {
        return false;
      }

      // Filtro por módulo
      if (filters.modulo && log.modulo !== filters.modulo) {
        return false;
      }

      // Filtro por ação
      if (filters.acao && log.acao !== filters.acao) {
        return false;
      }

      // Filtro por status (sucesso / falha)
      if (filters.status && log.status !== filters.status) {
        return false;
      }

      // Filtro por período de datas
      if (filters.dataInicio) {
        const dLog = log.timestamp.slice(0, 10);
        if (dLog < filters.dataInicio) return false;
      }

      if (filters.dataFim) {
        const dLog = log.timestamp.slice(0, 10);
        if (dLog > filters.dataFim) return false;
      }

      return true;
    });
  },

  /**
   * Exporta a lista de logs em formato JSON
   */
  exportToJSON(logs: AuditLogEntry[]): void {
    const payload = {
      sistema: 'PrazoJus - Polícia Científica de Alagoas',
      finalidade: 'Relatório Oficial de Auditoria e Rastreabilidade de Operações',
      exportadoEm: new Date().toISOString(),
      totalRegistros: logs.length,
      logs,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const nowStr = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    link.href = url;
    link.download = `prazojus_auditoria_${nowStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Exporta a lista de logs em formato CSV (compatível com Excel em português - delimitado por ponto e vírgula)
   */
  exportToCSV(logs: AuditLogEntry[]): void {
    const cabecalho = [
      'ID Registro',
      'Data e Hora',
      'Usuário',
      'CPF',
      'Perfil',
      'Módulo',
      'Ação',
      'Status',
      'Referência',
      'Descrição da Operação',
      'Motivo da Falha',
    ];

    const linhas = logs.map((log) => [
      `"${log.id}"`,
      `"${log.dataHoraFormatada}"`,
      `"${log.usuarioNome.replace(/"/g, '""')}"`,
      `"${log.usuarioCpf || '-'}"`,
      `"${log.usuarioRole}"`,
      `"${log.modulo}"`,
      `"${log.acao}"`,
      `"${log.status.toUpperCase()}"`,
      `"${(log.entidadeReferencia || '-').replace(/"/g, '""')}"`,
      `"${log.descricao.replace(/"/g, '""')}"`,
      `"${(log.motivoFalha || '-').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [cabecalho.join(';'), ...linhas.map((l) => l.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const nowStr = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    link.href = url;
    link.download = `prazojus_auditoria_${nowStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Limpa todos os logs de auditoria mediante autenticação com senha do Administrador
   */
  async clearAllLogs(adminUser: User, password: string): Promise<{ success: boolean; error?: string }> {
    if (adminUser.role !== 'Administrador') {
      return { success: false, error: 'Apenas Administradores têm permissão para expurgar logs de auditoria.' };
    }

    if (!password || !password.trim()) {
      return { success: false, error: 'Informe sua senha de acesso para autorizar a limpeza.' };
    }

    try {
      const apiResult = await ApiService.clearAuditLogs(adminUser.id, password);

      if (!apiResult.success) {
        this.log({
          usuario: adminUser,
          modulo: 'sistema',
          acao: 'exclusao',
          descricao: `Tentativa não autorizada de limpeza de registros de auditoria pelo usuário ${adminUser.nome}.`,
          status: 'falha',
          motivoFalha: apiResult.error || 'Senha incorreta',
        });
        return { success: false, error: apiResult.error || 'Senha incorreta.' };
      }

      // Limpa no armazenamento local
      StorageService.clearAuditLogs();

      // Grava o log inaugural garantindo a cadeia de custódia
      this.log({
        usuario: adminUser,
        modulo: 'sistema',
        acao: 'exclusao',
        descricao: `Limpeza geral dos registros de auditoria autorizada e realizada pelo Administrador ${adminUser.nome} sob validação de senha.`,
        status: 'sucesso',
      });

      return { success: true };
    } catch {
      return { success: false, error: 'Erro inesperado ao processar a limpeza da auditoria.' };
    }
  },
};
