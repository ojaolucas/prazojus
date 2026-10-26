import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRequests } from '../../context/RequestContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../layout/Modal';
import { ConfirmDialog } from '../layout/ConfirmDialog';
import {
  SETORES_SOLICITANTES,
  TIPOS_DE_EXAME,
  ORIGENS_COMUNS,
} from '../../data/constants';
import { RequestStatus, PriorityLevel, JudicialRequest, RequestAttachment } from '../../types/request';
import {
  calculateDeadlineDate,
  formatDatePtBR,
} from '../../services/deadlineService';
import { AttachmentSection } from './AttachmentSection';
import { PdfPreviewModal } from './PdfPreviewModal';
import { ProofAttachmentUpload } from './ProofAttachmentUpload';
import { SearchableSelect } from '../common/SearchableSelect';
import {
  AlertCircle,
  Calendar,
  Hash,
  Scale,
  Building2,
  Sliders,
  Sparkles,
  Clock,
  ArrowRight,
  FileText,
  Loader2,
} from 'lucide-react';

interface RequestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: JudicialRequest | null;
}

export const RequestFormModal: React.FC<RequestFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { addRequest, updateRequest, requests } = useRequests();
  const { can, currentUser } = useAuth();
  const { warning } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableSectors = useMemo(() => {
    if (currentUser.role === 'Administrador') {
      return SETORES_SOLICITANTES;
    }
    return currentUser.setores && currentUser.setores.length > 0 ? currentUser.setores : [];
  }, [currentUser]);

  const isEditing = Boolean(initialData && initialData.id);

  // Form State
  const [numeroProcesso, setNumeroProcesso] = useState('');
  const [descricao, setDescricao] = useState('');
  const [setorSolicitante, setSetorSolicitante] = useState('');
  const [tipoExame, setTipoExame] = useState('');

  // Controle de Prazo Baseado em Recebimento + Quantidade de Dias
  const [temPrazoJudicial, setTemPrazoJudicial] = useState<boolean | null>(null);
  const [dataRecebimento, setDataRecebimento] = useState<string>(''); // YYYY-MM-DD
  const [diasPrazo, setDiasPrazo] = useState<string>(''); // string para facilitar input
  const [motivoPrazoInterno, setMotivoPrazoInterno] = useState<string>('');

  // Dados complementares
  const [vestigio, setVestigio] = useState('');
  const [acusadoVitima, setAcusadoVitima] = useState('');
  const [protocolo, setProtocolo] = useState('');
  const [rep, setRep] = useState('');
  const [origem, setOrigem] = useState('');
  const [referencias, setReferencias] = useState('');
  const [anexos, setAnexos] = useState<RequestAttachment[]>([]);
  const [previewAttachment, setPreviewAttachment] = useState<RequestAttachment | null>(null);

  // Status e Histórico
  const [status, setStatus] = useState<RequestStatus>('Não iniciado');
  const [anexoComprovacao, setAnexoComprovacao] = useState<RequestAttachment | null>(null);
  const [anexosComprovacao, setAnexosComprovacao] = useState<RequestAttachment[]>([]);
  const [prioridadeManual, setPrioridadeManual] = useState<PriorityLevel | 'auto'>('auto');
  const [motivoAlteracao, setMotivoAlteracao] = useState('');

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = useState(false);

  // Cálculo automático da Data Final do Prazo em tempo real
  const dataFinalCalculada = useMemo(() => {
    const dias = parseInt(diasPrazo, 10);
    if (!dataRecebimento || isNaN(dias) || dias < 0) return '';
    return calculateDeadlineDate(dataRecebimento, dias);
  }, [dataRecebimento, diasPrazo]);

  // Snapshot dos valores para detecção confiável de alterações reais
  const initialSnapshotRef = useRef<string>('');

  const buildSnapshot = (values: {
    numeroProcesso: string;
    descricao: string;
    setorSolicitante: string;
    tipoExame: string;
    temPrazoJudicial: boolean | null;
    dataRecebimento: string;
    diasPrazo: string;
    motivoPrazoInterno: string;
    vestigio: string;
    acusadoVitima: string;
    protocolo: string;
    rep: string;
    origem: string;
    referencias: string;
    anexosCount: number;
    anexosProofCount: number;
    status: string;
    prioridadeManual: string;
    motivoAlteracao: string;
  }) => JSON.stringify(values);

  useEffect(() => {
    if (!isOpen) {
      initialSnapshotRef.current = '';
      return;
    }

    if (initialData) {
      const proc = initialData.numeroProcesso || '';
      const desc = initialData.descricao || '';
      const setor = initialData.setorSolicitante || '';
      const tipo = initialData.tipoExame || '';
      const temPrazo =
        initialData.temPrazoJudicial !== undefined
          ? initialData.temPrazoJudicial
          : initialData.tipoPrazo !== 'interno';
      const dataRec = initialData.dataRecebimento
        ? initialData.dataRecebimento
        : initialData.criadoEm
        ? initialData.criadoEm.slice(0, 10)
        : initialData.prazoJudicial
        ? initialData.prazoJudicial.slice(0, 10)
        : '';

      let diasStr = '';
      if (initialData.diasPrazo) {
        diasStr = String(initialData.diasPrazo);
      } else if (initialData.prazoJudicial) {
        const dPrazo = new Date(initialData.prazoJudicial);
        const dRec = initialData.dataRecebimento
          ? new Date(initialData.dataRecebimento)
          : initialData.criadoEm
          ? new Date(initialData.criadoEm)
          : new Date();
        const diff = Math.max(
          1,
          Math.round((dPrazo.getTime() - dRec.getTime()) / (1000 * 60 * 60 * 24))
        );
        diasStr = String(diff);
      }

      const motivoPrazo = initialData.motivoPrazoInterno || '';
      const vest = initialData.vestigio || '';
      const acus = initialData.acusadoVitima || '';
      const prot = initialData.protocolo || '';
      const repVal = initialData.rep || '';
      const orig = initialData.origem || '';
      const refs = initialData.referencias || '';
      const atts = initialData.anexos ? [...initialData.anexos] : [];
      const proofs =
        initialData.anexosComprovacao && initialData.anexosComprovacao.length > 0
          ? [...initialData.anexosComprovacao]
          : initialData.anexoComprovacao
          ? [initialData.anexoComprovacao]
          : [];
      const st =
        initialData.status === 'Pendente' || initialData.status === 'Vencido'
          ? 'Não iniciado'
          : initialData.status === 'Em andamento' ||
            initialData.status === 'Aguardando informações'
          ? 'Iniciado'
          : initialData.status || 'Não iniciado';

      setNumeroProcesso(proc);
      setDescricao(desc);
      setSetorSolicitante(setor);
      setTipoExame(tipo);
      setTemPrazoJudicial(temPrazo);
      setDataRecebimento(dataRec);
      setDiasPrazo(diasStr);
      setMotivoPrazoInterno(motivoPrazo);
      setVestigio(vest);
      setAcusadoVitima(acus);
      setProtocolo(prot);
      setRep(repVal);
      setOrigem(orig);
      setReferencias(refs);
      setAnexos(atts);
      setAnexosComprovacao(proofs);
      setAnexoComprovacao(proofs[0] || null);
      setStatus(st);
      setPrioridadeManual('auto');
      setMotivoAlteracao('');

      initialSnapshotRef.current = buildSnapshot({
        numeroProcesso: proc,
        descricao: desc,
        setorSolicitante: setor,
        tipoExame: tipo,
        temPrazoJudicial: temPrazo,
        dataRecebimento: dataRec,
        diasPrazo: diasStr,
        motivoPrazoInterno: motivoPrazo,
        vestigio: vest,
        acusadoVitima: acus,
        protocolo: prot,
        rep: repVal,
        origem: orig,
        referencias: refs,
        anexosCount: atts.length,
        anexosProofCount: proofs.length,
        status: st,
        prioridadeManual: 'auto',
        motivoAlteracao: '',
      });
    } else {
      // Nova requisição: nenhum campo auto-preenchido, usuário seleciona todos
      setNumeroProcesso('');
      setDescricao('');
      setSetorSolicitante(availableSectors.length === 1 ? availableSectors[0] : '');
      setTipoExame('');
      setTemPrazoJudicial(null);
      setDataRecebimento('');
      setDiasPrazo('');
      setMotivoPrazoInterno('');
      setVestigio('');
      setAcusadoVitima('');
      setProtocolo('');
      setRep('');
      setOrigem('');
      setReferencias('');
      setAnexos([]);
      setAnexosComprovacao([]);
      setAnexoComprovacao(null);
      setStatus('Não iniciado');
      setPrioridadeManual('auto');
      setMotivoAlteracao('');

      initialSnapshotRef.current = buildSnapshot({
        numeroProcesso: '',
        descricao: '',
        setorSolicitante: '',
        tipoExame: '',
        temPrazoJudicial: null,
        dataRecebimento: '',
        diasPrazo: '',
        motivoPrazoInterno: '',
        vestigio: '',
        acusadoVitima: '',
        protocolo: '',
        rep: '',
        origem: '',
        referencias: '',
        anexosCount: 0,
        anexosProofCount: 0,
        status: 'Não iniciado',
        prioridadeManual: 'auto',
        motivoAlteracao: '',
      });
    }
    setErrors({});
    setIsSubmitting(false);
  }, [initialData, isOpen]);

  const currentSnapshot = buildSnapshot({
    numeroProcesso,
    descricao,
    setorSolicitante,
    tipoExame,
    temPrazoJudicial,
    dataRecebimento,
    diasPrazo,
    motivoPrazoInterno,
    vestigio,
    acusadoVitima,
    protocolo,
    rep,
    origem,
    referencias,
    anexosCount: anexos.length,
    anexosProofCount: anexosComprovacao.length,
    status,
    prioridadeManual,
    motivoAlteracao,
  });

  // Verificar se há alterações não salvas reais comparadas ao estado inicial carregado
  const hasUnsavedChanges = Boolean(
    initialSnapshotRef.current && currentSnapshot !== initialSnapshotRef.current
  );

  const handleCancel = () => {
    // Regra 1: Confirmar antes de descartar alterações não salvas usando o diálogo do sistema
    if (hasUnsavedChanges) {
      setIsConfirmDiscardOpen(true);
      return;
    }
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const numClean = numeroProcesso.trim();
    if (!numClean) {
      newErrors.numeroProcesso = 'O número do processo judicial é obrigatório.';
    } else {
      // Regra 3: Impedir cadastros duplicados (Processo Judicial)
      const isDuplicate = requests.some(
        (r) =>
          r.numeroProcesso.trim().toLowerCase() === numClean.toLowerCase() &&
          r.id !== initialData?.id
      );
      if (isDuplicate) {
        newErrors.numeroProcesso =
          'Já existe uma requisição pericial cadastrada com este número de processo.';
      }
    }

    if (!descricao.trim()) {
      newErrors.descricao = 'O número do ofício / requisição de exame pericial é obrigatório.';
    }

    if (temPrazoJudicial === null) {
      newErrors.temPrazoJudicial = 'Selecione se o prazo é judicial ou meta interna.';
    }

    if (!dataRecebimento) {
      newErrors.dataRecebimento = 'O dia de recebimento é obrigatório.';
    }

    const diasNum = parseInt(diasPrazo, 10);
    if (!diasPrazo || isNaN(diasNum) || diasNum <= 0) {
      newErrors.diasPrazo =
        temPrazoJudicial === true
          ? 'Informe a quantidade de dias concedida pela Justiça.'
          : 'Informe a quantidade de dias do prazo estabelecido para conclusão.';
    }

    if (!dataFinalCalculada) {
      newErrors.dataFinalCalculada =
        'Preencha o dia de recebimento e a quantidade de dias para calcular a data final.';
    }

    if (!setorSolicitante) {
      newErrors.setorSolicitante = 'Selecione o setor.';
    } else if (!availableSectors.includes(setorSolicitante)) {
      newErrors.setorSolicitante = 'Você não possui permissão para atuar no setor selecionado.';
    }

    if (!tipoExame) {
      newErrors.tipoExame = 'Selecione o tipo de exame.';
    }

    if (!protocolo.trim()) {
      newErrors.protocolo = 'O Protocolo Geral é obrigatório.';
    }

    if (!rep.trim()) {
      newErrors.rep = 'O REP é obrigatório.';
    }

    if (!origem.trim()) {
      newErrors.origem = 'A Origem / Vara Solicitante é obrigatória.';
    }

    if (!anexos || anexos.length === 0) {
      newErrors.anexos = 'É obrigatório anexar pelo menos um documento em PDF.';
    }

    if (!status) {
      newErrors.status = 'Selecione o status operacional.';
    }

    if (status === 'Concluído' && (!anexosComprovacao || anexosComprovacao.length === 0)) {
      newErrors.anexoComprovacao =
        'O anexo de comprovação em PDF (laudo pericial finalizado e/ou comprovante de envio) é obrigatório para concluir a requisição.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Regra 2: Bloquear múltiplos cliques
    if (isSubmitting) return;

    if (!validate()) {
      warning(
        'Campos Obrigatórios',
        'Por favor, corrija os erros indicados nos campos antes de salvar.'
      );
      return;
    }

    // Regra 2: Exibir estado de processamento temporário
    setIsSubmitting(true);

    // A data final calculada com horário 23:59:59 para garantir o encerramento no final do dia
    const prazoIso = `${dataFinalCalculada}T23:59:59`;
    const manualVal = prioridadeManual === 'auto' ? null : prioridadeManual;
    const finalTemPrazo = temPrazoJudicial !== null ? temPrazoJudicial : true;
    const finalStatus = (status as RequestStatus) || 'Não iniciado';
    const diasNum = parseInt(diasPrazo, 10);

    const payload = {
      numeroProcesso,
      descricao,
      setorSolicitante,
      prazoJudicial: prazoIso,
      dataRecebimento,
      diasPrazo: diasNum,
      tipoExame,
      vestigio,
      acusadoVitima,
      protocolo,
      rep,
      origem,
      referencias,
      anexos,
      anexoComprovacao: status === 'Concluído' ? (anexosComprovacao[0] || undefined) : undefined,
      anexosComprovacao: status === 'Concluído' ? (anexosComprovacao.length > 0 ? anexosComprovacao : undefined) : undefined,
      status: finalStatus,
      prioridadeManual: manualVal,
      temPrazoJudicial: finalTemPrazo,
      tipoPrazo: finalTemPrazo ? ('judicial' as const) : ('interno' as const),
      motivoPrazoInterno: !finalTemPrazo ? motivoPrazoInterno : undefined,
    };

    try {
      if (isEditing && initialData) {
        const success = updateRequest(
          initialData.id,
          payload,
          motivoAlteracao || 'Edição cadastral dos autos'
        );
        if (success) onClose();
      } else {
        const success = addRequest(payload);
        if (success) onClose();
      }
    } finally {
      // Regra 2: Restaurar o botão corretamente
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      hasUnsavedChanges={hasUnsavedChanges}
      confirmCloseMessage="Existem dados preenchidos no formulário da requisição. Deseja realmente descartar e fechar?"
      title={isEditing ? 'Editar Requisição Judicial' : 'Cadastrar Nova Requisição'}
      subtitle={
        isEditing
          ? `Atualizando autos do processo ${initialData?.numeroProcesso}`
          : 'Preencha os dados do processo e defina o prazo a partir do recebimento'
      }
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Seção 1: Dados Processuais Obrigatórios */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
            <Hash className="w-4 h-4 text-blue-600" />
            Dados Obrigatórios do Processo e Prazo
          </div>

          {/* Número do Processo */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Número do Processo Judicial <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={numeroProcesso}
              onChange={(e) => setNumeroProcesso(e.target.value)}
              placeholder="Ex: 0712345-89.2026.8.02.0001"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 font-mono bg-white ${
                errors.numeroProcesso
                  ? 'border-red-400 focus:ring-red-400 bg-red-50/30'
                  : 'border-slate-300 focus:ring-blue-500'
              }`}
            />
            {errors.numeroProcesso && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.numeroProcesso}
              </p>
            )}
          </div>

          {/* Número do Ofício / Requisição de Exame Pericial */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Número do ofício/Requisição de Exame Pericial <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="EX: 0000/0000/PCAL"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                errors.descricao
                  ? 'border-red-400 focus:ring-red-400 bg-red-50/30'
                  : 'border-slate-300 focus:ring-blue-500'
              }`}
            />
            {errors.descricao && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.descricao}
              </p>
            )}
          </div>

          {/* Bloco de Definição e Cálculo do Prazo */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-blue-700" />
                Prazo determinado pela Justiça? <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Opção SIM */}
                <label
                  className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                    temPrazoJudicial === true
                      ? 'border-[#274578] bg-blue-50/60 ring-2 ring-[#274578]/20'
                      : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="temPrazoJudicial"
                    checked={temPrazoJudicial === true}
                    onChange={() => setTemPrazoJudicial(true)}
                    className="mt-0.5 text-[#274578] focus:ring-[#274578]"
                  />
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">
                      Sim
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                      Há prazo fixado no ofício de requisição ou determinação do juízo.
                    </span>
                  </div>
                </label>

                {/* Opção NÃO */}
                <label
                  className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                    temPrazoJudicial === false
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="temPrazoJudicial"
                    checked={temPrazoJudicial === false}
                    onChange={() => setTemPrazoJudicial(false)}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">
                      Não
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                      Sem prazo expresso no ofício de Requisição.
                    </span>
                  </div>
                </label>
              </div>

              {errors.temPrazoJudicial && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.temPrazoJudicial}
                </p>
              )}
            </div>

            {/* Painel Específico: 1. Prazo Judicial */}
            {temPrazoJudicial === true && (
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3.5 animate-fade-in">
                <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#122443] uppercase tracking-wider">
                    <Scale className="w-4 h-4 text-[#274578]" />
                    Parâmetros do Prazo Judicial
                  </div>
                  <span className="text-[11px] font-semibold text-[#274578] bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                    Prazo Judicial
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Dia de Recebimento (Sem horário) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Dia de Recebimento <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={dataRecebimento}
                      onChange={(e) => setDataRecebimento(e.target.value)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                        errors.dataRecebimento
                          ? 'border-red-400 focus:ring-red-400 bg-red-50/30'
                          : 'border-slate-300 focus:ring-blue-500'
                      }`}
                    />
                    {errors.dataRecebimento && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.dataRecebimento}
                      </p>
                    )}
                  </div>

                  {/* Quantidade de Dias Concedida pela Justiça */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Prazo Concedido pela Justiça (em dias) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={diasPrazo}
                      onChange={(e) => setDiasPrazo(e.target.value)}
                      placeholder="Ex: 5, 10, 15, 30"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                        errors.diasPrazo
                          ? 'border-red-400 focus:ring-red-400 bg-red-50/30'
                          : 'border-slate-300 focus:ring-blue-500'
                      }`}
                    />
                    {errors.diasPrazo && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.diasPrazo}
                      </p>
                    )}
                  </div>
                </div>

                {/* Atalhos rápidos de quantidade de dias */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[11px] text-slate-500 font-medium">Atalhos rápidos:</span>
                  {[5, 10, 15, 20, 30, 45].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiasPrazo(String(d))}
                      className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors ${
                        diasPrazo === String(d)
                          ? 'bg-[#274578] text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      +{d} dias
                    </button>
                  ))}
                </div>

                {/* Data Final Calculada Automaticamente (Somente Leitura) */}
                <div className="p-3.5 bg-white rounded-xl border border-blue-200 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                        Data Final do Prazo Judicial (Calculada Automaticamente)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Considera o dia de recebimento como dia zero e soma os dias corridos concedidos.
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {dataFinalCalculada ? (
                        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 border border-blue-300 rounded-lg shadow-2xs">
                          <Calendar className="w-4 h-4 text-[#274578]" />
                          <span className="text-sm font-bold text-[#122443] font-mono">
                            {formatDatePtBR(dataFinalCalculada)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Informe o recebimento e os dias...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Painel Específico: 2. Sem Prazo Judicial (Meta Interna) */}
            {temPrazoJudicial === false && (
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3.5 animate-fade-in">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 uppercase tracking-wider">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    Prazo Estabelecido para Conclusão
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    Sem Prazo Expresso
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Dia de Recebimento (Sem horário) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Dia de Recebimento <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={dataRecebimento}
                      onChange={(e) => setDataRecebimento(e.target.value)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                        errors.dataRecebimento
                          ? 'border-red-400 focus:ring-red-400 bg-red-50/30'
                          : 'border-slate-300 focus:ring-indigo-500'
                      }`}
                    />
                    {errors.dataRecebimento && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.dataRecebimento}
                      </p>
                    )}
                  </div>

                  {/* Quantidade de Dias Definida como Prazo para Conclusão */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Prazo estabelecido para conclusão (em dias) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={diasPrazo}
                      onChange={(e) => setDiasPrazo(e.target.value)}
                      placeholder="Ex: 10, 15, 30"
                      className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                        errors.diasPrazo
                          ? 'border-red-400 focus:ring-red-400 bg-red-50/30'
                          : 'border-slate-300 focus:ring-indigo-500'
                      }`}
                    />
                    {errors.diasPrazo && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.diasPrazo}
                      </p>
                    )}
                  </div>
                </div>

                {/* Atalhos rápidos de metas comuns */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[11px] text-slate-500 font-medium">Metas usuais:</span>
                  {[7, 10, 15, 20, 30, 60].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiasPrazo(String(d))}
                      className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors ${
                        diasPrazo === String(d)
                          ? 'bg-indigo-700 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      +{d} dias
                    </button>
                  ))}
                </div>

                {/* Data Prevista para Conclusão Calculada Automaticamente */}
                <div className="p-3.5 bg-white rounded-xl border border-indigo-200 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                        Data Prevista para Conclusão (Calculada Automaticamente)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Soma o dia de recebimento (dia zero) à meta interna estabelecida pelo setor.
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {dataFinalCalculada ? (
                        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 border border-indigo-300 rounded-lg shadow-2xs">
                          <Calendar className="w-4 h-4 text-indigo-700" />
                          <span className="text-sm font-bold text-indigo-950 font-mono">
                            {formatDatePtBR(dataFinalCalculada)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Informe o recebimento e a meta de dias...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Justificativa / Observação (Sem Prazo Judicial) - Opcional */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Justificativa / Observação (Sem Prazo Judicial) <span className="text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={motivoPrazoInterno}
                    onChange={(e) => setMotivoPrazoInterno(e.target.value)}
                    placeholder="Ex: Fila de espera de equipamento; Aguardando chegada de peças padrão; Exame de alta complexidade..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>
            )}

            {temPrazoJudicial === null && (
              <p className="text-xs text-slate-400 italic text-center py-2">
                Selecione uma das opções acima para definir os parâmetros do prazo.
              </p>
            )}
          </div>

          {/* Setor e Tipo de Exame */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {availableSectors.length === 0 ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Setor Responsável <span className="text-red-500">*</span>
                  </label>
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Nenhum setor atribuído: </span>
                      Seu usuário não possui autorização em nenhum setor pericial. Solicite atribuição ao Administrador.
                    </div>
                  </div>
                </div>
              ) : (
                <SearchableSelect
                  size="form"
                  label="Setor Responsável"
                  required
                  options={availableSectors}
                  value={setorSolicitante}
                  onChange={(val) => {
                    setSetorSolicitante(val);
                    if (errors.setorSolicitante) setErrors({ ...errors, setorSolicitante: '' });
                  }}
                  placeholder="Selecione ou pesquise o setor..."
                  searchPlaceholder="Pesquisar setor pericial..."
                  error={errors.setorSolicitante}
                />
              )}
            </div>

            <div>
              <SearchableSelect
                size="form"
                label="Tipo de Exame"
                required
                options={TIPOS_DE_EXAME}
                value={tipoExame}
                onChange={(val) => {
                  setTipoExame(val);
                  if (errors.tipoExame) setErrors({ ...errors, tipoExame: '' });
                }}
                placeholder="Selecione ou pesquise o exame..."
                searchPlaceholder="Pesquisar tipo de exame..."
                error={errors.tipoExame}
              />
            </div>
          </div>
        </div>

        {/* Seção 2: Dados de Identificação e Anexos */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
            <FileText className="w-4 h-4 text-blue-600" />
            Dados de Identificação e Anexos
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Protocolo Geral <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={protocolo}
                onChange={(e) => {
                  setProtocolo(e.target.value);
                  if (errors.protocolo) setErrors((prev) => ({ ...prev, protocolo: '' }));
                }}
                placeholder="01.13526/2026"
                className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white ${
                  errors.protocolo ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                }`}
              />
              {errors.protocolo && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.protocolo}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                REP <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={rep}
                onChange={(e) => {
                  setRep(e.target.value);
                  if (errors.rep) setErrors((prev) => ({ ...prev, rep: '' }));
                }}
                placeholder="01.12635/2026"
                className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white ${
                  errors.rep ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                }`}
              />
              {errors.rep && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.rep}
                </p>
              )}
            </div>

            <div>
              <SearchableSelect
                size="form"
                label="Origem / Vara Solicitante"
                required
                options={ORIGENS_COMUNS}
                value={origem}
                onChange={(val) => {
                  setOrigem(val);
                  if (errors.origem) setErrors((prev) => ({ ...prev, origem: '' }));
                }}
                placeholder="Selecione ou pesquise a vara / origem..."
                searchPlaceholder="Pesquisar entre 124 comarcas, varas ou promotorias..."
                error={errors.origem}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Vestígio
              </label>
              <input
                type="text"
                value={vestigio}
                onChange={(e) => setVestigio(e.target.value)}
                placeholder="Revolver Taurus, CAL. 38, N° Serie KWG 12536"
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Partes (Acusado / Vítima)
              </label>
              <input
                type="text"
                value={acusadoVitima}
                onChange={(e) => setAcusadoVitima(e.target.value)}
                placeholder="Ex: Investigado: J.S. / Vítima: M.A."
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Referências
            </label>
            <input
              type="text"
              value={referencias}
              onChange={(e) => setReferencias(e.target.value)}
              placeholder="IP nº 104/2026"
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Anexos de PDF: Ofício, Decisão Judicial, E-mail, Laudos */}
          <div className="pt-3 border-t border-slate-200">
            <AttachmentSection
              attachments={anexos}
              onChange={(newAtts) => {
                setAnexos(newAtts);
                if (newAtts.length > 0 && errors.anexos) {
                  setErrors((prev) => ({ ...prev, anexos: '' }));
                }
              }}
              isRequired={true}
              processNumber={numeroProcesso || '0000000-00.2026.8.02.0001'}
              onPreviewAttachment={(att) => setPreviewAttachment(att)}
            />
            {errors.anexos && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.anexos}
              </p>
            )}
          </div>
        </div>

        {/* Seção 3: Status Operacional */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-blue-600" />
            Status Operacional
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Status Operacional <span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RequestStatus)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="Não iniciado">Não iniciado</option>
              <option value="Iniciado">Iniciado</option>
              <option value="Concluído">Concluído</option>
              <option value="Cancelado">Cancelado</option>
            </select>
            {errors.status && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.status}
              </p>
            )}

            {/* Anexo de Comprovação Obrigatório quando Concluído */}
            {status === 'Concluído' && (
              <div className="pt-2">
                <ProofAttachmentUpload
                  attachment={anexoComprovacao}
                  attachments={anexosComprovacao}
                  onChange={(att) => setAnexoComprovacao(att)}
                  onAttachmentsChange={(atts) => {
                    setAnexosComprovacao(atts);
                    setAnexoComprovacao(atts[0] || null);
                    if (atts.length > 0 && errors.anexoComprovacao) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.anexoComprovacao;
                        return next;
                      });
                    }
                  }}
                  onPreview={(att) => setPreviewAttachment(att)}
                  error={errors.anexoComprovacao}
                />
              </div>
            )}
          </div>

          {isEditing && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Motivo da Alteração (Opcional - Registrado no Histórico)
              </label>
              <input
                type="text"
                value={motivoAlteracao}
                onChange={(e) => setMotivoAlteracao(e.target.value)}
                placeholder="Ex: Prorrogação de prazo concedida pelo juízo; Aditamento de quesitos..."
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || availableSectors.length === 0}
            title={
              availableSectors.length === 0
                ? 'Usuário sem setor responsável atribuído. Operação bloqueada.'
                : undefined
            }
            className={`px-5 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 flex items-center gap-2 ${
              isSubmitting || availableSectors.length === 0 ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <span>{isEditing ? 'Salvar Alterações' : 'Cadastrar Requisição'}</span>
            )}
          </button>
        </div>
      </form>

      {/* Modal de Prévia do Documento PDF */}
      <PdfPreviewModal
        attachment={previewAttachment}
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        processNumber={numeroProcesso || '0000000-00.2026.8.02.0001'}
      />

      {/* Confirmação personalizada do sistema para descartar alterações não salvas */}
      <ConfirmDialog
        isOpen={isConfirmDiscardOpen}
        onClose={() => setIsConfirmDiscardOpen(false)}
        onConfirm={() => {
          setIsConfirmDiscardOpen(false);
          onClose();
        }}
        title="Descartar Alterações?"
        message="Existem dados preenchidos no formulário da requisição. Deseja realmente descartar e fechar?"
        confirmLabel="Descartar e Fechar"
        cancelLabel="Continuar Editando"
        isDestructive
        iconType="warning"
        zIndex="z-[70]"
      />
    </Modal>
  );
};
