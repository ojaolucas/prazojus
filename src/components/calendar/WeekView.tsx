import React from 'react';
import { JudicialRequest } from '../../types/request';
import { CalendarEventCard } from './CalendarEventCard';
import { Plus, Clock } from 'lucide-react';

interface WeekViewProps {
  currentDate: Date;
  requests: JudicialRequest[];
  onSelectEvent: (req: JudicialRequest) => void;
  onSelectDay: (date: Date) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  requests,
  onSelectEvent,
  onSelectDay,
}) => {
  // Encontra o domingo inicial da semana
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const today = new Date();
  const weekDayNames = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Grade de 7 Colunas para os dias da semana */}
      <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-100 min-h-[550px]">
        {weekDays.map((date, idx) => {
          const isToday =
            today.getFullYear() === date.getFullYear() &&
            today.getMonth() === date.getMonth() &&
            today.getDate() === date.getDate();

          const dayRequests = requests.filter((r) => {
            const rDate = new Date(r.prazoJudicial);
            return (
              rDate.getFullYear() === date.getFullYear() &&
              rDate.getMonth() === date.getMonth() &&
              rDate.getDate() === date.getDate()
            );
          });

          return (
            <div
              key={idx}
              className={`flex flex-col p-3 transition-colors ${
                isToday ? 'bg-blue-50/20' : 'bg-white'
              }`}
            >
              {/* Header do Dia */}
              <div
                onClick={() => onSelectDay(date)}
                className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 cursor-pointer group"
              >
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">
                    {weekDayNames[idx].slice(0, 3)}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-blue-700 text-white'
                          : 'text-slate-800 group-hover:text-blue-700'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {date.toLocaleDateString('pt-BR', { month: 'short' })}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDay(date);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-100 rounded transition-all"
                  title="Cadastrar requisição para este dia"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Lista de Prazos do Dia */}
              <div className="space-y-2 flex-1 overflow-y-auto">
                {dayRequests.length === 0 ? (
                  <div className="h-28 flex flex-col items-center justify-center text-center p-2 rounded-lg border border-dashed border-slate-100 text-slate-300">
                    <Clock className="w-5 h-5 mb-1" />
                    <span className="text-[11px]">Sem prazos</span>
                  </div>
                ) : (
                  dayRequests.map((req) => (
                    <CalendarEventCard
                      key={req.id}
                      request={req}
                      onClick={() => onSelectEvent(req)}
                      compact={false}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
