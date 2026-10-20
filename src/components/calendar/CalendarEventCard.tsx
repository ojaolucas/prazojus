import React from 'react';
import { JudicialRequest } from '../../types/request';
import { calculatePriority } from '../../services/deadlineService';
import { Clock, ShieldAlert, Check } from 'lucide-react';

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

  const d = new Date(request.prazoJudicial);
  const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

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
    cardStyle = 'bg-sky-50 text-sky-950 border-sky-300 hover:bg-sky-100';
    dotColor = 'bg-sky-500';
  } else if (prioridadeEfetiva === 'Baixa') {
    cardStyle = 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200';
    dotColor = 'bg-slate-400';
  }

  // Sobrescritas especiais por status
  if (request.status === 'Concluído') {
    cardStyle = 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100 opacity-80';
    dotColor = 'bg-emerald-600';
  } else if (request.status === 'Cancelado') {
    cardStyle = 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 line-through opacity-70';
    dotColor = 'bg-slate-400';
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
        title={`Processo ${request.numeroProcesso} • ${request.tipoExame} (${request.status}) - Prazo: ${timeStr}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
        <span className="shrink-0 text-[10px]" title={request.tipoPrazo === 'interno' ? 'Meta Interna Customizada' : 'Prazo Judicial Expresso'}>
          {request.tipoPrazo === 'interno' ? '🏢' : '⚖️'}
        </span>
        <span className="font-mono truncate">{request.numeroProcesso.split('.')[0]}...</span>
        <span className="text-[10px] text-slate-500 shrink-0 ml-auto">{timeStr}</span>
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
          <span className="text-[9px] px-1 py-0.2 rounded font-medium shrink-0 border border-slate-200/60 bg-white/80 text-slate-600">
            {request.tipoPrazo === 'interno' ? '🏢 Meta' : '⚖️ Judicial'}
          </span>
        </div>
        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-white/70 border border-slate-200/50 shrink-0 flex items-center gap-0.5">
          <Clock className="w-2.5 h-2.5" />
          {timeStr}
        </span>
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
