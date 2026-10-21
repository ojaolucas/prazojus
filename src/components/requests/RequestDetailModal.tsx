import React, { useState, useEffect } from 'react';
import { JudicialRequest, RequestStatus, PriorityLevel } from '../../types/request';
import { useRequests } from '../../context/RequestContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../layout/Modal';
import { ConfirmDialog } from '../layout/ConfirmDialog';
import { StatusBadge, PriorityBadge, TipoPrazoBadge } from './StatusBadge';
import {
  formatDatePtBR,
  formatDeadlineCountdown,
  calculatePriority,
} from '../../services/deadlineService';
import {
  Calendar,
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
  const { deleteRequest, updateRequest } = useRequests();
  const { can } = useAuth();
  const { info, success } = useToast();

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<RequestStatus>('Pendente');
  const [currentPriority, setCurrentPriority] = useState<string>('');

  useEffect(() => {
    if (request) {
      const s = request.status;
      const normalized: RequestStatus =
        s === 'Pendente'
          ? 'Não iniciado'
          : s === 'Em andamento' || s === 'Aguardando informações'
          ? 'Iniciado'
          : s;
      setCurrentStatus(normalized);
      setCurrentPriority('auto');
    }
  }, [request?.id, request?.status]);

  if (!request) return null;

  const normalizedOriginalStatus =
    request.status === 'Pendente'
      ? 'Não iniciado'
      : request.status === 'Em andamento' || request.status === 'Aguardando informações'
      ? 'Iniciado'
      : request.status;

  const countdown = formatDeadlineCountdown(request.prazoJudicial, request.status);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    info('Copiado', `${label} copiado para a área de transferência.`);
  };

  const handleDelete = () => {
    deleteRequest(request.id);
    setIsDeleteConfirmOpen(false);
    onClose();
  };

  const hasChanges = currentStatus !== normalizedOriginalStatus;

  const handleSaveStatusPriority = () => {
    updateRequest(request.id, {
      status: currentStatus,
      prioridadeManual: null,
    });
    success('Dados Salvos', `Status alterado para "${currentStatus}".`);
  };

  return (
    <>
      <Modal
        isOpen={!!request}
        onClose={onClose}
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
              <StatusBadge status={request.status} />

              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-2">
                Tipo:
              </span>
              <TipoPrazoBadge
                tipoPrazo={request.tipoPrazo}
                temPrazoJudicial={request.temPrazoJudicial}
              />

              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-2">
                Prioridade:
              </span>
              <PriorityBadge
                prazoJudicial={request.prazoJudicial}
                status={request.status}
                prioridadeManual={request.prioridadeManual}
              />
            </div>

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
                  <span className="text-slate-400 block">Vestígio / Amostra Recebida:</span>
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
                    {request.tipoPrazo === 'interno' || request.temPrazoJudicial === false
                      ? 'Data Prevista para Conclusão (Meta Interna):'
                      : 'Data Final do Prazo Judicial:'}
                  </span>
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

                  {(request.dataRecebimento || request.diasPrazo) && (
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
                  <span className="text-slate-400 block">Referências Processuais:</span>
                  <span className="font-medium text-slate-700">
                    {request.referencias || 'Nenhuma referência externa anotada'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Descrição Completa */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Descrição do Objeto Requisitado:
            </span>
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
              {request.descricao}
            </p>
          </div>

          {/* Painel Direto: Status e Classificação de Prioridade */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-700" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Status Operacional
              </span>
            </div>

            <div className="pt-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Operacional
              </label>
              <select
                value={currentStatus}
                onChange={(e) => setCurrentStatus(e.target.value as RequestStatus)}
                className="w-full text-xs font-medium p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              >
                <option value="Não iniciado">Não iniciado</option>
                <option value="Iniciado">Iniciado</option>
                <option value="Concluído">Concluído</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            {/* Ação de Salvamento com Feedback Visual */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 mt-2 flex-wrap gap-2">
              <span className="text-xs">
                {hasChanges ? (
                  <span className="text-amber-700 font-semibold flex items-center gap-1">
                    ⚠️ Alterações pendentes de salvamento
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    ✓ Status sincronizado
                  </span>
                )}
              </span>

              <button
                type="button"
                onClick={handleSaveStatusPriority}
                disabled={!hasChanges}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all ${
                  hasChanges
                    ? 'bg-blue-700 hover:bg-blue-800 text-white cursor-pointer ring-2 ring-blue-400/40'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                Salvar Status e Prioridade
              </button>
            </div>
          </div>

          {/* Footer de Controles */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(request.numeroProcesso, 'Número do processo')}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar Processo
              </button>

              {/* Botão Excluir (apenas Supervisor e Admin) */}
              <button
                type="button"
                disabled={!can('canDeleteRequest')}
                onClick={() => setIsDeleteConfirmOpen(true)}
                title={
                  !can('canDeleteRequest')
                    ? 'Perfil Operador não possui autorização para excluir registros'
                    : 'Remover requisição permanentemente'
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  can('canDeleteRequest')
                    ? 'text-rose-600 bg-white border-rose-200 hover:bg-rose-50'
                    : 'text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed opacity-60'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Fechar
              </button>

              {/* Botão Editar (permitido para todos os perfis) */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(request);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors"
              >
                <Edit className="w-4 h-4" />
                Editar Requisição
              </button>
            </div>
          </div>
        </div>
      </Modal>

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
    </>
  );
};
