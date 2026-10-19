import {
  JudicialRequest,
  RequestStatus,
  PriorityLevel,
  CalculatedPriorityInfo,
} from '../types/request';

/**
 * Calcula a diferença em dias entre a data do prazo e a data de referência (agora).
 * Arredonda pelo início do dia ou calcula com precisão de horas/dias fracionados.
 */
export function getDaysDifference(targetDate: Date, referenceDate: Date = new Date()): number {
  const diffTime = targetDate.getTime() - referenceDate.getTime();
  // Diferença em dias (arredondada para cima para prazos futuros parciais)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calcula a prioridade sugerida (calculada) e a efetiva de acordo com as regras:
 * - Urgente: Vencido ou vencimento em até 1 dia (<= 1)
 * - Alta: Vencimento em 2 a 3 dias
 * - Média: Vencimento em 4 a 7 dias
 * - Baixa: Vencimento em mais de 7 dias (> 7)
 *
 * Mantém a prioridade manual se definida pelo usuário, documentando ambas claramente.
 */
export function calculatePriority(
  prazoJudicialStr: string,
  status: RequestStatus,
  prioridadeManual?: PriorityLevel | null,
  referenceDate: Date = new Date()
): CalculatedPriorityInfo {
  const prazo = new Date(prazoJudicialStr);
  const now = referenceDate;
  const diffMs = prazo.getTime() - now.getTime();
  const horasRestantes = Math.round(diffMs / (1000 * 60 * 60));
  const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const isVencido = diffMs < 0 && status !== 'Concluído' && status !== 'Cancelado';
  const isHoje = diasRestantes === 0 && !isVencido;

  let prioridadeCalculada: PriorityLevel = 'Baixa';

  if (isVencido || diasRestantes <= 1) {
    prioridadeCalculada = 'Urgente';
  } else if (diasRestantes <= 3) {
    prioridadeCalculada = 'Alta';
  } else if (diasRestantes <= 7) {
    prioridadeCalculada = 'Média';
  } else {
    prioridadeCalculada = 'Baixa';
  }

  // A prioridade efetiva utiliza a classificação manual caso exista,
  // mas preserva e exibe sempre a calculada para conferência
  const prioridadeEfetiva = prioridadeManual || prioridadeCalculada;

  return {
    prioridadeCalculada,
    prioridadeEfetiva,
    diasRestantes,
    horasRestantes,
    isVencido,
    isHoje,
    temPrioridadeManual: !!prioridadeManual,
    prioridadeManual: prioridadeManual || null,
  };
}

/**
 * Atualiza automaticamente o status para 'Vencido' se o prazo expirou,
 * preservando estritamente os status 'Concluído' e 'Cancelado'.
 * Se uma requisição estava 'Vencido' mas o prazo foi prorrogado para o futuro,
 * restaura para 'Pendente' ou 'Em andamento' conforme contexto.
 */
export function syncRequestStatus(
  request: JudicialRequest,
  referenceDate: Date = new Date()
): JudicialRequest {
  // Concluído e Cancelado são imutáveis por data de vencimento
  if (request.status === 'Concluído' || request.status === 'Cancelado') {
    return request;
  }

  const prazo = new Date(request.prazoJudicial);
  const isExpirado = prazo.getTime() < referenceDate.getTime();

  if (isExpirado && request.status !== 'Vencido') {
    const historico = request.historico || [];
    return {
      ...request,
      status: 'Vencido',
      atualizadoEm: new Date().toISOString(),
      historico: [
        ...historico,
        {
          de: request.status,
          para: 'Vencido',
          data: new Date().toISOString(),
          usuario: 'Sistema Automático (PrazoJus)',
          motivo: 'Prazo judicial ultrapassado sem conclusão do laudo',
        },
      ],
    };
  }

  // Se prazo foi adiado para o futuro e ainda estava como Vencido, restaura para Pendente
  if (!isExpirado && request.status === 'Vencido') {
    const historico = request.historico || [];
    return {
      ...request,
      status: 'Pendente',
      atualizadoEm: new Date().toISOString(),
      historico: [
        ...historico,
        {
          de: 'Vencido',
          para: 'Pendente',
          data: new Date().toISOString(),
          usuario: 'Sistema Automático (PrazoJus)',
          motivo: 'Prazo judicial prorrogado para data futura',
        },
      ],
    };
  }

  return request;
}

/**
 * Sincroniza uma lista de requisições inteira
 */
export function syncAllRequestsStatus(
  requests: JudicialRequest[],
  referenceDate: Date = new Date()
): JudicialRequest[] {
  return requests.map((req) => syncRequestStatus(req, referenceDate));
}

/**
 * Formata um texto amigável de contagem regressiva para o prazo
 */
export function formatDeadlineCountdown(
  prazoJudicialStr: string,
  status: RequestStatus,
  referenceDate: Date = new Date()
): { label: string; urgency: 'vencido' | 'hoje' | 'proximo' | 'normal' | 'concluido' } {
  if (status === 'Concluído') {
    return { label: 'Concluído', urgency: 'concluido' };
  }
  if (status === 'Cancelado') {
    return { label: 'Cancelado', urgency: 'normal' };
  }

  const prazo = new Date(prazoJudicialStr);
  const diffMs = prazo.getTime() - referenceDate.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) {
    const diasVencido = Math.abs(diffDays);
    if (diasVencido === 0) {
      return { label: 'Venceu hoje', urgency: 'vencido' };
    }
    return {
      label: `Vencido há ${diasVencido} ${diasVencido === 1 ? 'dia' : 'dias'}`,
      urgency: 'vencido',
    };
  }

  if (diffHours <= 24) {
    if (diffHours <= 0) return { label: 'Vence nas próximas horas', urgency: 'hoje' };
    return { label: `Vence hoje (${diffHours}h restantes)`, urgency: 'hoje' };
  }

  if (diffDays === 1) {
    return { label: 'Vence amanhã', urgency: 'proximo' };
  }

  if (diffDays <= 3) {
    return { label: `Vence em ${diffDays} dias`, urgency: 'proximo' };
  }

  return { label: `Vence em ${diffDays} dias`, urgency: 'normal' };
}

/**
 * Formatação padrão brasileira de datas
 */
export function formatDatePtBR(dateStr: string, includeTime = true): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();

    if (!includeTime) {
      return `${dia}/${mes}/${ano}`;
    }

    const horas = String(d.getHours()).padStart(2, '0');
    const minutos = String(d.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} às ${horas}:${minutos}`;
  } catch {
    return dateStr;
  }
}
