export type RequestStatus =
  | 'Pendente'
  | 'Em andamento'
  | 'Concluído'
  | 'Vencido'
  | 'Cancelado'
  | 'Aguardando informações';

export type PriorityLevel = 'Baixa' | 'Média' | 'Alta' | 'Urgente';

export interface StatusHistoryEntry {
  de: RequestStatus;
  para: RequestStatus;
  data: string;
  usuario: string;
  motivo?: string;
}

export interface JudicialRequest {
  id: string;
  // Campos obrigatórios
  numeroProcesso: string;
  descricao: string;
  setorSolicitante: string;
  prazoJudicial: string; // ISO string 'YYYY-MM-DDTHH:mm:ss'
  tipoExame: string;

  // Campos opcionais
  vestigio?: string;
  acusadoVitima?: string;
  protocolo?: string;
  rep?: string;
  origem?: string;
  referencias?: string;

  // Status e Prioridade
  status: RequestStatus;
  prioridadeManual?: PriorityLevel | null;

  // Metadados
  criadoEm: string;
  atualizadoEm: string;
  criadoPor: string;
  historico?: StatusHistoryEntry[];
}

export interface RequestFilters {
  busca: string;
  setor: string;
  tipoExame: string;
  origem: string;
  status: string;
  prioridade: string;
}

export interface CalculatedPriorityInfo {
  prioridadeCalculada: PriorityLevel;
  prioridadeEfetiva: PriorityLevel;
  diasRestantes: number;
  horasRestantes: number;
  isVencido: boolean;
  isHoje: boolean;
  temPrioridadeManual: boolean;
  prioridadeManual: PriorityLevel | null;
}
