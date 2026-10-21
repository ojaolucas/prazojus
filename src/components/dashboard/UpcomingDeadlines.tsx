import React from 'react';
import { JudicialRequest } from '../../types/request';
import { StatusBadge, PriorityBadge } from '../requests/StatusBadge';
import {
  formatDatePtBR,
  formatDeadlineCountdown,
} from '../../services/deadlineService';

interface UpcomingDeadlinesProps {
  requests: JudicialRequest[];
  onSelectEvent: (req: JudicialRequest) => void;
  onOpenCalendar: () => void;
}

export const UpcomingDeadlines: React.FC<UpcomingDeadlinesProps> = ({
  requests,
  onSelectEvent,
  onOpenCalendar,
}) => {
  // Pega até 5 requisições mais próximas do vencimento para alinhar perfeitamente com o Top 5
  const upcoming = requests
    .filter((r) => r.status !== 'Concluído' && r.status !== 'Cancelado')
    .sort(
      (a, b) =>
        new Date(a.prazoJudicial).getTime() - new Date(b.prazoJudicial).getTime()
    )
    .slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Próximos Prazos
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Requisições que demandam atenção cronológica prioritária
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenCalendar}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Ver Calendário →
          </button>
        </div>

        {upcoming.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Nenhum prazo pendente no momento.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcoming.map((req) => {
              const countdown = formatDeadlineCountdown(req.prazoJudicial, req.status);

              return (
                <div
                  key={req.id}
                  onClick={() => onSelectEvent(req)}
                  className="py-2.5 px-2 hover:bg-slate-50/80 rounded-lg transition-colors cursor-pointer group flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold text-xs text-slate-800 group-hover:text-blue-700 truncate">
                        {req.numeroProcesso}
                      </span>
                      <StatusBadge status={req.status} size="sm" />
                    </div>

                    <p className="text-xs text-slate-600 truncate">
                      {req.tipoExame} • {req.setorSolicitante} • Limite: {formatDatePtBR(req.prazoJudicial)}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <span
                      className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded border whitespace-nowrap ${
                        countdown.urgency === 'vencido'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : countdown.urgency === 'hoje'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {countdown.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-3 mt-2 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
        <span>Mostrando 5 prazos prioritários</span>
        <button
          type="button"
          onClick={onOpenCalendar}
          className="text-slate-600 hover:text-slate-900 font-medium"
        >
          Visualizar na Agenda Completa
        </button>
      </div>
    </div>
  );
};


