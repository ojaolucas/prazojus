import React from 'react';
import { JudicialRequest } from '../../types/request';
import { StatusBadge, PriorityBadge } from '../requests/StatusBadge';
import {
  formatDatePtBR,
  formatDeadlineCountdown,
} from '../../services/deadlineService';
import { Clock, Plus, Building2, Calendar, FileText } from 'lucide-react';

interface DayViewProps {
  currentDate: Date;
  requests: JudicialRequest[];
  onSelectEvent: (req: JudicialRequest) => void;
  onOpenCreate: (date: Date) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  requests,
  onSelectEvent,
  onOpenCreate,
}) => {
  const dayRequests = requests.filter((r) => {
    const rDate = new Date(r.prazoJudicial);
    return (
      rDate.getFullYear() === currentDate.getFullYear() &&
      rDate.getMonth() === currentDate.getMonth() &&
      rDate.getDate() === currentDate.getDate()
    );
  });

  const isToday =
    new Date().toDateString() === currentDate.toDateString();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
      {/* Header do Dia */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-slate-800">
              {currentDate.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </h3>
            {isToday && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                Hoje
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {dayRequests.length}{' '}
            {dayRequests.length === 1 ? 'prazo judicial agendado' : 'prazos judiciais agendados'} para esta data
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenCreate(currentDate)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Novo Prazo Neste Dia
        </button>
      </div>

      {/* Lista detalhada dos prazos deste dia */}
      {dayRequests.length === 0 ? (
        <div className="py-14 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-700">
            Nenhum prazo judicial agendado para esta data
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Não constam vencimentos periciais para este dia nos autos locais.
          </p>
          <button
            onClick={() => onOpenCreate(currentDate)}
            className="mt-4 px-3.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Cadastrar Requisição para esta data
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {dayRequests.map((req) => {
            const d = new Date(req.prazoJudicial);
            const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            const countdown = formatDeadlineCountdown(req.prazoJudicial, req.status);

            return (
              <div
                key={req.id}
                onClick={() => onSelectEvent(req)}
                className="py-3.5 px-2 hover:bg-blue-50/30 rounded-lg transition-colors cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-slate-900 group-hover:text-blue-700 text-sm">
                      {req.numeroProcesso}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      Horário Limite: {timeStr}
                    </span>
                    <StatusBadge status={req.status} size="sm" />
                    <PriorityBadge
                      prazoJudicial={req.prazoJudicial}
                      status={req.status}
                      prioridadeManual={req.prioridadeManual}
                      size="sm"
                    />
                  </div>

                  <p className="text-xs font-medium text-slate-800">
                    {req.tipoExame} — {req.descricao}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      {req.setorSolicitante}
                    </span>
                    {req.origem && <span>• {req.origem}</span>}
                    {req.acusadoVitima && <span>• Partes: {req.acusadoVitima}</span>}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border ${
                      countdown.urgency === 'vencido'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : countdown.urgency === 'hoje'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {countdown.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
