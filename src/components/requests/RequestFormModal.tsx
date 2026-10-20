import React, { useState, useEffect } from 'react';
import { useRequests } from '../../context/RequestContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../layout/Modal';
import {
  SETORES_SOLICITANTES,
  TIPOS_DE_EXAME,
  ORIGENS_COMUNS,
} from '../../data/constants';
import { RequestStatus, PriorityLevel, JudicialRequest } from '../../types/request';
import { AlertCircle, Calendar, Hash, Tag, FileText, Sliders, Scale, Building2, Sparkles } from 'lucide-react';

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
  const { addRequest, updateRequest } = useRequests();
  const { can } = useAuth();
  const { warning } = useToast();

  const isEditing = !!initialData;

  // Form State
  const [numeroProcesso, setNumeroProcesso] = useState('');
  const [descricao, setDescricao] = useState('');
  const [setorSolicitante, setSetorSolicitante] = useState('');
  const [prazoJudicial, setPrazoJudicial] = useState('');
  const [tipoExame, setTipoExame] = useState('');
  const [vestigio, setVestigio] = useState('');
  const [acusadoVitima, setAcusadoVitima] = useState('');
  const [protocolo, setProtocolo] = useState('');
  const [rep, setRep] = useState('');
  const [origem, setOrigem] = useState('');
  const [referencias, setReferencias] = useState('');
  const [status, setStatus] = useState<RequestStatus | ''>('');
  const [prioridadeManual, setPrioridadeManual] = useState<PriorityLevel | 'auto'>('auto');
  const [motivoAlteracao, setMotivoAlteracao] = useState('');
  const [temPrazoJudicial, setTemPrazoJudicial] = useState<boolean | null>(null);
  const [motivoPrazoInterno, setMotivoPrazoInterno] = useState<string>('');

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});

  const aplicarPrazoDias = (dias: number) => {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    d.setHours(18, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    setPrazoJudicial(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T18:00`);
  };

  useEffect(() => {
    if (initialData) {
      setNumeroProcesso(initialData.numeroProcesso || '');
      setDescricao(initialData.descricao || '');
      setSetorSolicitante(initialData.setorSolicitante || '');

      // Formata data para datetime-local (YYYY-MM-DDTHH:mm)
      if (initialData.prazoJudicial) {
        const d = new Date(initialData.prazoJudicial);
        const pad = (n: number) => String(n).padStart(2, '0');
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setPrazoJudicial(formatted);
      } else {
        setPrazoJudicial('');
      }

      setTipoExame(initialData.tipoExame || '');
      setVestigio(initialData.vestigio || '');
      setAcusadoVitima(initialData.acusadoVitima || '');
      setProtocolo(initialData.protocolo || '');
      setRep(initialData.rep || '');
      setOrigem(initialData.origem || '');
      setReferencias(initialData.referencias || '');
      setStatus(
        initialData.status === 'Pendente'
          ? 'Não iniciado'
          : initialData.status === 'Em andamento' || initialData.status === 'Aguardando informações'
          ? 'Iniciado'
          : initialData.status || 'Não iniciado'
      );
      setPrioridadeManual('auto');
      setMotivoAlteracao('');
      setTemPrazoJudicial(
        initialData.temPrazoJudicial !== undefined
          ? initialData.temPrazoJudicial
          : initialData.tipoPrazo !== 'interno'
      );
      setMotivoPrazoInterno(initialData.motivoPrazoInterno || '');
    } else {
      // Nova requisição: nenhum campo auto-preenchido, usuário seleciona todos
      setNumeroProcesso('');
      setDescricao('');
      setSetorSolicitante('');
      setPrazoJudicial('');
      setTipoExame('');
      setVestigio('');
      setAcusadoVitima('');
      setProtocolo('');
      setRep('');
      setOrigem('');
      setReferencias('');
      setStatus('');
      setPrioridadeManual('auto');
      setMotivoAlteracao('');
      setTemPrazoJudicial(null);
      setMotivoPrazoInterno('');
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!numeroProcesso.trim()) {
      newErrors.numeroProcesso = 'O número do processo judicial é obrigatório.';
    }

    if (!descricao.trim()) {
      newErrors.descricao = 'A descrição do objeto da perícia é obrigatória.';
    }

    if (temPrazoJudicial === null) {
      newErrors.temPrazoJudicial = 'Selecione se o prazo é judicial ou meta interna.';
    }

    if (!prazoJudicial) {
      newErrors.prazoJudicial =
        temPrazoJudicial === true
          ? 'O prazo judicial de vencimento é obrigatório.'
          : 'A data limite é obrigatória.';
    } else {
      const d = new Date(prazoJudicial);
      if (isNaN(d.getTime())) {
        newErrors.prazoJudicial = 'Informe uma data e hora válidas.';
      }
    }

    if (!setorSolicitante) {
      newErrors.setorSolicitante = 'Selecione o setor solicitante.';
    }

    if (!tipoExame) {
      newErrors.tipoExame = 'Selecione o tipo de exame pericial.';
    }

    if (!status) {
      newErrors.status = 'Selecione o status operacional.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      warning(
        'Campos Obrigatórios',
        'Por favor, preencha todos os campos obrigatórios marcados com *.'
      );
      return;
    }

    // Normaliza ISO string para data
    const prazoIso = new Date(prazoJudicial).toISOString();
    const manualVal = prioridadeManual === 'auto' ? null : prioridadeManual;
    const finalTemPrazo = temPrazoJudicial !== null ? temPrazoJudicial : true;
    const finalStatus = (status as RequestStatus) || 'Não iniciado';

    if (isEditing && initialData) {
      const success = updateRequest(
        initialData.id,
        {
          numeroProcesso,
          descricao,
          setorSolicitante,
          prazoJudicial: prazoIso,
          tipoExame,
          vestigio,
          acusadoVitima,
          protocolo,
          rep,
          origem,
          referencias,
          status: finalStatus,
          prioridadeManual: manualVal,
          temPrazoJudicial: finalTemPrazo,
          tipoPrazo: finalTemPrazo ? 'judicial' : 'interno',
          motivoPrazoInterno: !finalTemPrazo ? motivoPrazoInterno : undefined,
        },
        motivoAlteracao || 'Edição cadastral dos autos'
      );
      if (success) onClose();
    } else {
      const success = addRequest({
        numeroProcesso,
        descricao,
        setorSolicitante,
        prazoJudicial: prazoIso,
        tipoExame,
        vestigio,
        acusadoVitima,
        protocolo,
        rep,
        origem,
        referencias,
        prioridadeManual: manualVal,
        status: finalStatus,
        temPrazoJudicial: finalTemPrazo,
        tipoPrazo: finalTemPrazo ? 'judicial' : 'interno',
        motivoPrazoInterno: !finalTemPrazo ? motivoPrazoInterno : undefined,
      });
      if (success) onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Requisição Judicial' : 'Cadastrar Nova Requisição'}
      subtitle={
        isEditing
          ? `Atualizando autos do processo ${initialData?.numeroProcesso}`
          : 'Preencha os dados do processo e prazo judicial determinado pelo juízo'
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
              placeholder="Ex: 0003892-14.2026.8.26.0100"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 font-mono ${
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

          {/* Painel de Controle: Prazo da Justiça (Sim ou Não / Meta Interna Customizada) */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
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
                      ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500'
                      : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="temPrazoJudicial"
                    checked={temPrazoJudicial === true}
                    onChange={() => setTemPrazoJudicial(true)}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 text-xs block">
                      Sim – Prazo Judicial
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                      Há prazo fixado no ofício ou despacho judicial.
                    </span>
                  </div>
                </label>

                {/* Opção NÃO */}
                <label
                  className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                    temPrazoJudicial === false
                      ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
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
                    <span className="font-semibold text-slate-900 text-xs block">
                      Não – Sem Prazo Judicial
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                      Sem prazo no ofício (meta interna definida pelo setor).
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

            {/* Input da Data */}
            <div className="pt-2 border-t border-slate-100">
              <div className="mb-1.5">
                <label className="text-xs font-semibold">
                  {temPrazoJudicial === true ? (
                    <span className="text-slate-800 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-slate-600" />
                      Data Limite Judicial <span className="text-red-500">*</span>
                    </span>
                  ) : temPrazoJudicial === false ? (
                    <span className="text-indigo-900 flex items-center gap-1.5 font-bold">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                      Data Limite (Sem Prazo Judicial) <span className="text-red-500">*</span>
                    </span>
                  ) : (
                    <span className="text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      Data Limite <span className="text-red-500">*</span>
                    </span>
                  )}
                </label>
              </div>

              <input
                type="datetime-local"
                value={prazoJudicial}
                onChange={(e) => setPrazoJudicial(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.prazoJudicial
                    ? 'border-red-400 focus:ring-red-400 bg-red-50/30'
                    : temPrazoJudicial === true
                    ? 'border-slate-300 focus:ring-blue-500'
                    : temPrazoJudicial === false
                    ? 'border-indigo-300 focus:ring-indigo-500 bg-indigo-50/20'
                    : 'border-slate-300 focus:ring-blue-500'
                }`}
              />
              {errors.prazoJudicial && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.prazoJudicial}
                </p>
              )}

              {/* Justificativa quando for Sem Prazo Judicial */}
              {temPrazoJudicial === false && (
                <div className="mt-2.5 animate-fade-in">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Justificativa / Observação (Sem Prazo Judicial - Opcional):
                  </label>
                  <input
                    type="text"
                    value={motivoPrazoInterno}
                    onChange={(e) => setMotivoPrazoInterno(e.target.value)}
                    placeholder="Ex: Fila de espera de equipamento; Aguardando chegada de peças padrão; Exame de alta complexidade..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Setor e Tipo de Exame */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Setor Solicitante <span className="text-red-500">*</span>
              </label>
              <select
                value={setorSolicitante}
                onChange={(e) => setSetorSolicitante(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                  errors.setorSolicitante
                    ? 'border-red-400 focus:ring-red-400 bg-red-50/30'
                    : 'border-slate-300 focus:ring-blue-500'
                }`}
              >
                <option value="">Selecione o setor solicitante...</option>
                {SETORES_SOLICITANTES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {errors.setorSolicitante && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.setorSolicitante}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tipo de Exame Pericial <span className="text-red-500">*</span>
              </label>
              <select
                value={tipoExame}
                onChange={(e) => setTipoExame(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                  errors.tipoExame
                    ? 'border-red-400 focus:ring-red-400 bg-red-50/30'
                    : 'border-slate-300 focus:ring-blue-500'
                }`}
              >
                <option value="">Selecione o tipo de exame...</option>
                {TIPOS_DE_EXAME.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.tipoExame && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.tipoExame}
                </p>
              )}
            </div>
          </div>

          {/* Descrição do Objeto */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Descrição Detalhada do Objeto da Perícia <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva minuciosamente a perícia requisitada pelo juízo, quesitos principais e especificidades."
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
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
        </div>

        {/* Seção 2: Identificação e Referências Opcionais */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
            <FileText className="w-4 h-4 text-blue-600" />
            Dados Complementares e Identificação (Opcionais)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Protocolo Geral
              </label>
              <input
                type="text"
                value={protocolo}
                onChange={(e) => setProtocolo(e.target.value)}
                placeholder="Ex: PROT-2026/0890"
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                REP (Entrada de Peças)
              </label>
              <input
                type="text"
                value={rep}
                onChange={(e) => setRep(e.target.value)}
                placeholder="Ex: REP-0533/2026"
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Origem / Vara Solicitante
              </label>
              <select
                value={origem}
                onChange={(e) => setOrigem(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Selecione a vara / origem (opcional)...</option>
                {ORIGENS_COMUNS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Vestígio / Amostra Coletada
              </label>
              <input
                type="text"
                value={vestigio}
                onChange={(e) => setVestigio(e.target.value)}
                placeholder="Ex: Celular apreendido lacre nº 489, Lâmina com sangue seco..."
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Referências Adicionais (Inquérito, BO, Observações)
            </label>
            <input
              type="text"
              value={referencias}
              onChange={(e) => setReferencias(e.target.value)}
              placeholder="Ex: IPL nº 104/2026 - 14º DP • Urgência solicitada em audiência de custódia"
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
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
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 bg-white ${
                errors.status
                  ? 'border-red-400 focus:ring-red-400 bg-red-50/30'
                  : 'border-slate-300 focus:ring-blue-500'
              }`}
            >
              <option value="">Selecione o status operacional...</option>
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
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Requisição'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
