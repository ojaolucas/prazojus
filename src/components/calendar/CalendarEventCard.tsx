import React from 'react';
import { JudicialRequest } from '../../types/request';
import { calculatePriority, formatDatePtBR } from '../../services/deadlineService';
import { ShieldAlert, Check, Scale, Building2 } from 'lucide-react';

interface CalendarEventCardProps {
  request: JudicialRequest;
  onClick: () => void;
  compact?: boolean;
}

export const CalendarEventCard: React.FC<CalendarEventCardProps> = ({
  request,
  onClick,
  compact = false,
}) => {
  const { prioridadeEfetiva, temPrioridadeManual } = calculatePriority(
    request.prazoJudicial,
    request.status,
    request.prioridadeManual
  );


  // Padrão de cores baseado na CLASSIFICAÇÃO DE PRIORIDADE
  let cardStyle = 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 hover:border-slate-300';
  let dotColor = 'bg-slate-400';

  if (prioridadeEfetiva === 'Urgente') {
    cardStyle = 'bg-red-50/90 text-red-900 border-red-200 hover:bg-red-100 hover:border-red-300';
    dotColor = 'bg-red-500';
  } else if (prioridadeEfetiva === 'Alta') {
    cardStyle = 'bg-amber-50/90 text-amber-950 border-amber-200 hover:bg-amber-100 hover:border-amber-300';
    dotColor = 'bg-amber-500';
  } else if (prioridadeEfetiva === 'Média') {
    cardStyle = 'bg-blue-50/90 text-blue-950 border-blue-200 hover:bg-blue-100 hover:border-blue-300';
    dotColor = 'bg-blue-600';
  } else if (prioridadeEfetiva === 'Baixa') {
    cardStyle = 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 hover:border-slate-300';
    dotColor = 'bg-slate-400';
  }

  // Sobrescritas especiais por status
  if (request.status === 'Concluído') {
    cardStyle = 'bg-emerald-50/40 text-emerald-900/70 border-emerald-200/60 hover:bg-emerald-50/70 opacity-75';
    dotColor = 'bg-emerald-500/80';
  } else if (request.status === 'Cancelado') {
    cardStyle = 'bg-slate-100/50 text-slate-400 border-slate-200/50 hover:bg-slate-100/70 line-through opacity-50';
    dotColor = 'bg-slate-300';
  } else if (request.status === 'Vencido') {
    cardStyle = 'bg-rose-50 text-rose-950 border-rose-300 hover:bg-rose-100 ring-1 ring-rose-200';
    dotColor = 'bg-rose-700';
  }

  if (compact) {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={`group/card flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border truncate transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs hover:-translate-y-px ${cardStyle}`}
        title={`Processo ${request.numeroProcesso} • ${request.tipoExame} (${request.status}) - Data Final: ${formatDatePtBR(request.prazoJudicial)}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor} ring-2 ring-white/80`} />
        <span
          className="shrink-0 opacity-65 group-hover/card:opacity-100 transition-opacity"
          title={request.tipoPrazo === 'interno' ? 'Sem Prazo Judicial' : 'Prazo Judicial'}
        >
          {request.tipoPrazo === 'interno' ? (
            <Building2 className="w-3 h-3 text-indigo-600" />
          ) : (
            <Scale className="w-3 h-3 text-slate-600" />
          )}
        </span>
        <span className="font-mono text-[10.5px] font-medium tracking-tight truncate">
          {request.numeroProcesso.split('.')[0]}
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`group/card p-2.5 rounded-xl border text-xs transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 ${cardStyle}`}
    >
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor} ring-2 ring-white`} />
          <span className="font-mono font-semibold truncate text-slate-900 text-xs">
            {request.numeroProcesso}
          </span>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded-full font-medium shrink-0 border border-slate-200/70 bg-white/90 text-slate-600 flex items-center gap-1 shadow-2xs">
          {request.tipoPrazo === 'interno' ? (
            <>
              <Building2 className="w-2.5 h-2.5 text-indigo-600" />
              <span>Sem Prazo</span>
            </>
          ) : (
            <>
              <Scale className="w-2.5 h-2.5 text-slate-600" />
              <span>Judicial</span>
            </>
          )}
        </span>
      </div>

      <div className="text-[11px] font-medium text-slate-700 line-clamp-1 mb-1.5">
        {request.tipoExame}
      </div>

      <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-200/50 text-[10px] text-slate-500">
        <span className="truncate">{request.setorSolicitante}</span>
        <span
          className={`px-2 py-0.5 rounded-full font-semibold text-[10px] shrink-0 border shadow-2xs ${
            prioridadeEfetiva === 'Urgente'
              ? 'text-red-700 bg-red-100 border-red-200'
              : prioridadeEfetiva === 'Alta'
              ? 'text-amber-800 bg-amber-100 border-amber-200'
              : prioridadeEfetiva === 'Média'
              ? 'text-blue-800 bg-blue-100 border-blue-200'
              : 'text-slate-700 bg-slate-200 border-slate-300'
          }`}
        >
          {prioridadeEfetiva}
        </span>
      </div>
    </div>
  );
};
