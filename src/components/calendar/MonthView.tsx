import React from 'react';
import { JudicialRequest } from '../../types/request';
import { CalendarEventCard } from './CalendarEventCard';
import { Plus } from 'lucide-react';

interface MonthViewProps {
  currentDate: Date;
  requests: JudicialRequest[];
  onSelectEvent: (req: JudicialRequest) => void;
  onSelectDay: (date: Date) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  requests,
  onSelectEvent,
  onSelectDay,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Primeiro dia do mês e total de dias
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Domingo
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const isCurrentMonthToday =
    today.getFullYear() === year && today.getMonth() === month;

  // Monta a grade com 35 ou 42 células
  const days: {
    dayNumber: number;
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
  }[] = [];

  // Dias do mês anterior
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const dayNumber = daysInPrevMonth - i;
    const date = new Date(year, month - 1, dayNumber);
    days.push({
      dayNumber,
      date,
      isCurrentMonth: false,
      isToday:
        today.getFullYear() === date.getFullYear() &&
        today.getMonth() === date.getMonth() &&
        today.getDate() === date.getDate(),
    });
  }

  // Dias do mês atual
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    days.push({
      dayNumber: i,
      date,
      isCurrentMonth: true,
      isToday: isCurrentMonthToday && today.getDate() === i,
    });
  }

  // Dias do próximo mês para completar semanas inteiras (múltiplo de 7)
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      dayNumber: i,
      date,
      isCurrentMonth: false,
      isToday:
        today.getFullYear() === date.getFullYear() &&
        today.getMonth() === date.getMonth() &&
        today.getDate() === date.getDate(),
    });
  }

  const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Cabeçalho dos Dias da Semana */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold text-center py-2.5">
        {weekDayNames.map((d, index) => (
          <div
            key={d}
            className={`${index === 0 || index === 6 ? 'text-slate-400' : 'text-slate-700'}`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grade do Mês */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[580px]">
        {days.map((cell, idx) => {
          // Filtra requisições cuja data do prazo cai neste dia
          const dayRequests = requests.filter((r) => {
            const rDate = new Date(r.prazoJudicial);
            return (
              rDate.getFullYear() === cell.date.getFullYear() &&
              rDate.getMonth() === cell.date.getMonth() &&
              rDate.getDate() === cell.date.getDate()
            );
          });

          return (
            <div
              key={idx}
              onClick={() => onSelectDay(cell.date)}
              className={`p-1.5 sm:p-2 min-h-[96px] sm:min-h-[115px] flex flex-col justify-between transition-colors cursor-pointer group relative ${
                !cell.isCurrentMonth
                  ? 'bg-slate-50/50 text-slate-400'
                  : 'bg-white hover:bg-blue-50/20'
              }`}
            >
              {/* Cabeçalho da Célula (Número do dia e botão de adicionar) */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                    cell.isToday
                      ? 'bg-blue-700 text-white shadow-xs font-bold'
                      : cell.isCurrentMonth
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDay(cell.date);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-blue-700 hover:bg-blue-100 rounded transition-all"
                  title="Cadastrar requisição para esta data"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Lista de Eventos no Dia */}
              <div className="space-y-1 overflow-y-auto max-h-[80px] flex-1">
                {dayRequests.slice(0, 3).map((req) => (
                  <CalendarEventCard
                    key={req.id}
                    request={req}
                    onClick={() => onSelectEvent(req)}
                    compact
                  />
                ))}

                {dayRequests.length > 3 && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDay(cell.date);
                    }}
                    className="text-[10px] text-blue-700 font-semibold px-1 py-0.5 rounded hover:bg-blue-100 text-center transition-colors"
                  >
                    +{dayRequests.length - 3} prazos
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
