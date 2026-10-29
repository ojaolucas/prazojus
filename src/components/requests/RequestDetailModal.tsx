import React, { useState, useEffect, useRef } from 'react';
import { JudicialRequest, RequestStatus, PriorityLevel, RequestAttachment } from '../../types/request';
import { useRequests } from '../../context/RequestContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../layout/Modal';
import { ConfirmDialog } from '../layout/ConfirmDialog';
import { StatusBadge, PriorityBadge, TipoPrazoBadge } from './StatusBadge';
import { AttachmentSection } from './AttachmentSection';
import { PdfPreviewModal } from './PdfPreviewModal';
import { ProofAttachmentUpload } from './ProofAttachmentUpload';
import { AddToCalendarModal } from './AddToCalendarModal';
import {
  formatDatePtBR,
  formatDeadlineCountdown,
  calculatePriority,
  isRequestPrazoIndefinido,
} from '../../services/deadlineService';
import {
  Calendar,
  CalendarPlus,
  Clock,
  Building2,
  FileCheck2,
  Tag,
  User,
  Sliders,
  Trash2,
  Edit,
  AlertTriangle,
  Copy,
  ExternalLink,
  Check,
  Save,
  Loader2,
  UserCheck,
  Handshake,
  PlayCircle,
  ArrowRightLeft,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface RequestDetailModalProps {
  request: JudicialRequest | null;
  onClose: () => void;
  onEdit: (req: JudicialRequest) => void;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  request,
  onClose,
  onEdit,
}) => {
  const { deleteRequest, updateRequest, receiveRequest, startRequestWork, transferRequest } = useRequests();
  const { can, currentUser, users } = useAuth();
  const { info, success, warning, error } = useToast();

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = useState(false);
  const [isReceiveConfirmOpen, setIsReceiveConfirmOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedTransferUserId, setSelectedTransferUserId] = useState('');
  const [transferMotivo, setTransferMotivo] = useState('');
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<RequestStatus>('Não iniciado');
  const [currentPriority, setCurrentPriority] = useState<string>('');
  const [previewAttachment, setPreviewAttachment] = useState<RequestAttachment | null>(null);
  const [currentProof, setCurrentProof] = useState<RequestAttachment | null>(null);
  const [currentProofs, setCurrentProofs] = useState<RequestAttachment[]>([]);
  const [proofError, setProofError] = useState<string>('');
  const [isSavingStatus, setIsSavingStatus] = useState<boolean>(false);
  const initialSnapshotRef = useRef<string>('');

  const hasSectorAccess = Boolean(
    request &&
      (currentUser.role === 'Administrador' ||
        (currentUser.setores || []).includes(request.setorSolicitante))
  );
  const isAguardando = request?.statusOperacional === 'Aguardando recebimento';
  const isMine = Boolean(
    request?.responsavelOperacionalId &&
    request.responsavelOperacionalId === currentUser.id
  );
  const isConcluido = request?.status === 'Concluído';

  const canEditThis = can('canEditRequest') && hasSectorAccess && (
    currentUser.role === 'Administrador' || (!isAguardando && isMine && !isConcluido)
  );
  const canDeleteThis = can('canDeleteRequest') && hasSectorAccess;
  const canChangeStatusThis = can('canEditRequest') && hasSectorAccess && !isAguardando && (
    currentUser.role === 'Administrador' || (isMine && !isConcluido)
  );

  useEffect(() => {
    if (request) {
      const s = request.status;
      const normalized: RequestStatus =
        s === 'Pendente' || s === 'Vencido'
          ? 'Não iniciado'
          : s === 'Em andamento' || s === 'Aguardando informações'
          ? 'Iniciado'
          : s;
      setCurrentStatus(normalized);
      const initialProofs = request.anexosComprovacao && request.anexosComprovacao.length > 0
        ? [...request.anexosComprovacao]
        : request.anexoComprovacao
        ? [request.anexoComprovacao]
        : [];
      setCurrentProofs(initialProofs);
      setCurrentProof(initialProofs[0] || null);
      setProofError('');
      setCurrentPriority('auto');

      initialSnapshotRef.current = JSON.stringify({
        status: normalized,
        proofsCount: initialProofs.length,
        proofIds: initialProofs.map((p) => p.id).sort().join(','),
      });
    } else {
      initialSnapshotRef.current = '';
    }
  }, [request?.id, request?.status, request?.anexoComprovacao, request?.anexosComprovacao]);

  if (!request) return null;

  const isPrazoIndefinido = isRequestPrazoIndefinido(request);
  const countdown = formatDeadlineCountdown(request.prazoJudicial, request.status, new Date(), isPrazoIndefinido);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    info('Copiado', `${label} copiado para a área de transferência.`);
  };

  const handleDelete = () => {
    deleteRequest(request.id);
    setIsDeleteConfirmOpen(false);
    onClose();
  };

  const currentSnapshot = JSON.stringify({
    status: currentStatus,
    proofsCount: currentProofs.length,
    proofIds: currentProofs.map((p) => p.id).sort().join(','),
  });

  const hasChanges = Boolean(
    initialSnapshotRef.current && currentSnapshot !== initialSnapshotRef.current
  );

  const handleClose = () => {
    // Regra 1: Confirmar antes de descartar alterações não salvas usando o diálogo do sistema
    if (hasChanges) {
      setIsConfirmDiscardOpen(true);
      return;
    }
    onClose();
  };

  const handleSaveStatusPriority = () => {
    // Regra 2: Bloquear múltiplos cliques
    if (isSavingStatus) return;

    if (!canChangeStatusThis) {
      error(
        'Ação Não Autorizada',
        !hasSectorAccess
          ? `Você não possui atribuição ao setor "${request.setorSolicitante}".`
          : 'Seu perfil de acesso não possui permissão para alterar dados de requisições.'
      );
      return;
    }

    if (currentStatus === 'Concluído' && !request.cadastroCompleto) {
      warning(
        'Informações Obrigatórias Pendentes',
        'Não é permitido concluir a requisição enquanto houver dados técnicos pendentes de preenchimento. Preencha todos os campos obrigatórios da requisição antes de concluir.'
      );
      return;
    }

    if (currentStatus === 'Concluído' && !can('canConcludeRequest')) {
      error(
        'Acesso Restrito',
        'Seu perfil de acesso não possui permissão para homologar e concluir requisições judiciais.'
      );
      return;
    }

    if (currentStatus === 'Cancelado' && !can('canCancelRequest')) {
      error(
        'Acesso Restrito',
        'Apenas o Administrador pode cancelar requisições judiciais.'
      );
      return;
    }

    if (currentStatus === 'Concluído' && (!currentProofs || currentProofs.length === 0)) {
      setProofError('O anexo de comprovação em PDF é obrigatório para concluir a requisição.');
      warning(
        'Comprovação Obrigatória',
        'Para concluir a requisição, é obrigatório anexar o PDF de comprovação (laudo pericial finalizado e/ou comprovante de envio).'
      );
      return;
    }

    setIsSavingStatus(true);
    try {
      updateRequest(request.id, {
        status: currentStatus,
        anexoComprovacao: currentStatus === 'Concluído' ? (currentProofs[0] || undefined) : undefined,
        anexosComprovacao: currentStatus === 'Concluído' ? (currentProofs.length > 0 ? currentProofs : undefined) : undefined,
        prioridadeManual: null,
      });
      success('Dados Salvos', `Status alterado para "${currentStatus}" com sucesso.`);
    } finally {
      setIsSavingStatus(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={!!request}
        onClose={onClose}
        hasUnsavedChanges={hasChanges}
        confirmCloseMessage="Existem alterações de status ou anexos pendentes de salvamento. Deseja realmente descartar e fechar?"
        title={`Autos do Processo nº ${request.numeroProcesso}`}
        subtitle={`Cadastrado por ${request.criadoPor} em ${formatDatePtBR(request.criadoEm, false)}`}
        maxWidth="3xl"
      >
        <div className="space-y-5">
          {/* Top Status & Countdown Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status:
              </span>
              <StatusBadge
                status={request.status}
                statusOperacional={request.statusOperacional}
              />

              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-2">
                Tipo:
              </span>
              <TipoPrazoBadge
                tipoPrazo={request.tipoPrazo}
                temPrazoJudicial={request.temPrazoJudicial}
                prazoIndefinido={isPrazoIndefinido}
              />

              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-2">
                Prioridade:
              </span>
              <PriorityBadge
                prazoJudicial={request.prazoJudicial}
                status={request.status}
                prioridadeManual={request.prioridadeManual}
                prazoIndefinido={isPrazoIndefinido}
              />
            </div>

            {isPrazoIndefinido ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border bg-slate-100 text-slate-700 border-slate-300">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Prazo: A definir pelo setor</span>
              </div>
            ) : (
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${
                  countdown.urgency === 'vencido'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : countdown.urgency === 'hoje'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : countdown.urgency === 'proximo'
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : countdown.urgency === 'concluido'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                {countdown.label}
              </div>
            )}
          </div>

          {/* Banner de Fluxo Operacional & Atribuição Pericial */}
          <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50/50 border border-slate-200/90 rounded-xl space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Fluxo Operacional:
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                    request.statusOperacional === 'Aguardando recebimento'
                      ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                      : request.statusOperacional === 'Concluído' || request.status === 'Concluído'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-blue-100 text-blue-900 border-blue-300'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {request.statusOperacional === 'Aguardando recebimento'
                    ? 'Aguardando recebimento'
                    : request.statusOperacional === 'Concluído' || request.status === 'Concluído'
                    ? 'Concluído'
                    : 'Em andamento'}
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    request.cadastroCompleto
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {request.cadastroCompleto ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Cadastro Completo
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      Dados Complementares Pendentes
                    </>
                  )}
                </span>
              </div>

              {/* Botões de Ação do Fluxo Operacional */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {request.statusOperacional === 'Aguardando recebimento' && hasSectorAccess && currentUser.role !== 'Visualizador' && can('canEditRequest') && (
                  <button
                    type="button"
                    onClick={() => setIsReceiveConfirmOpen(true)}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Handshake className="w-3.5 h-3.5" />
                    Receber Requisição
                  </button>
                )}


                {canEditThis && (
                  <button
                    type="button"
                    onClick={() => onEdit(request)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3 text-slate-500" />
                    {request.cadastroCompleto ? 'Editar Dados' : 'Preencher Dados'}
                  </button>
                )}

                {currentUser.role === 'Administrador' &&
                  request.status !== 'Concluído' &&
                  request.statusOperacional !== 'Concluído' &&
                  request.status !== 'Cancelado' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTransferUserId(request.responsavelOperacionalId || '');
                      setTransferMotivo('');
                      setIsTransferModalOpen(true);
                    }}
                    title="Transferir perito responsável desta demanda"
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <ArrowRightLeft className="w-3 h-3 text-slate-500" />
                    Reatribuir
                  </button>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                <span>
                  Perito Responsável:{' '}
                  <strong className="text-slate-800">
                    {request.responsavelOperacionalNome || 'Fila do Setor (Nenhum servidor atribuído)'}
                  </strong>
                </span>
              </div>

              {request.dataRecebimentoOperacional && (
                <div className="text-slate-500 text-[11px]">
                  Recebido em:{' '}
                  <strong className="text-slate-700">
                    {formatDatePtBR(request.dataRecebimentoOperacional, false)}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* Grid de Informações Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Dados Periciais */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-blue-700" />
                Dados Técnicos da Perícia
              </h4>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Tipo de Exame:</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {request.tipoExame}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block">Setor Pericial Solicitante:</span>
                  <span className="font-medium text-slate-700 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {request.setorSolicitante}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block">Origem / Juízo Solicitante:</span>
                  <span className="font-medium text-slate-700">
                    {request.origem || 'Não informada'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block">Vestígio:</span>
                  <span className="font-medium text-slate-700">
                    {request.vestigio || 'Vestígio não discriminado nos autos'}
                  </span>
                </div>
              </div>
            </div>

            {/* Box 2: Prazos e Protocolos */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-700" />
                Controle Temporal e Protocolos
              </h4>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block">
                    {isPrazoIndefinido
                      ? 'Previsão de Conclusão / Prazo:'
                      : request.tipoPrazo === 'interno' || request.temPrazoJudicial === false
                      ? 'Data Prevista para Conclusão (Meta Interna):'
                      : 'Data Final do Prazo Judicial:'}
                  </span>
                  {isPrazoIndefinido ? (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-semibold text-slate-700 text-sm italic">
                        A definir pelo setor
                      </span>
                      <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        Aguardando preenchimento técnico
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-slate-900 text-sm font-mono">
                        {formatDatePtBR(request.prazoJudicial)}
                      </span>
                      <TipoPrazoBadge
                        tipoPrazo={request.tipoPrazo}
                        temPrazoJudicial={request.temPrazoJudicial}
                        size="sm"
                      />
                    </div>
                  )}

                  {!isPrazoIndefinido && (request.dataRecebimento || request.diasPrazo) && (
                    <div className="mt-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-0.5">
                      {request.dataRecebimento && (
                        <div>
                          Recebido em: <strong>{formatDatePtBR(request.dataRecebimento)}</strong> (dia zero)
                        </div>
                      )}
                      {request.diasPrazo && (
                        <div>
                          {request.tipoPrazo === 'interno' || request.temPrazoJudicial === false
                            ? 'Meta do Setor: '
                            : 'Prazo Concedido pela Justiça: '}
                          <strong>{request.diasPrazo} dias corridos</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {request.motivoPrazoInterno && (
                    <div className="mt-1.5 text-[11px] text-indigo-900 bg-indigo-50 border border-indigo-200 p-2 rounded-lg leading-relaxed">
                      <strong>Observação / Justificativa:</strong> {request.motivoPrazoInterno}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-400 block">Protocolo:</span>
                    <span className="font-mono text-slate-700 font-medium">
                      {request.protocolo || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">REP:</span>
                    <span className="font-mono text-slate-700 font-medium">
                      {request.rep || '—'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block">Partes / Envolvidos:</span>
                  <span className="font-medium text-slate-700">
                    {request.acusadoVitima || 'Partes sob segredo ou não especificadas'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block">Referências:</span>
                  <span className="font-medium text-slate-700">
                    {request.referencias || 'Nenhuma referência externa anotada'}
                  </span>
                </div>

                {/* Botão de Integração com Agenda Externa */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCalendarModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all shadow-xs group cursor-pointer"
                    title="Exportar este prazo para o Google Agenda, Apple Calendar ou Outlook"
                  >
                    <CalendarPlus className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                    <span>Adicionar à minha agenda</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Número do Ofício / Requisição */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Número do ofício / Requisição de Exame Pericial:
            </span>
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
              {request.descricao}
            </p>
          </div>

          {/* Peças e Documentos em PDF (Apenas Visualização) */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <AttachmentSection
              attachments={request.anexos || []}
              readOnly={true}
              processNumber={request.numeroProcesso}
              onPreviewAttachment={(att) => setPreviewAttachment(att)}
            />
          </div>

          {/* Painel Direto: Status e Classificação de Prioridade (Exibido apenas após o recebimento da demanda) */}
          {!isAguardando && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-3.5 bg-[#274578] rounded-full" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Status Operacional
                  </span>
                </div>
                {hasChanges && (
                  <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Não salvo
                  </span>
                )}
              </div>

              <div className="pt-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Operacional
                </label>
                <select
                  disabled={!canChangeStatusThis}
                  value={currentStatus}
                  onChange={(e) => {
                    const newStatus = e.target.value as RequestStatus;
                    if (newStatus === 'Concluído' && !request.cadastroCompleto) {
                      warning(
                        'Informações Obrigatórias Pendentes',
                        'Para concluir a requisição, é necessário preencher todas as informações técnicas primeiro.'
                      );
                      return;
                    }
                    setCurrentStatus(newStatus);
                    if (newStatus !== 'Concluído') {
                      setProofError('');
                    }
                  }}
                  className={`w-full text-xs font-medium p-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs ${
                    !canChangeStatusThis
                      ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-800 border-slate-300'
                  }`}
                >
                  <option value="Não iniciado">Não iniciado</option>
                  <option value="Iniciado">Em Execução</option>
                  <option value="Concluído" disabled={!request.cadastroCompleto}>
                    Concluído {!request.cadastroCompleto ? '(Exige preenchimento completo)' : ''}
                  </option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>

              {/* Documentos de Comprovação da Conclusão */}
              {(currentStatus === 'Concluído' || (currentProofs && currentProofs.length > 0)) && (
                <div className="pt-2">
                  <ProofAttachmentUpload
                    attachment={currentProof}
                    attachments={currentProofs}
                    onAttachmentsChange={(newProofs) => {
                      setCurrentProofs(newProofs);
                      setCurrentProof(newProofs[0] || null);
                      if (newProofs.length > 0) {
                        setProofError('');
                      }
                    }}
                    onChange={(newProof) => {
                      setCurrentProof(newProof);
                    }}
                    onPreview={(att) => setPreviewAttachment(att)}
                    error={proofError}
                    readOnly={!canChangeStatusThis || currentStatus !== 'Concluído'}
                  />
                </div>
              )}
            </div>
          )}

          {/* Footer de Controles */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(request.numeroProcesso, 'Número do processo')}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar Processo
              </button>

              {/* Botão Excluir */}
              {canDeleteThis && (
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors text-rose-600 bg-white border-rose-200 hover:bg-rose-50 cursor-pointer"
                  title="Remover requisição permanentemente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Fechar
              </button>

              {/* Se houver alterações pendentes de status ou documento, exibe apenas o botão Salvar */}
              {hasChanges ? (
                <button
                  type="button"
                  onClick={handleSaveStatusPriority}
                  disabled={isSavingStatus || !canChangeStatusThis}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {isSavingStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar</span>
                    </>
                  )}
                </button>
              ) : (
                <>
                  {currentUser.role === 'Administrador' && isAguardando && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEdit(request);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Editar dados da requisição"
                    >
                      <Edit className="w-4 h-4 text-slate-500" />
                      Editar
                    </button>
                  )}

                  {isAguardando && hasSectorAccess && currentUser.role !== 'Visualizador' ? (
                    <button
                      type="button"
                      onClick={() => setIsReceiveConfirmOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors cursor-pointer"
                      title="Receber formalmente a demanda"
                    >
                      <Handshake className="w-4 h-4" />
                      Receber
                    </button>
                  ) : !isAguardando && canEditThis ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEdit(request);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg shadow-sm transition-colors text-white bg-blue-700 hover:bg-blue-800 cursor-pointer"
                      title="Editar dados da requisição"
                    >
                      <Edit className="w-4 h-4" />
                      Editar Requisição
                    </button>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirmação de Recebimento Explícito da Requisição */}
      <ConfirmDialog
        isOpen={isReceiveConfirmOpen}
        onClose={() => setIsReceiveConfirmOpen(false)}
        onConfirm={() => {
          setIsReceiveConfirmOpen(false);
          const ok = receiveRequest(request.id);
          if (ok) {
            onClose();
            onEdit({
              ...request,
              statusOperacional: 'Em andamento',
              responsavelOperacionalId: currentUser.id,
              responsavelOperacionalNome: currentUser.nome,
              dataRecebimentoOperacional: new Date().toISOString(),
              dataIniciadoOperacional: new Date().toISOString(),
            });
          }
        }}
        title="Receber Requisição Pericial"
        message={`Deseja assumir formalmente a responsabilidade técnica pela demanda do Processo nº "${request.numeroProcesso}" no setor de ${request.setorSolicitante}? Ao confirmar, seu usuário (${currentUser.nome}) será registrado como responsável e o formulário de preenchimento completo será aberto imediatamente.`}
        confirmLabel="Sim, Receber"
        cancelLabel="Voltar"
        iconType="question"
        zIndex="z-[75]"
      />

      {/* Modal de Reatribuição / Transferência de Perito Responsável */}
      {isTransferModalOpen && (
        <Modal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          title="Reatribuir Requisição pericial"
          subtitle={`Processo nº ${request.numeroProcesso} (${request.setorSolicitante})`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Selecione o novo perito ou servidor autorizado do setor para transferir a responsabilidade técnica desta requisição:
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Novo Perito / Servidor Responsável *
              </label>
              <select
                value={selectedTransferUserId}
                onChange={(e) => setSelectedTransferUserId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Selecione um perito...</option>
                {users
                  .filter(
                    (u) =>
                      u.status === 'Ativo' &&
                      u.role !== 'Visualizador' &&
                      Boolean(u.setores && u.setores.includes(request.setorSolicitante))
                  )
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome} ({u.cargo}) {u.id === request.responsavelOperacionalId ? '— Atual' : ''}
                    </option>
                  ))}
              </select>
              {users.filter(
                (u) =>
                  u.status === 'Ativo' &&
                  u.role !== 'Visualizador' &&
                  Boolean(u.setores && u.setores.includes(request.setorSolicitante))
              ).length === 0 && (
                <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Nenhum perito ou técnico operacional ativo vinculado ao setor "{request.setorSolicitante}".
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motivo da Transferência / Reatribuição (Opcional)
              </label>
              <input
                type="text"
                value={transferMotivo}
                onChange={(e) => setTransferMotivo(e.target.value)}
                placeholder="Ex: Redistribuição de carga pericial; Férias do titular..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!selectedTransferUserId || selectedTransferUserId === request.responsavelOperacionalId}
                onClick={() => {
                  const targetUser = users.find((u) => u.id === selectedTransferUserId);
                  if (targetUser) {
                    transferRequest(request.id, targetUser.id, targetUser.nome, transferMotivo);
                    setIsTransferModalOpen(false);
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
              >
                Confirmar Transferência
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmação de Descarte de Alterações de Status/Anexo */}
      <ConfirmDialog
        isOpen={isConfirmDiscardOpen}
        onClose={() => setIsConfirmDiscardOpen(false)}
        onConfirm={() => {
          setIsConfirmDiscardOpen(false);
          onClose();
        }}
        title="Descartar Alterações?"
        message="Existem alterações de status ou anexos pendentes de salvamento. Deseja realmente descartar e fechar?"
        confirmLabel="Descartar e Fechar"
        cancelLabel="Continuar Editando"
        isDestructive
        iconType="warning"
        zIndex="z-[70]"
      />

      {/* Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Requisição Judicial"
        message={`Tem certeza de que deseja excluir permanentemente o registro da requisição do processo "${request.numeroProcesso}"? Esta ação removerá os autos e seus históricos locais.`}
        confirmLabel="Sim, Excluir Registro"
        cancelLabel="Cancelar"
        isDestructive
      />

      {/* Visualizador de PDF */}
      <PdfPreviewModal
        attachment={previewAttachment}
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        processNumber={request.numeroProcesso}
      />

      {/* Modal de Integração com Agendas Externas (Google / Apple / Outlook) */}
      <AddToCalendarModal
        request={request}
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
      />
    </>
  );
};
