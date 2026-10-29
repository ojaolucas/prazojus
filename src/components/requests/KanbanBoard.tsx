import React, { useState, useMemo } from 'react';
import { JudicialRequest, OperationalStatus, RequestAttachment } from '../../types/request';
import { useAuth } from '../../context/AuthContext';
import { useRequests } from '../../context/RequestContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import { formatDatePtBR, formatDeadlineCountdown, isRequestPrazoIndefinido } from '../../services/deadlineService';
import { ConfirmDialog } from '../layout/ConfirmDialog';
import { Modal } from '../layout/Modal';
import { ProofAttachmentUpload } from './ProofAttachmentUpload';
import { PdfPreviewModal } from './PdfPreviewModal';
import {
  Inbox,
  Microscope,
  CheckCircle2,
  Clock,
  Building2,
  FileText,
  AlertCircle,
  AlertTriangle,
  Handshake,
  RotateCcw,
  MoreVertical,
  ExternalLink,
  Edit,
  UserCheck,
  Filter,
} from 'lucide-react';

interface KanbanBoardProps {
  requests: JudicialRequest[];
  onOpenDetail: (req: JudicialRequest) => void;
  onOpenEdit: (req: JudicialRequest) => void;
}

type KanbanColumnId = 'aguardando' | 'emExecucao' | 'concluidas';

interface ColumnDef {
  id: KanbanColumnId;
  targetStatus: OperationalStatus;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: {
    bg: string;
    border: string;
    headerBg: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    dropHighlight: string;
  };
}

const COLUMNS: ColumnDef[] = [
  {
    id: 'aguardando',
    targetStatus: 'Aguardando recebimento',
    title: 'Aguardando Recebimento',
    subtitle: 'Fila de entrada do setor (triadas pelo Administrador)',
    icon: Inbox,
    color: {
      bg: 'bg-amber-50/40',
      border: 'border-amber-200/90',
      headerBg: 'bg-amber-100/70 text-amber-800',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-900',
      badgeBorder: 'border-amber-300',
      dropHighlight: 'border-amber-500 bg-amber-50/70 ring-4 ring-amber-200/60',
    },
  },
  {
    id: 'emExecucao',
    targetStatus: 'Em andamento',
    title: 'Em Execução',
    subtitle: 'Demandas assumidas pelo perito e em andamento técnico',
    icon: Microscope,
    color: {
      bg: 'bg-indigo-50/40',
      border: 'border-indigo-200/90',
      headerBg: 'bg-indigo-100/70 text-indigo-800',
      badgeBg: 'bg-indigo-100',
      badgeText: 'text-indigo-900',
      badgeBorder: 'border-indigo-300',
      dropHighlight: 'border-indigo-500 bg-indigo-50/70 ring-4 ring-indigo-200/60',
    },
  },
  {
    id: 'concluidas',
    targetStatus: 'Concluído',
    title: 'Concluídas',
    subtitle: 'Laudos periciais finalizados e homologados',
    icon: CheckCircle2,
    color: {
      bg: 'bg-emerald-50/40',
      border: 'border-emerald-200/90',
      headerBg: 'bg-emerald-100/70 text-emerald-800',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-900',
      badgeBorder: 'border-emerald-300',
      dropHighlight: 'border-emerald-500 bg-emerald-50/70 ring-4 ring-emerald-200/60',
    },
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  requests,
  onOpenDetail,
  onOpenEdit,
}) => {
  const { currentUser, can } = useAuth();
  const {
    receiveRequest,
    concludeOperationalRequest,
    reopenOperationalRequest,
  } = useRequests();
  const { warning, error } = useToast();

  // Drag and Drop States
  const [draggedRequestId, setDraggedRequestId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<KanbanColumnId | null>(null);

  // Filtro de tempo para a coluna Concluídas (evita lista infinita no Kanban)
  const [concludedFilter, setConcludedFilter] = useState<'recentes' | 'todas'>('recentes');

  // Modais de Ação e Confirmação
  const [requestToReceive, setRequestToReceive] = useState<JudicialRequest | null>(null);

  // Modal oficial de conclusão com anexo de comprovante / laudo em PDF
  const [requestToConclude, setRequestToConclude] = useState<JudicialRequest | null>(null);
  const [proofAttachments, setProofAttachments] = useState<RequestAttachment[]>([]);
  const [proofError, setProofError] = useState<string>('');
  const [concludeMotivo, setConcludeMotivo] = useState<string>('');
  const [previewAttachment, setPreviewAttachment] = useState<RequestAttachment | null>(null);

  // Modal de reabertura com justificativa formal
  const [requestToReopen, setRequestToReopen] = useState<JudicialRequest | null>(null);
  const [reopenMotivo, setReopenMotivo] = useState<string>('');

  // Menu acessível "Mover para..."
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Tab ativa no modo mobile
  const [activeMobileColumn, setActiveMobileColumn] = useState<KanbanColumnId>('emExecucao');

  // Agrupamento dos cartões nas 3 colunas Kanban
  const allConcludedRequests = useMemo(() => {
    return requests.filter(
      (req) => req.statusOperacional === 'Concluído' || req.status === 'Concluído'
    );
  }, [requests]);

  const columnData = useMemo(() => {
    const map: Record<KanbanColumnId, JudicialRequest[]> = {
      aguardando: [],
      emExecucao: [],
      concluidas: [],
    };

    const now = new Date().getTime();
    const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;

    requests.forEach((req) => {
      if (req.statusOperacional === 'Concluído' || req.status === 'Concluído') {
        // Se filtro for 'recentes', mostra concluídas nos últimos 15 dias (ou as últimas 10)
        if (concludedFilter === 'recentes') {
          const concDate = req.dataConclusaoOperacional
            ? new Date(req.dataConclusaoOperacional).getTime()
            : req.atualizadoEm
            ? new Date(req.atualizadoEm).getTime()
            : 0;

          const isRecent = concDate > 0 && now - concDate <= fifteenDaysMs;
          if (isRecent || map.concluidas.length < 5) {
            map.concluidas.push(req);
          }
        } else {
          map.concluidas.push(req);
        }
      } else if (
        req.statusOperacional === 'Em andamento' ||
        req.statusOperacional === 'Recebido' ||
        Boolean(req.responsavelOperacionalId)
      ) {
        map.emExecucao.push(req);
      } else {
        // Aguardando recebimento
        map.aguardando.push(req);
      }
    });

    return map;
  }, [requests, concludedFilter]);

  // Métricas por coluna (vencidas, urgentes, pendentes de cadastro)
  const columnMetrics = useMemo(() => {
    const result: Record<
      KanbanColumnId,
      { total: number; vencidas: number; urgentes: number; dadosPendentes: number }
    > = {
      aguardando: { total: 0, vencidas: 0, urgentes: 0, dadosPendentes: 0 },
      emExecucao: { total: 0, vencidas: 0, urgentes: 0, dadosPendentes: 0 },
      concluidas: { total: allConcludedRequests.length, vencidas: 0, urgentes: 0, dadosPendentes: 0 },
    };

    (Object.keys(columnData) as KanbanColumnId[]).forEach((colId) => {
      const list = colId === 'concluidas' ? allConcludedRequests : columnData[colId];
      let vencidas = 0;
      let urgentes = 0;
      let dadosPendentes = 0;

      list.forEach((r) => {
        const prazoDate = new Date(r.prazoJudicial);
        const diffMs = prazoDate.getTime() - new Date().getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (r.status === 'Vencido' || (diffMs < 0 && r.status !== 'Concluído')) {
          vencidas++;
        } else if (diffDays <= 5 && r.status !== 'Concluído') {
          urgentes++;
        }

        if (!r.cadastroCompleto) dadosPendentes++;
      });

      result[colId] = {
        total: list.length,
        vencidas,
        urgentes,
        dadosPendentes,
      };
    });

    return result;
  }, [columnData, allConcludedRequests]);

  // Helper de permissão
  const hasSectorPermission = (req: JudicialRequest): boolean => {
    if (currentUser.role === 'Administrador') return true;
    return (currentUser.setores || []).includes(req.setorSolicitante);
  };

  // ==========================================
  // LÓGICA DE TRANSIÇÃO E MOVIMENTAÇÃO
  // ==========================================
  const executeMove = (req: JudicialRequest, targetColumn: KanbanColumnId) => {
    const isCurrentlyConcluded = req.statusOperacional === 'Concluído' || req.status === 'Concluído';
    const isCurrentlyInExecution =
      req.statusOperacional === 'Em andamento' ||
      req.statusOperacional === 'Recebido' ||
      Boolean(req.responsavelOperacionalId);
    const isCurrentlyAwaiting = !isCurrentlyConcluded && !isCurrentlyInExecution;

    // Mesma coluna: ignora
    if (
      (targetColumn === 'aguardando' && isCurrentlyAwaiting) ||
      (targetColumn === 'emExecucao' && isCurrentlyInExecution) ||
      (targetColumn === 'concluidas' && isCurrentlyConcluded)
    ) {
      return;
    }

    // Permissão de setor
    if (!hasSectorPermission(req)) {
      error(
        'Movimento Não Permitido',
        `Você não possui permissão para atuar nas demandas do setor "${req.setorSolicitante}".`
      );
      return;
    }

    // 1. Destino: "Aguardando Recebimento" (Devolução para fila)
    if (targetColumn === 'aguardando') {
      if (isCurrentlyConcluded) {
        error(
          'Ação Não Permitida',
          'Demandas já concluídas não podem ser enviadas diretamente para a Fila de Entrada. Reabra primeiro para Em Execução.'
        );
        return;
      }

      if (currentUser.role !== 'Administrador') {
        error(
          'Acesso Restrito',
          'Apenas o Administrador pode devolver uma demanda em execução de volta para a fila geral do setor.'
        );
        return;
      }

      reopenOperationalRequest(
        req.id,
        'Em andamento',
        'Devolução administrativa da demanda para a fila de espera'
      );
      return;
    }

    // 2. Destino: "Em Execução" (Assumir e Iniciar)
    if (targetColumn === 'emExecucao') {
      if (isCurrentlyConcluded) {
        setRequestToReopen(req);
        setReopenMotivo('');
        return;
      }

      if (isCurrentlyAwaiting) {
        // Exige confirmação explícita para assumir e iniciar
        setRequestToReceive(req);
        return;
      }
    }

    // 3. Destino: "Concluídas"
    if (targetColumn === 'concluidas') {
      if (!can('canConcludeRequest')) {
        error(
          'Acesso Restrito',
          'Seu perfil de acesso não possui permissão para homologar e concluir demandas periciais.'
        );
        return;
      }

      if (isCurrentlyAwaiting) {
        warning(
          'Transição Inválida',
          'A demanda precisa ser recebida e executada pelo perito antes de ser concluída.'
        );
        return;
      }

      // Preenche os anexos já existentes na requisição, se houver
      const existing = req.anexosComprovacao && req.anexosComprovacao.length > 0
        ? [...req.anexosComprovacao]
        : req.anexoComprovacao
        ? [req.anexoComprovacao]
        : [];

      setRequestToConclude(req);
      setProofAttachments(existing);
      setProofError('');
      setConcludeMotivo('');
      return;
    }
  };

  // ==========================================
  // HANDLERS DRAG & DROP HTML5
  // ==========================================
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, req: JudicialRequest) => {
    e.dataTransfer.setData('text/plain', req.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedRequestId(req.id);
  };

  const handleDragEnd = () => {
    setDraggedRequestId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, columnId: KanbanColumnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, columnId: KanbanColumnId) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetColumn: KanbanColumnId) => {
    e.preventDefault();
    setDragOverColumn(null);
    const reqId = e.dataTransfer.getData('text/plain') || draggedRequestId;
    setDraggedRequestId(null);

    if (!reqId) return;
    const req = requests.find((r) => r.id === reqId);
    if (!req) return;

    executeMove(req, targetColumn);
  };

  // ==========================================
  // RENDERIZAÇÃO DO CARTÃO
  // ==========================================
  const renderCard = (req: JudicialRequest, columnId: KanbanColumnId) => {
    const isPrazoIndefinido = isRequestPrazoIndefinido(req);
    const countdown = formatDeadlineCountdown(req.prazoJudicial, req.status, new Date(), isPrazoIndefinido);
    const prazoDate = new Date(req.prazoJudicial);
    const diffMs = prazoDate.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const isVencido = !isPrazoIndefinido && (req.status === 'Vencido' || (diffMs < 0 && req.status !== 'Concluído'));

    const countdownColorClass =
      isPrazoIndefinido
        ? 'text-slate-600 bg-slate-100 border-slate-200 font-medium'
        : req.status === 'Concluído'
        ? 'text-emerald-700 bg-emerald-50 border-emerald-200/90'
        : isVencido
        ? 'text-red-700 bg-red-50 border-red-300 font-black'
        : diffDays <= 5
        ? 'text-red-700 bg-red-50 border-red-200/90 font-bold'
        : diffDays <= 15
        ? 'text-amber-800 bg-amber-50 border-amber-200/90'
        : diffDays <= 30
        ? 'text-blue-700 bg-blue-50 border-blue-200/90'
        : 'text-slate-600 bg-slate-50 border-slate-200';

    const isDragging = draggedRequestId === req.id;
    const isMenuOpen = openActionMenuId === req.id;

    return (
      <div
        key={req.id}
        draggable={true}
        onDragStart={(e) => handleDragStart(e, req)}
        onDragEnd={handleDragEnd}
        onClick={() => onOpenDetail(req)}
        className={`p-3.5 bg-white rounded-xl border transition-all cursor-grab active:cursor-grabbing space-y-2.5 relative group shadow-2xs ${
          isDragging
            ? 'opacity-40 ring-2 ring-indigo-500 scale-98 border-indigo-400'
            : isVencido
            ? 'border-red-300/80 hover:border-red-500 hover:shadow-xs bg-red-50/10'
            : 'border-slate-200/90 hover:border-blue-400 hover:shadow-xs'
        }`}
      >
        {/* Linha Superior: Processo e Badges */}
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <span className="font-bold text-slate-900 group-hover:text-blue-600 font-mono text-xs block truncate tracking-tight">
              {req.numeroProcesso}
            </span>
            {req.descricao && (
              <span className="text-[10.5px] font-mono text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">Ofício: {req.descricao}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <StatusBadge status={req.status} size="sm" />

            {/* Menu Acessível Mover Para */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenActionMenuId(isMenuOpen ? null : req.id);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                title="Opções de movimentação do cartão"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {isMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-30 text-xs animate-fade-in divide-y divide-slate-100"
                >
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Mover cartão para:
                  </div>

                  <div className="py-1">
                    {columnId !== 'aguardando' && currentUser.role === 'Administrador' && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenActionMenuId(null);
                          executeMove(req, 'aguardando');
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-amber-50 text-amber-900 flex items-center gap-2"
                      >
                        <Inbox className="w-3.5 h-3.5 text-amber-600" />
                        Fila de Entrada
                      </button>
                    )}

                    {columnId !== 'emExecucao' && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenActionMenuId(null);
                          executeMove(req, 'emExecucao');
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-indigo-50 text-indigo-900 flex items-center gap-2"
                      >
                        <Microscope className="w-3.5 h-3.5 text-indigo-600" />
                        {columnId === 'aguardando' ? 'Receber e Iniciar' : 'Reabrir para Execução'}
                      </button>
                    )}

                    {columnId !== 'concluidas' && can('canConcludeRequest') && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenActionMenuId(null);
                          executeMove(req, 'concluidas');
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 text-emerald-900 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Concluir com Laudo
                      </button>
                    )}
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenActionMenuId(null);
                        onOpenDetail(req);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      Ver Detalhes Completos
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tipo de Exame e Setor */}
        <div>
          <div className="font-semibold text-slate-800 text-xs line-clamp-1" title={req.tipoExame}>
            {req.tipoExame}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{req.setorSolicitante}</span>
          </div>
        </div>

        {/* Badges de Prioridade e Completude Cadastral */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <PriorityBadge
            prazoJudicial={req.prazoJudicial}
            status={req.status}
            prioridadeManual={req.prioridadeManual}
          />

          {req.cadastroCompleto ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70 font-semibold">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
              Cadastro Completo
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300 font-semibold"
              title="Campos técnicos complementares pendentes de preenchimento"
            >
              <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
              Dados Pendentes
            </span>
          )}

          {isVencido && (
            <span className="inline-flex items-center gap-1 text-[10px] text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-300 font-bold">
              <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
              Vencido
            </span>
          )}
        </div>

        {/* Prazo Limite e Contagem Regressiva */}
        <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100">
          {isPrazoIndefinido ? (
            <>
              <div className="flex items-center gap-1 font-sans text-slate-600 font-medium italic">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span>A definir pelo setor</span>
              </div>
              <div className="px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-slate-100 text-slate-600 border-slate-200">
                Aguardando preenchimento
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1 font-mono text-slate-700 font-semibold">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{formatDatePtBR(req.prazoJudicial)}</span>
              </div>
              <div className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${countdownColorClass}`}>
                {countdown.label}
              </div>
            </>
          )}
        </div>

        {/* Rodapé: Perito Responsável e Ações Diretas */}
        <div className="flex items-center justify-between pt-1 text-[11px] border-t border-slate-50">
          <span className="text-slate-500 truncate max-w-[140px] flex items-center gap-1 text-[11px]">
            <UserCheck className="w-3 h-3 text-blue-500 shrink-0" />
            <span className="truncate" title={req.responsavelOperacionalNome || 'Fila do Setor'}>
              {req.responsavelOperacionalNome || 'Fila do Setor'}
            </span>
          </span>

          <div className="flex items-center gap-1 shrink-0">
            {columnId === 'aguardando' && hasSectorPermission(req) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setRequestToReceive(req);
                }}
                className="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-2xs transition-colors flex items-center gap-1"
                title="Assumir responsabilidade técnica e iniciar execução"
              >
                <Handshake className="w-3 h-3" />
                Receber
              </button>
            )}

            {columnId === 'emExecucao' && (
              <>
                {!req.cadastroCompleto && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEdit(req);
                    }}
                    className="px-2 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-md transition-colors flex items-center gap-1"
                    title="Preencher dados técnicos complementares"
                  >
                    <Edit className="w-3 h-3 text-amber-700" />
                    Preencher
                  </button>
                )}
                {can('canConcludeRequest') && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const existing = req.anexosComprovacao && req.anexosComprovacao.length > 0
                        ? [...req.anexosComprovacao]
                        : req.anexoComprovacao
                        ? [req.anexoComprovacao]
                        : [];
                      setRequestToConclude(req);
                      setProofAttachments(existing);
                      setProofError('');
                      setConcludeMotivo('');
                    }}
                    className="px-2 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-2xs transition-colors flex items-center gap-1"
                    title="Homologar e concluir laudo pericial anexando o PDF"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Concluir
                  </button>
                )}
              </>
            )}

            {columnId === 'concluidas' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                Laudo Concluído
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Navegação Mobile por Abas de Coluna */}
      <div className="md:hidden flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto border border-slate-200">
        {COLUMNS.map((col) => {
          const metrics = columnMetrics[col.id];
          const isActive = activeMobileColumn === col.id;
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setActiveMobileColumn(col.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                isActive ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{col.title}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {metrics.total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grade de 3 Colunas Kanban (Desktop espaçosa de 3 colunas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {COLUMNS.map((col) => {
          const metrics = columnMetrics[col.id];
          const cards = columnData[col.id];
          const isOver = dragOverColumn === col.id;
          const Icon = col.icon;

          const isVisibleOnMobile = activeMobileColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={(e) => handleDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`rounded-2xl p-4 border transition-all duration-200 space-y-3.5 shadow-2xs ${
                col.color.bg
              } ${isOver ? col.color.dropHighlight : col.color.border} ${
                isVisibleOnMobile ? 'block' : 'hidden md:block'
              }`}
            >
              {/* Cabeçalho da Coluna */}
              <div className="space-y-1.5 px-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg ${col.color.headerBg}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {col.title}
                    </h3>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 text-xs font-black rounded-full font-mono border ${col.color.badgeBg} ${col.color.badgeText} ${col.color.badgeBorder}`}
                  >
                    {metrics.total}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-tight">{col.subtitle}</p>

                {/* Chips de Destaque */}
                <div className="flex items-center justify-between gap-1.5 flex-wrap pt-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {metrics.vencidas > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
                        {metrics.vencidas} vencida{metrics.vencidas > 1 ? 's' : ''}
                      </span>
                    )}
                    {metrics.urgentes > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-amber-600" />
                        {metrics.urgentes} urgente{metrics.urgentes > 1 ? 's' : ''}
                      </span>
                    )}
                    {metrics.dadosPendentes > 0 && col.id !== 'concluidas' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                        {metrics.dadosPendentes} pendente{metrics.dadosPendentes > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Controle de visualização na coluna Concluídas (evita lista extensa) */}
                  {col.id === 'concluidas' && allConcludedRequests.length > 5 && (
                    <button
                      type="button"
                      onClick={() =>
                        setConcludedFilter((prev) => (prev === 'recentes' ? 'todas' : 'recentes'))
                      }
                      className="text-[10px] font-semibold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1"
                      title="Alternar entre recentes e todas as concluídas"
                    >
                      <Filter className="w-2.5 h-2.5" />
                      {concludedFilter === 'recentes'
                        ? `Recentes (${cards.length}) • Ver todas`
                        : `Exibindo todas (${cards.length})`}
                    </button>
                  )}
                </div>
              </div>

              {/* Zona de Drop e Cartões */}
              <div className="space-y-2.5 min-h-[260px]">
                {cards.length === 0 ? (
                  <div className="py-14 px-3 text-center rounded-xl border border-dashed border-slate-300/80 bg-white/60 text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5">
                    <Icon className="w-6 h-6 text-slate-300" />
                    <span>Nenhuma demanda nesta etapa</span>
                    <span className="text-[10px] text-slate-400">
                      Arraste um cartão ou use o menu de ações
                    </span>
                  </div>
                ) : (
                  cards.map((req) => renderCard(req, col.id))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* DIÁLOGO: ASSUMIR E INICIAR EXAME PERICIAL                      */}
      {/* ============================================================== */}
      {requestToReceive && (
        <ConfirmDialog
          isOpen={Boolean(requestToReceive)}
          onClose={() => setRequestToReceive(null)}
          onConfirm={() => {
            if (requestToReceive) {
              const target = requestToReceive;
              const ok = receiveRequest(target.id);
              setRequestToReceive(null);
              if (ok) {
                // Abre imediatamente o modal de preenchimento completo!
                onOpenEdit({
                  ...target,
                  statusOperacional: 'Em andamento',
                  responsavelOperacionalId: currentUser.id,
                  responsavelOperacionalNome: currentUser.nome,
                  dataRecebimentoOperacional: new Date().toISOString(),
                  dataIniciadoOperacional: new Date().toISOString(),
                });
              }
            }
          }}
          title="Receber Demanda Pericial"
          message={`Deseja assumir formalmente a responsabilidade técnica e iniciar os trabalhos no Processo nº "${requestToReceive.numeroProcesso}" no setor de ${requestToReceive.setorSolicitante}? Ao confirmar, seu usuário (${currentUser.nome}) será registrado, a demanda passará para "Em Execução" e o formulário abrirá para preenchimento dos dados complementares.`}
          confirmLabel="Sim, Receber"
          cancelLabel="Cancelar"
          iconType="question"
        />
      )}

      {/* ============================================================== */}
      {/* MODAL OFICIAL: HOMOLOGAR E CONCLUIR COM ANEXO DO LAUDO EM PDF */}
      {/* ============================================================== */}
      {requestToConclude && (
        <Modal
          isOpen={Boolean(requestToConclude)}
          onClose={() => {
            setRequestToConclude(null);
            setProofAttachments([]);
            setProofError('');
            setConcludeMotivo('');
          }}
          title="Homologar e Concluir Demanda Pericial"
          subtitle={`Processo nº ${requestToConclude.numeroProcesso} • ${requestToConclude.setorSolicitante}`}
          maxWidth="2xl"
          zIndex="z-[80]"
        >
          <div className="space-y-4">
            {!requestToConclude.cadastroCompleto && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Atenção:</strong> Esta requisição possui campos complementares pendentes de preenchimento técnico. Ela será homologada e encerrada com o registro do documento anexado abaixo.
                </span>
              </div>
            )}

            {/* Upload Obrigatório da Peça de Conclusão / Laudo Pericial em PDF */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>
                  Anexo do Laudo Pericial ou Comprovante de Conclusão <span className="text-red-500">*</span>
                </span>
                <span className="text-[11px] font-normal text-slate-500">Obrigatório em PDF</span>
              </label>

              <ProofAttachmentUpload
                attachments={proofAttachments}
                onAttachmentsChange={(atts) => {
                  setProofAttachments(atts);
                  if (atts.length > 0) setProofError('');
                }}
                onPreview={(att) => setPreviewAttachment(att)}
                error={proofError}
              />
            </div>

            {/* Número do Laudo ou Observações Finais */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Número do Laudo Pericial Emitido / Observações Finais (Opcional)
              </label>
              <textarea
                rows={2}
                value={concludeMotivo}
                onChange={(e) => setConcludeMotivo(e.target.value)}
                placeholder="Ex: Laudo pericial nº 1234/2026 emitido, assinado digitalmente e juntado aos autos..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setRequestToConclude(null);
                  setProofAttachments([]);
                  setProofError('');
                  setConcludeMotivo('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (proofAttachments.length === 0) {
                    setProofError('O anexo de comprovação em PDF é obrigatório para concluir a requisição.');
                    warning(
                      'Comprovação Obrigatória',
                      'Para concluir a requisição, é obrigatório anexar o PDF de comprovação (laudo pericial finalizado e/ou comprovante de envio).'
                    );
                    return;
                  }

                  if (requestToConclude) {
                    concludeOperationalRequest(requestToConclude.id, concludeMotivo, proofAttachments);
                    setRequestToConclude(null);
                    setProofAttachments([]);
                    setProofError('');
                    setConcludeMotivo('');
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Homologar e Concluir Laudo
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL OFICIAL: REABERTURA DE DEMANDA CONCLUÍDA                 */}
      {/* ============================================================== */}
      {requestToReopen && (
        <Modal
          isOpen={Boolean(requestToReopen)}
          onClose={() => {
            setRequestToReopen(null);
            setReopenMotivo('');
          }}
          title="Reabertura de Demanda Concluída"
          subtitle={`Processo nº ${requestToReopen.numeroProcesso}`}
          maxWidth="md"
          zIndex="z-[80]"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              A demanda retornará para a etapa <strong>Em Execução</strong> para continuidade ou retificação pericial.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Justificativa Formal da Reabertura <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={reopenMotivo}
                onChange={(e) => setReopenMotivo(e.target.value)}
                placeholder="Ex: Diligência pericial complementar solicitada pelo Juízo; retificação de quesitos..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setRequestToReopen(null);
                  setReopenMotivo('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!reopenMotivo.trim()}
                onClick={() => {
                  if (requestToReopen && reopenMotivo.trim()) {
                    reopenOperationalRequest(requestToReopen.id, 'Em andamento', reopenMotivo);
                    setRequestToReopen(null);
                    setReopenMotivo('');
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                Confirmar Reabertura
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================== */}
      {/* MODAL DE PREVIEW DE PDF                                        */}
      {/* ============================================================== */}
      {previewAttachment && (
        <PdfPreviewModal
          attachment={previewAttachment}
          isOpen={Boolean(previewAttachment)}
          onClose={() => setPreviewAttachment(null)}
          processNumber={requestToConclude?.numeroProcesso}
        />
      )}
    </div>
  );
};
