export type NotificationType = 'urgente' | 'alerta' | 'aviso' | 'informativo' | 'sucesso';

export type DeadlineMilestone = '7d' | '3d' | '1d' | 'hoje' | 'vencido' | 'nova_demanda' | 'recebido' | 'conclusao' | 'operacional';

export interface AppNotification {
  id: string;
  chaveUnica: string; // e.g. `${requisicaoId}_${milestone}` para evitar duplicatas
  requisicaoId: string;
  numeroProcesso: string;
  titulo: string;
  mensagem: string;
  tipo: NotificationType;
  marco: DeadlineMilestone;
  categoria?: 'prazo' | 'operacional';
  setor?: string;
  destinatarioUsuarioId?: string;
  lida: boolean;
  criadaEm: string;
  lidaPor?: string;
  lidaEm?: string;
}
