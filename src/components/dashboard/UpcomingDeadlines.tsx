import React from 'react';
import { JudicialRequest } from '../../types/request';
import { StatusBadge, PriorityBadge } from '../requests/StatusBadge';
import {
  formatDatePtBR,
  formatDeadlineCountdown,
} from '../../services/deadlineService';
import { Clock, ArrowRight, Building2, Calendar } from 'lucide-react';

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
  // Pega apenas requisições não concluídas e não canceladas, ordenadas pelo prazo mais próximo
  const upcoming = requests
    .filter((r) => r.status !== 'Concluído' && r.status !== 'Cancelado')
    .sort(
      (a, b) =>
        new Date(a.prazoJudicial).getTime() - new Date(b.prazoJudicial).getTime()
    )
    .slice(0, 6);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-blue-700" />
              Próximos Prazos Judiciais
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Requisições que demandam atenção cronológica prioritária
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenCalendar}
            className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
          >
            Ver Calendário
            <ArrowRight className="w-3.5 h-3.5" />
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
                  className="py-3 px-2 hover:bg-blue-50/30 rounded-lg transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-blue-700">
                        {req.numeroProcesso}
                      </span>
                      <StatusBadge status={req.status} size="sm" />
                      <PriorityBadge
                        prazoJudicial={req.prazoJudicial}
                        status={req.status}
                        prioridadeManual={req.prioridadeManual}
                        size="sm"
                        showDetails={false}
                      />
                    </div>

                    <p className="text-xs text-slate-700 font-medium truncate">
                      {req.tipoExame} — {req.descricao}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {req.setorSolicitante}
                      </span>
                      <span>• Limite: {formatDatePtBR(req.prazoJudicial)}</span>
                    </div>
                  </div>

                  <div className="shrink-0 self-start sm:self-auto">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
                        countdown.urgency === 'vencido'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : countdown.urgency === 'hoje'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {countdown.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-3 mt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
        <span>Mostrando até 6 prazos mais próximos</span>
        <button
          type="button"
          onClick={onOpenCalendar}
          className="text-blue-600 hover:underline font-medium"
        >
          Visualizar na Agenda Completa
        </button>
      </div>
    </div>
  );
};
