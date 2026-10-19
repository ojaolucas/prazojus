import React, { useState, useEffect } from 'react';
import { useRequests } from '../../context/RequestContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../layout/Modal';
import {
  SETORES_SOLICITANTES,
  TIPOS_DE_EXAME,
  ORIGENS_COMUNS,
} from '../../data/constants';
import { RequestStatus, PriorityLevel, JudicialRequest } from '../../types/request';
import { AlertCircle, Calendar, Hash, Tag, FileText, Sliders } from 'lucide-react';

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

  const isEditing = !!initialData;

  // Form State
  const [numeroProcesso, setNumeroProcesso] = useState('');
  const [descricao, setDescricao] = useState('');
  const [setorSolicitante, setSetorSolicitante] = useState(SETORES_SOLICITANTES[0]);
  const [prazoJudicial, setPrazoJudicial] = useState('');
  const [tipoExame, setTipoExame] = useState(TIPOS_DE_EXAME[0]);
  const [vestigio, setVestigio] = useState('');
  const [acusadoVitima, setAcusadoVitima] = useState('');
  const [protocolo, setProtocolo] = useState('');
  const [rep, setRep] = useState('');
  const [origem, setOrigem] = useState(ORIGENS_COMUNS[0]);
  const [referencias, setReferencias] = useState('');
  const [status, setStatus] = useState<RequestStatus>('Pendente');
  const [prioridadeManual, setPrioridadeManual] = useState<PriorityLevel | 'auto'>('auto');
  const [motivoAlteracao, setMotivoAlteracao] = useState('');

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setNumeroProcesso(initialData.numeroProcesso || '');
      setDescricao(initialData.descricao || '');
      setSetorSolicitante(initialData.setorSolicitante || SETORES_SOLICITANTES[0]);

      // Formata data para datetime-local (YYYY-MM-DDTHH:mm)
      if (initialData.prazoJudicial) {
        const d = new Date(initialData.prazoJudicial);
        const pad = (n: number) => String(n).padStart(2, '0');
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setPrazoJudicial(formatted);
      } else {
        setPrazoJudicial('');
      }

      setTipoExame(initialData.tipoExame || TIPOS_DE_EXAME[0]);
      setVestigio(initialData.vestigio || '');
      setAcusadoVitima(initialData.acusadoVitima || '');
      setProtocolo(initialData.protocolo || '');
      setRep(initialData.rep || '');
      setOrigem(initialData.origem || ORIGENS_COMUNS[0]);
      setReferencias(initialData.referencias || '');
      setStatus(initialData.status || 'Pendente');
      setPrioridadeManual(initialData.prioridadeManual || 'auto');
      setMotivoAlteracao('');
    } else {
      // Default para nova requisição: 7 dias a partir de agora às 18:00
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      defaultDate.setHours(18, 0, 0, 0);
      const pad = (n: number) => String(n).padStart(2, '0');
      const formatted = `${defaultDate.getFullYear()}-${pad(defaultDate.getMonth() + 1)}-${pad(defaultDate.getDate())}T18:00`;

      setNumeroProcesso('');
      setDescricao('');
      setSetorSolicitante(SETORES_SOLICITANTES[0]);
      setPrazoJudicial(formatted);
      setTipoExame(TIPOS_DE_EXAME[0]);
      setVestigio('');
      setAcusadoVitima('');
      setProtocolo(`PROT-${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`);
      setRep(`REP-${Math.floor(100 + Math.random() * 900)}/${new Date().getFullYear()}`);
      setOrigem(ORIGENS_COMUNS[0]);
      setReferencias('');
      setStatus('Pendente');
      setPrioridadeManual('auto');
      setMotivoAlteracao('');
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

    if (!setorSolicitante) {
      newErrors.setorSolicitante = 'Selecione o setor solicitante.';
    }

    if (!prazoJudicial) {
      newErrors.prazoJudicial = 'O prazo judicial de vencimento é obrigatório.';
    } else {
      const d = new Date(prazoJudicial);
      if (isNaN(d.getTime())) {
        newErrors.prazoJudicial = 'Informe uma data e hora válidas.';
      }
    }

    if (!tipoExame) {
      newErrors.tipoExame = 'Selecione o tipo de exame pericial.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Normaliza ISO string para data
    const prazoIso = new Date(prazoJudicial).toISOString();
    const manualVal = prioridadeManual === 'auto' ? null : prioridadeManual;

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
          status,
          prioridadeManual: manualVal,
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
        status,
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
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

            {/* Prazo Judicial */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Prazo Judicial Limite <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={prazoJudicial}
                onChange={(e) => setPrazoJudicial(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.prazoJudicial
                    ? 'border-red-400 focus:ring-red-400 bg-red-50/30'
                    : 'border-slate-300 focus:ring-blue-500'
                }`}
              />
              {errors.prazoJudicial && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.prazoJudicial}
                </p>
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
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {SETORES_SOLICITANTES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tipo de Exame Pericial <span className="text-red-500">*</span>
              </label>
              <select
                value={tipoExame}
                onChange={(e) => setTipoExame(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {TIPOS_DE_EXAME.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
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

        {/* Seção 3: Status e Classificação Manual de Prioridade */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-blue-600" />
            Status e Classificação de Prioridade
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Status Operacional
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RequestStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Pendente">Pendente (Aguardando início)</option>
                <option value="Em andamento">Em andamento (Em perícia)</option>
                <option value="Aguardando informações">Aguardando informações / Quesitos</option>
                {can('canConcludeRequest') && (
                  <option value="Concluído">Concluído (Laudo entregue)</option>
                )}
                {can('canCancelRequest') && (
                  <option value="Cancelado">Cancelado (Revogado)</option>
                )}
                <option value="Vencido">Vencido (Prazo expirado)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                * Se o prazo expirar sem conclusão, o sistema atualiza automaticamente para Vencido.
              </p>
            </div>

            {/* Prioridade Manual */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Classificação de Prioridade
              </label>
              <select
                value={prioridadeManual}
                onChange={(e) =>
                  setPrioridadeManual(e.target.value as PriorityLevel | 'auto')
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="auto">Automática (Calculada pela proximidade do prazo)</option>
                <option value="Baixa">Manual: Baixa</option>
                <option value="Média">Manual: Média</option>
                <option value="Alta">Manual: Alta</option>
                <option value="Urgente">Manual: Urgente</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                A prioridade manual permanece até nova alteração, mantendo a prioridade calculada visível para referência.
              </p>
            </div>
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
