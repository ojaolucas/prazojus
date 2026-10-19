import React from 'react';
import { RequestStatus, PriorityLevel } from '../../types/request';
import { STATUS_CONFIG, PRIORIDADE_CONFIG } from '../../data/constants';
import { calculatePriority } from '../../services/deadlineService';
import { Check, ShieldAlert, Sliders } from 'lucide-react';

interface StatusBadgeProps {
  status: RequestStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pendente;

  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs sm:text-sm';

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
  size?: 'sm' | 'md';
  showDetails?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  prazoJudicial,
  status,
  prioridadeManual,
  size = 'md',
  showDetails = true,
}) => {
  const {
    prioridadeCalculada,
    prioridadeEfetiva,
    temPrioridadeManual,
  } = calculatePriority(prazoJudicial, status, prioridadeManual);

  if (status === 'Concluído') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-medium rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 ${
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        }`}
        title="Requisição pericial concluída e laudo entregue"
      >
        <Check className="w-3.5 h-3.5 text-emerald-600" />
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
