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
  getExamesPorSetor,
} from '../../data/constants';
import { RequestStatus, PriorityLevel, JudicialRequest, RequestAttachment } from '../../types/request';
import {
  calculateDeadlineDate,
  formatDatePtBR,
  isRequestPrazoIndefinido,
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
  CheckCircle2,
  Zap,
  ClipboardList,
  UserCheck,
  Save,
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
  const { warning, error } = useToast();
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
  const [outroExame, setOutroExame] = useState('');

  // Exames dinâmicos baseados no setor responsável selecionado
  const availableExams = useMemo(() => {
    return getExamesPorSetor(setorSolicitante);
  }, [setorSolicitante]);

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

  // Modo de cadastro (Triagem Rápida vs Cadastro Completo)
  // Apenas Administradores podem realizar Triagem Rápida; usuários Operacionais realizam sempre o Cadastro Completo
  const isAdmin = currentUser.role === 'Administrador';
  const [modoCadastro, setModoCadastro] = useState<'triagem' | 'completo'>(
    isAdmin && !isEditing ? 'triagem' : 'completo'
  );

  const isTriagemAtiva = !isEditing && isAdmin && modoCadastro === 'triagem';
  const [salvandoComoRascunho, setSalvandoComoRascunho] = useState(false);

  // Cálculo de completude dos campos técnicos
  const camposTecnicosCalculados = useMemo(() => {
    let preenchidos = 0;
    const total = 9;

    if (numeroProcesso.trim()) preenchidos++;
    if (setorSolicitante) preenchidos++;
    if (descricao.trim()) preenchidos++;
    if (tipoExame && (tipoExame !== 'Outro' || outroExame.trim()) && tipoExame !== 'A definir pelo setor') preenchidos++;
    if (temPrazoJudicial !== null && dataRecebimento && diasPrazo) preenchidos++;
    if (origem.trim()) preenchidos++;
    if (protocolo.trim()) preenchidos++;
    if (rep.trim()) preenchidos++;
    if (anexos && anexos.length > 0) preenchidos++;

    const percentual = Math.round((preenchidos / total) * 100);
    const isCompleto = preenchidos === total;
    return { preenchidos, total, percentual, isCompleto };
  }, [
    numeroProcesso,
    setorSolicitante,
    descricao,
    tipoExame,
    outroExame,
    temPrazoJudicial,
    dataRecebimento,
    diasPrazo,
    origem,
    protocolo,
    rep,
    anexos,
  ]);

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
    outroExame: string;
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

    // Regra institucional: Apenas Administradores têm acesso à Triagem Rápida.
    // Usuários Operacionais sempre abrem no Modo Completo (forma anterior).
    if (!isAdmin) {
      setModoCadastro('completo');
    } else if (!isEditing) {
      setModoCadastro('triagem');
    } else {
      setModoCadastro('completo');
    }

    if (initialData) {
      const proc = initialData.numeroProcesso || '';
      const desc = initialData.descricao || '';
      const setor = initialData.setorSolicitante || '';
      const rawTipo = initialData.tipoExame || '';
      let tipo = rawTipo;
      let outroVal = '';
      if (rawTipo.startsWith('Outro: ')) {
        tipo = 'Outro';
        outroVal = rawTipo.slice(7);
      } else if (rawTipo === 'Outro') {
        tipo = 'Outro';
        outroVal = '';
      }

      const isPrazoIndef = isRequestPrazoIndefinido(initialData);

      const temPrazo = isPrazoIndef
        ? null
        : initialData.temPrazoJudicial !== undefined
        ? initialData.temPrazoJudicial
        : initialData.tipoPrazo !== 'interno';

      const dataRec = isPrazoIndef
        ? ''
        : initialData.dataRecebimento
        ? initialData.dataRecebimento
        : initialData.criadoEm
        ? initialData.criadoEm.slice(0, 10)
        : initialData.prazoJudicial
        ? initialData.prazoJudicial.slice(0, 10)
        : '';

      let diasStr = '';
      if (!isPrazoIndef) {
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
      setOutroExame(outroVal);
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
        outroExame: outroVal,
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
      setOutroExame('');
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
        outroExame: '',
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
  }, [initialData, isOpen, currentUser.role, isAdmin, isEditing]);

  const currentSnapshot = buildSnapshot({
    numeroProcesso,
    descricao,
    setorSolicitante,
    tipoExame,
    outroExame,
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

  const validate = (isRascunho = false): boolean => {
    const newErrors: Record<string, string> = {};

    const numClean = numeroProcesso.trim();
    if (!numClean) {
      newErrors.numeroProcesso = 'O número do processo judicial é obrigatório.';
    } else {
      // Impedir cadastros duplicados (Processo Judicial)
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

    if (!setorSolicitante) {
      newErrors.setorSolicitante = 'Selecione o setor responsável.';
    } else if (!availableSectors.includes(setorSolicitante)) {
      newErrors.setorSolicitante = 'Você não possui permissão para atuar no setor selecionado.';
    }

    // Se for Triagem Rápida pelo Administrador: exige exatamente os 4 campos solicitados
    if (isTriagemAtiva) {
      if (!tipoExame) {
        newErrors.tipoExame = 'Selecione o tipo de exame.';
      } else if (tipoExame === 'Outro' && !outroExame.trim()) {
        newErrors.outroExame = 'Especifique o tipo de exame pericial.';
      }

      if (!protocolo.trim()) {
        newErrors.protocolo = 'O Protocolo Geral é obrigatório.';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    // Se for Salvamento de Rascunho/Parcial pelo Operacional
    if (isRascunho) {
      if (tipoExame === 'Outro' && !outroExame.trim()) {
        newErrors.outroExame = 'Especifique o tipo de exame pericial.';
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    // Validações completas para cadastro final / conclusão
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

    if (!tipoExame) {
      newErrors.tipoExame = 'Selecione o tipo de exame.';
    } else if (tipoExame === 'Outro' && !outroExame.trim()) {
      newErrors.outroExame = 'Especifique o tipo de exame pericial.';
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

  const handleSaveAction = (isRascunho = false) => {
    if (isSubmitting) return;

    if (isEditing && initialData?.statusOperacional === 'Aguardando recebimento' && currentUser.role !== 'Administrador') {
      error(
        'Ação Não Permitida',
        'Demandas aguardando recebimento só podem ser visualizadas. Receba a demanda antes de editar dados técnicos.'
      );
      return;
    }

    if (!validate(isRascunho)) {
      warning(
        'Campos Obrigatórios',
        'Por favor, corrija os erros indicados nos campos antes de salvar.'
      );
      return;
    }

    setIsSubmitting(true);
    setSalvandoComoRascunho(isRascunho);

    const isTriagem = isTriagemAtiva;

    // Prazo calculado ou a definir pelo setor na triagem rápida
    const prazoIso = isTriagem
      ? ''
      : dataFinalCalculada
      ? `${dataFinalCalculada}T23:59:59`
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() + 10);
          d.setHours(23, 59, 59, 999);
          return d.toISOString();
        })();

    const manualVal = prioridadeManual === 'auto' ? null : prioridadeManual;
    const finalTemPrazo = isTriagem ? undefined : (temPrazoJudicial !== null ? temPrazoJudicial : true);
    const finalStatus = (status as RequestStatus) || 'Não iniciado';
    const diasNum = isTriagem ? undefined : (diasPrazo ? parseInt(diasPrazo, 10) : 10);
    const finalTipoExame =
      tipoExame === 'Outro'
        ? (outroExame.trim() ? `Outro: ${outroExame.trim()}` : 'Outro')
        : (tipoExame || 'A definir pelo setor');

    const isCompleto = !isRascunho && (modoCadastro === 'completo' || isEditing) && camposTecnicosCalculados.isCompleto;

    const payload: any = {
      numeroProcesso: numeroProcesso.trim(),
      descricao: descricao.trim() || 'Demanda encaminhada para recebimento e preenchimento técnico pelo setor.',
      setorSolicitante,
      prazoJudicial: prazoIso,
      dataRecebimento: isTriagem ? undefined : (dataRecebimento || new Date().toISOString().slice(0, 10)),
      diasPrazo: diasNum,
      tipoExame: finalTipoExame,
      vestigio: vestigio.trim() || undefined,
      acusadoVitima: acusadoVitima.trim() || undefined,
      protocolo: protocolo.trim() || undefined,
      rep: rep.trim() || undefined,
      origem: origem.trim() || undefined,
      referencias: referencias.trim() || undefined,
      anexos,
      anexoComprovacao: status === 'Concluído' ? (anexosComprovacao[0] || undefined) : undefined,
      anexosComprovacao: status === 'Concluído' ? (anexosComprovacao.length > 0 ? anexosComprovacao : undefined) : undefined,
      status: finalStatus,
      prioridadeManual: manualVal,
      temPrazoJudicial: finalTemPrazo,
      tipoPrazo: finalTemPrazo !== undefined ? (finalTemPrazo ? ('judicial' as const) : ('interno' as const)) : undefined,
      motivoPrazoInterno: !finalTemPrazo && !isTriagem ? motivoPrazoInterno : undefined,
      cadastroCompleto: isCompleto,
      prazoIndefinido: isTriagem ? true : false,
    };

    if (isTriagem) {
      payload.statusOperacional = 'Aguardando recebimento';
      payload.cadastroCompleto = false;
      payload.prazoIndefinido = true;
    }

    try {
      if (isEditing && initialData) {
        const success = updateRequest(
          initialData.id,
          payload,
          isRascunho ? 'Salvamento de rascunho / preenchimento parcial' : (motivoAlteracao || 'Edição cadastral dos autos')
        );
        if (success) onClose();
      } else {
        const success = addRequest(payload);
        if (success) onClose();
      }
    } finally {
      setIsSubmitting(false);
      setSalvandoComoRascunho(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isRascunho = isEditing
      ? !camposTecnicosCalculados.isCompleto
      : !isTriagemAtiva && !camposTecnicosCalculados.isCompleto;
    handleSaveAction(isRascunho);
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
        {/* Seletor de Modo (Administrador criando nova requisição) */}
        {!isEditing && currentUser.role === 'Administrador' && (
          <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Fluxo de Cadastro Descentralizado
                </p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Escolha se deseja apenas despachar para a fila do setor ou preencher o formulário completo.
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-blue-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setModoCadastro('triagem')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                    isTriagemAtiva
                      ? 'bg-blue-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Triagem Rápida
                </button>
                <button
                  type="button"
                  onClick={() => setModoCadastro('completo')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                    !isTriagemAtiva
                      ? 'bg-blue-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  Cadastro Completo
                </button>
              </div>
            </div>

            {isTriagemAtiva && (
              <div className="mt-2.5 pt-2.5 border-t border-blue-200/60 text-xs text-blue-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Modo Triagem Ativo:</strong> Preencha apenas os 4 campos essenciais: <strong>Número do Processo</strong>, <strong>Setor Responsável</strong>, <strong>Tipo de Exame</strong> e <strong>Protocolo Geral</strong>. Os demais campos (ofício, prazos, anexos e vestígios) ficam pendentes para preenchimento pelo perito do setor ao receber a demanda.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Indicador de Status Operacional e Completude Cadastral (Em Edição) */}
        {isEditing && (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-700" />
                    Responsável Operacional:
                  </span>
                  <span className="text-xs font-bold text-blue-900 bg-blue-100/70 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {initialData?.responsavelOperacionalNome || 'Fila do Setor (Aguardando Recebimento)'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Status Operacional: <strong>{initialData?.statusOperacional || 'Aguardando recebimento'}</strong> • Status Legal: <strong>{initialData?.status}</strong>
                </p>
              </div>

              {/* Barra de Completude */}
              <div className="w-full sm:w-56 bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-600">Completude Técnica</span>
                  <span className={`font-bold ${camposTecnicosCalculados.isCompleto ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {camposTecnicosCalculados.preenchidos}/{camposTecnicosCalculados.total} ({camposTecnicosCalculados.percentual}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      camposTecnicosCalculados.isCompleto ? 'bg-emerald-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${camposTecnicosCalculados.percentual}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTEÚDO DO FORMULÁRIO: MODO TRIAGEM (4 CAMPOS) OU FORMULÁRIO COMPLETO */}
        {isTriagemAtiva ? (
          /* MODO TRIAGEM RÁPIDA: APENAS OS 4 CAMPOS OBRIGATÓRIOS */
          <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-200 space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <Zap className="w-4 h-4 text-amber-500" />
              Informações Obrigatórias da Triagem Inicial (4 Campos)
            </div>

            {/* 1. Número do Processo Judicial */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Número do Processo Judicial <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={numeroProcesso}
                onChange={(e) => {
                  setNumeroProcesso(e.target.value);
                  if (errors.numeroProcesso) setErrors((prev) => ({ ...prev, numeroProcesso: '' }));
                }}
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

            {/* 2. Setor Responsável & 3. Tipo de Exame */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <SearchableSelect
                  size="form"
                  label="Setor Responsável"
                  required
                  options={availableSectors}
                  value={setorSolicitante}
                  onChange={(val) => {
                    setSetorSolicitante(val);
                    if (errors.setorSolicitante) setErrors((prev) => ({ ...prev, setorSolicitante: '' }));
                    const validExams = getExamesPorSetor(val);
                    if (tipoExame && !validExams.includes(tipoExame)) {
                      setTipoExame('');
                      setOutroExame('');
                    }
                  }}
                  placeholder="Selecione ou pesquise o setor..."
                  searchPlaceholder="Pesquisar setor pericial..."
                  error={errors.setorSolicitante}
                />
              </div>

              <div>
                <SearchableSelect
                  size="form"
                  label="Tipo de Exame"
                  required
                  options={availableExams}
                  value={tipoExame}
                  onChange={(val) => {
                    setTipoExame(val);
                    if (val !== 'Outro') {
                      setOutroExame('');
                      if (errors.outroExame) {
                        setErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.outroExame;
                          return copy;
                        });
                      }
                    }
                    if (errors.tipoExame) setErrors((prev) => ({ ...prev, tipoExame: '' }));
                  }}
                  disabled={!setorSolicitante}
                  placeholder={
                    setorSolicitante
                      ? 'Selecione ou pesquise o exame...'
                      : 'Selecione o setor responsável primeiro...'
                  }
                  searchPlaceholder="Pesquisar tipo de exame..."
                  error={errors.tipoExame}
                />

                {tipoExame === 'Outro' && (
                  <div className="mt-2.5 animate-fade-in">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Especificar Exame Pericial <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={outroExame}
                      onChange={(e) => {
                        setOutroExame(e.target.value);
                        if (errors.outroExame) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.outroExame;
                            return copy;
                          });
                        }
                      }}
                      placeholder="Ex: Exame de Perícia Metalográfica"
                      className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white ${
                        errors.outroExame ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                      }`}
                    />
                    {errors.outroExame && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.outroExame}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 4. Protocolo Geral */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Protocolo Geral <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={protocolo}
                onChange={(e) => {
                  setProtocolo(e.target.value);
                  if (errors.protocolo) setErrors((prev) => ({ ...prev, protocolo: '' }));
                }}
                placeholder="Ex: 01.12345/2026"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                  errors.protocolo
                    ? 'border-red-400 focus:ring-red-400 bg-red-50/30'
                    : 'border-slate-300 focus:ring-blue-500'
                }`}
              />
              {errors.protocolo && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.protocolo}
                </p>
              )}
            </div>

            <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-lg text-xs text-blue-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <span>
                <strong>Próxima etapa:</strong> Ao despachar esta demanda, os peritos autorizados do setor <strong>{setorSolicitante || 'selecionado'}</strong> poderão efetuar o recebimento e o preenchimento técnico complementar (número do ofício, prazos, anexos em PDF, REP e vestígios).
              </span>
            </div>
          </div>
        ) : (
          /* MODO CADASTRO COMPLETO OU EDIÇÃO PELO OPERACIONAL */
          <>
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
                    if (errors.setorSolicitante) setErrors((prev) => ({ ...prev, setorSolicitante: '' }));
                    const validExams = getExamesPorSetor(val);
                    if (tipoExame && !validExams.includes(tipoExame)) {
                      setTipoExame('');
                      setOutroExame('');
                    }
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
                options={availableExams}
                value={tipoExame}
                onChange={(val) => {
                  setTipoExame(val);
                  if (val !== 'Outro') {
                    setOutroExame('');
                    if (errors.outroExame) {
                      setErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.outroExame;
                        return copy;
                      });
                    }
                  }
                  if (errors.tipoExame) setErrors((prev) => ({ ...prev, tipoExame: '' }));
                }}
                disabled={!setorSolicitante}
                placeholder={
                  setorSolicitante
                    ? 'Selecione ou pesquise o exame...'
                    : 'Selecione o setor responsável primeiro...'
                }
                searchPlaceholder="Pesquisar tipo de exame..."
                error={errors.tipoExame}
              />

              {tipoExame === 'Outro' && (
                <div className="mt-2.5 animate-fade-in">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Especificar Exame Pericial <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={outroExame}
                    onChange={(e) => {
                      setOutroExame(e.target.value);
                      if (errors.outroExame) {
                        setErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.outroExame;
                          return copy;
                        });
                      }
                    }}
                    placeholder="Ex: Exame de Perícia Metalográfica"
                    className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white ${
                      errors.outroExame ? 'border-red-400 bg-red-50/30' : 'border-slate-300'
                    }`}
                  />
                  {errors.outroExame && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.outroExame}
                    </p>
                  )}
                </div>
              )}
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

        </div>
        </>
        )}

        {/* Botões de Ação */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2.5">
            {/* Botão Único e Inteligente de Salvamento:
                - Completude < 100%: Salva diretamente em "Rascunho" sem exigir campos pendentes.
                - Completude 100%: Salva diretamente como "Concluir Cadastro / Salvar".
                Elimina a dúvida do usuário sobre qual botão clicar. */}
            {isEditing ? (
              !camposTecnicosCalculados.isCompleto ? (
                <button
                  type="submit"
                  disabled={isSubmitting || availableSectors.length === 0}
                  title="Completude técnica abaixo de 100%. Salva o progresso atual diretamente em rascunho sem bloquear campos pendentes."
                  className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando Rascunho...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar Rascunho</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || availableSectors.length === 0}
                  title="Todas as informações técnicas foram preenchidas (100%). Conclui o cadastro da requisição."
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Concluir Cadastro / Salvar</span>
                    </>
                  )}
                </button>
              )
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || availableSectors.length === 0}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>
                    {isTriagemAtiva
                      ? 'Despachar para o Setor'
                      : !camposTecnicosCalculados.isCompleto
                      ? 'Salvar Rascunho'
                      : 'Cadastrar Requisição'}
                  </span>
                )}
              </button>
            )}
          </div>
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
