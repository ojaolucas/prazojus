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

  // Cores de fundo e borda por status
  let cardStyle = 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100';
  let dotColor = 'bg-amber-500';

  if (request.status === 'Vencido') {
    cardStyle = 'bg-rose-50 text-rose-950 border-rose-300 hover:bg-rose-100';
    dotColor = 'bg-rose-600';
  } else if (request.status === 'Concluído') {
    cardStyle = 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100 opacity-80';
    dotColor = 'bg-emerald-600';
  } else if (request.status === 'Em andamento') {
    cardStyle = 'bg-blue-50 text-blue-950 border-blue-300 hover:bg-blue-100';
    dotColor = 'bg-blue-600';
  } else if (request.status === 'Aguardando informações') {
    cardStyle = 'bg-purple-50 text-purple-950 border-purple-300 hover:bg-purple-100';
    dotColor = 'bg-purple-600';
  } else if (request.status === 'Cancelado') {
    cardStyle = 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 line-through';
    dotColor = 'bg-slate-400';
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
          className={`px-1 py-0.2 rounded font-semibold shrink-0 ${
            prioridadeEfetiva === 'Urgente'
              ? 'text-red-700 bg-red-100'
              : prioridadeEfetiva === 'Alta'
              ? 'text-amber-800 bg-amber-100'
              : 'text-slate-600 bg-slate-100'
          }`}
        >
          {prioridadeEfetiva}
        </span>
      </div>
    </div>
  );
};
