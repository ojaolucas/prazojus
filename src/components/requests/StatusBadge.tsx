import React from 'react';
import { RequestStatus, PriorityLevel } from '../../types/request';
import { STATUS_CONFIG, PRIORIDADE_CONFIG } from '../../data/constants';
import { calculatePriority } from '../../services/deadlineService';
import { Check, ShieldAlert, Sliders, Scale, Building2, Clock } from 'lucide-react';

interface TipoPrazoBadgeProps {
  tipo?: 'judicial' | 'interno';
  tipoPrazo?: 'judicial' | 'interno';
  temPrazoJudicial?: boolean;
  prazoIndefinido?: boolean;
  size?: 'sm' | 'md';
}

export const TipoPrazoBadge: React.FC<TipoPrazoBadgeProps> = ({
  tipo,
  tipoPrazo,
  temPrazoJudicial,
  prazoIndefinido,
  size = 'md',
}) => {
  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-0.5 text-xs';

  if (prazoIndefinido) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-md border bg-slate-100 text-slate-600 border-slate-200 shadow-2xs whitespace-nowrap ${sizeClasses}`}
        title="Prazo a ser definido pelo setor técnico após o recebimento"
      >
        <Clock className="w-3 h-3 text-slate-500 shrink-0" />
        <span>A definir</span>
      </span>
    );
  }

  const effectiveTipo = tipo || tipoPrazo;
  const isInterno = effectiveTipo === 'interno' || temPrazoJudicial === false;

  if (isInterno) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-md border bg-indigo-50/80 text-indigo-700 border-indigo-200/90 shadow-2xs whitespace-nowrap ${sizeClasses}`}
        title="Meta Interna de Conclusão definida pelo setor (sem prazo fatal estipulado no ofício)"
      >
        <Building2 className="w-3 h-3 text-indigo-600 shrink-0" />
        <span>Sem Prazo Judicial</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-md border bg-slate-50 text-slate-700 border-slate-200 shadow-2xs whitespace-nowrap ${sizeClasses}`}
      title="Prazo determinado pela autoridade judicial nos autos"
    >
      <Scale className="w-3 h-3 text-blue-700 shrink-0" />
      <span>Prazo Judicial</span>
    </span>
  );
};

interface StatusBadgeProps {
  status: RequestStatus;
  statusOperacional?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  statusOperacional,
  size = 'md',
}) => {
  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs sm:text-sm';

  // Se a demanda ainda aguarda recebimento pelo setor, este é o status prioritário
  if (statusOperacional === 'Aguardando recebimento' && status !== 'Cancelado') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full border bg-amber-50 text-amber-800 border-amber-200 shadow-2xs ${sizeClasses}`}
        title="Demanda aguardando recebimento formal pelo setor responsável"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Aguardando Recebimento
      </span>
    );
  }

  // Normalização para "Em Execução"
  if (status === 'Iniciado' || status === 'Em andamento') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full border bg-blue-50 text-blue-800 border-blue-200 ${sizeClasses}`}
        title="Exames e análises periciais em execução no setor"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
        Em Execução
      </span>
    );
  }

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pendente;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bgClass} ${config.textClass} ${config.borderClass} ${sizeClasses}`}
      title={config.desc}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
};

interface PriorityBadgeProps {
  prazoJudicial: string;
  status: RequestStatus;
  prioridadeManual?: PriorityLevel | null;
  prazoIndefinido?: boolean;
  size?: 'sm' | 'md';
  showDetails?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  prazoJudicial,
  status,
  prioridadeManual,
  prazoIndefinido,
  size = 'md',
  showDetails = true,
}) => {
  if (prazoIndefinido) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full border bg-slate-100 text-slate-600 border-slate-200 ${
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        }`}
        title="Prioridade a ser calculada após estipulação do prazo pelo setor"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        A definir
      </span>
    );
  }

  const {
    prioridadeCalculada,
    prioridadeEfetiva,
    temPrioridadeManual,
  } = calculatePriority(prazoJudicial, status, prioridadeManual);

  if (status === 'Concluído') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-medium rounded-full border bg-emerald-50/50 text-slate-600 border-emerald-200/60 opacity-70 ${
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        }`}
        title="Requisição pericial concluída e laudo entregue"
      >
        <Check className="w-3.5 h-3.5 text-emerald-500" />
        Laudo Entregue
      </span>
    );
  }

  const config = PRIORIDADE_CONFIG[prioridadeEfetiva];
  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span
        className={`inline-flex items-center gap-1 rounded-full border shadow-xs ${config.badgeClass} ${sizeClasses}`}
        title={`${config.desc} ${temPrioridadeManual ? '(Classificação Manual Ativa)' : '(Calculada pelo prazo)'}`}
      >
        {temPrioridadeManual ? (
          <Sliders className="w-3 h-3 text-amber-700" />
        ) : prioridadeEfetiva === 'Urgente' ? (
          <ShieldAlert className="w-3 h-3 text-red-600 animate-pulse" />
        ) : null}
        {prioridadeEfetiva}
      </span>

      {showDetails && temPrioridadeManual && (
        <span
          className="text-[11px] text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded"
          title={`A prioridade foi ajustada manualmente para ${prioridadeManual}. O cálculo automático pela proximidade do prazo seria ${prioridadeCalculada}.`}
        >
          Manual (Calc: {prioridadeCalculada})
        </span>
      )}
    </div>
  );
};
