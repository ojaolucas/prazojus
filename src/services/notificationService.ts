import { AppNotification, DeadlineMilestone } from '../types/notification';
import { JudicialRequest } from '../types/request';
import { formatDatePtBR } from './deadlineService';

/**
 * Gera notificações para marcos temporais relevantes de cada requisição ativa:
 * - 7 dias antes
 * - 3 dias antes
 * - 1 dia antes
 * - No dia do vencimento (0 dias)
 * - Após o vencimento (vencido)
 *
 * Utiliza chave determinística `${req.id}_${milestone}` para evitar duplicatas,
 * preservando o status de lida das notificações preexistentes.
 */
export function generateNotificationsFromRequests(
  requests: JudicialRequest[],
  existingNotifications: AppNotification[] = [],
  referenceDate: Date = new Date()
): AppNotification[] {
  const existingMap = new Map<string, AppNotification>();
  existingNotifications.forEach((n) => existingMap.set(n.chaveUnica, n));

  const generated: AppNotification[] = [];

  for (const req of requests) {
    // Não gerar notificações de prazo para itens já Concluídos ou Cancelados
    if (req.status === 'Concluído' || req.status === 'Cancelado') {
      continue;
    }

    const prazo = new Date(req.prazoJudicial);
    const diffMs = prazo.getTime() - referenceDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Determina quais marcos se aplicam a esta requisição no momento atual
    const applicableMilestones: {
      milestone: DeadlineMilestone;
      titulo: string;
      mensagem: string;
      tipo: 'urgente' | 'alerta' | 'aviso' | 'informativo';
    }[] = [];

    if (diffMs < 0) {
      const diasVencido = Math.abs(diffDays);
      applicableMilestones.push({
        milestone: 'vencido',
        titulo: `Prazo Vencido: Proc. ${req.numeroProcesso}`,
        mensagem: `O prazo judicial expirou em ${formatDatePtBR(req.prazoJudicial)}. Requisição pendente de laudo pericial para ${req.setorSolicitante}.`,
        tipo: 'urgente',
      });
    } else if (diffDays === 0) {
      applicableMilestones.push({
        milestone: 'hoje',
        titulo: `Vence Hoje: Proc. ${req.numeroProcesso}`,
        mensagem: `Atenção: O prazo judicial para '${req.tipoExame}' se encerra hoje às ${new Date(req.prazoJudicial).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`,
        tipo: 'urgente',
      });
    } else if (diffDays === 1) {
      applicableMilestones.push({
        milestone: '1d',
        titulo: `Vence Amanhã: Proc. ${req.numeroProcesso}`,
        mensagem: `Falta 1 dia para o encerramento do prazo judicial (${formatDatePtBR(req.prazoJudicial)}). Setor: ${req.setorSolicitante}.`,
        tipo: 'alerta',
      });
    } else if (diffDays <= 3) {
      applicableMilestones.push({
        milestone: '3d',
        titulo: `Prazo em 3 dias: Proc. ${req.numeroProcesso}`,
        mensagem: `Vencimento próximo em ${diffDays} dias para exame de ${req.tipoExame}. Providencie a conclusão das perícias.`,
        tipo: 'alerta',
      });
    } else if (diffDays <= 7) {
      applicableMilestones.push({
        milestone: '7d',
        titulo: `Prazo em 7 dias: Proc. ${req.numeroProcesso}`,
        mensagem: `Prazo judicial para ${req.setorSolicitante} vence em ${diffDays} dias (${formatDatePtBR(req.prazoJudicial)}).`,
        tipo: 'aviso',
      });
    }

    for (const item of applicableMilestones) {
      const key = `${req.id}_${item.milestone}`;
      const preExisting = existingMap.get(key);

      if (preExisting) {
        // Mantém a notificação preexistente preservando se o usuário já marcou como lida
        generated.push(preExisting);
      } else {
        // Cria nova notificação
        generated.push({
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          chaveUnica: key,
          requisicaoId: req.id,
          numeroProcesso: req.numeroProcesso,
          titulo: item.titulo,
          mensagem: item.mensagem,
          tipo: item.tipo,
          marco: item.milestone,
          categoria: 'prazo',
          setor: req.setorSolicitante,
          lida: false,
          criadaEm: new Date().toISOString(),
        });
      }
    }
  }

  // Preserva todas as notificações operacionais preexistentes (atribuições, recebimentos de setor, etc.)
  existingNotifications.forEach((n) => {
    if (n.categoria === 'operacional' && !generated.some((g) => g.id === n.id)) {
      generated.push(n);
    }
  });

  // Ordena por data decrescente (mais recentes primeiro) e não lidas no topo
  return generated.sort((a, b) => {
    if (a.lida !== b.lida) {
      return a.lida ? 1 : -1;
    }
    return new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime();
  });
}
