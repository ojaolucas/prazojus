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
  let cardStyle = 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200';
  let dotColor = 'bg-slate-400';

  if (prioridadeEfetiva === 'Urgente') {
    cardStyle = 'bg-red-50 text-red-950 border-red-300 hover:bg-red-100';
    dotColor = 'bg-red-600';
  } else if (prioridadeEfetiva === 'Alta') {
    cardStyle = 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100';
    dotColor = 'bg-amber-500';
  } else if (prioridadeEfetiva === 'Média') {
    cardStyle = 'bg-blue-50 text-blue-950 border-blue-300 hover:bg-blue-100';
    dotColor = 'bg-blue-600';
  } else if (prioridadeEfetiva === 'Baixa') {
    cardStyle = 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200';
    dotColor = 'bg-slate-400';
  }

  // Sobrescritas especiais por status
  if (request.status === 'Concluído') {
    cardStyle = 'bg-emerald-50/40 text-slate-500 border-emerald-200/50 hover:bg-emerald-50/70 opacity-60';
    dotColor = 'bg-emerald-400/80';
  } else if (request.status === 'Cancelado') {
    cardStyle = 'bg-slate-100/50 text-slate-400 border-slate-200/50 hover:bg-slate-100/70 line-through opacity-50';
    dotColor = 'bg-slate-300';
  } else if (request.status === 'Vencido') {
    cardStyle = 'bg-rose-100 text-rose-950 border-rose-400 hover:bg-rose-200 ring-1 ring-rose-400';
    dotColor = 'bg-rose-700';
  }

  if (compact) {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium border truncate transition-all cursor-pointer shadow-2xs ${cardStyle}`}
        title={`Processo ${request.numeroProcesso} • ${request.tipoExame} (${request.status}) - Data Final: ${formatDatePtBR(request.prazoJudicial)}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
        <span className="shrink-0" title={request.tipoPrazo === 'interno' ? 'Sem Prazo Judicial' : 'Prazo Judicial'}>
          {request.tipoPrazo === 'interno' ? (
            <Building2 className="w-3 h-3 text-indigo-600" />
          ) : (
            <Scale className="w-3 h-3 text-slate-600" />
          )}
        </span>
        <span className="font-mono truncate">{request.numeroProcesso.split('.')[0]}...</span>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`p-2 rounded-lg border text-xs transition-all cursor-pointer shadow-xs hover:shadow-md ${cardStyle}`}
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono font-semibold truncate text-slate-900">
            {request.numeroProcesso}
          </span>
          <span className="text-[9px] px-1 py-0.5 rounded font-medium shrink-0 border border-slate-200/60 bg-white/80 text-slate-600 flex items-center gap-1">
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
      </div>

      <div className="text-[11px] font-medium text-slate-700 line-clamp-1">
        {request.tipoExame}
      </div>

      <div className="flex items-center justify-between gap-1 mt-1 text-[10px] text-slate-500">
        <span className="truncate">{request.setorSolicitante}</span>
        <span
          className={`px-1.5 py-0.2 rounded font-semibold shrink-0 ${
            prioridadeEfetiva === 'Urgente'
              ? 'text-red-700 bg-red-100 border border-red-200'
              : prioridadeEfetiva === 'Alta'
              ? 'text-amber-800 bg-amber-100 border border-amber-200'
              : prioridadeEfetiva === 'Média'
              ? 'text-sky-800 bg-sky-100 border border-sky-200'
              : 'text-slate-700 bg-slate-200 border border-slate-300'
          }`}
        >
          {prioridadeEfetiva}
        </span>
      </div>
    </div>
  );
};
