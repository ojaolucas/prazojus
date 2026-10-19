import React, { useState } from 'react';
import { useRequests } from '../../context/RequestContext';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { CalendarFilters } from './CalendarFilters';
import { JudicialRequest } from '../../types/request';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  Plus,
} from 'lucide-react';

interface CalendarViewProps {
  onSelectEvent: (req: JudicialRequest) => void;
  onOpenCreateWithDate?: (date: Date) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onSelectEvent,
  onOpenCreateWithDate,
}) => {
  const { filteredRequests, filters, setIsCreateModalOpen } = useRequests();

  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 19)); // Outubro de 2026
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Navegação entre períodos
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Formatação do título do período atual
  const getPeriodLabel = () => {
    if (viewMode === 'month') {
      const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long' });
      return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${currentDate.getFullYear()}`;
    }

    if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const startDay = startOfWeek.getDate();
      const endDay = endOfWeek.getDate();
      const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'short' });
      return `${startDay} - ${endDay} de ${monthName} de ${currentDate.getFullYear()}`;
    }

    return currentDate.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const hasActiveFilters =
    filters.status ||
    filters.prioridade ||
    filters.setor ||
    filters.tipoExame ||
    filters.origem;

  const handleDaySelect = (date: Date) => {
    setCurrentDate(date);
    setViewMode('day');
  };

  return (
    <div className="space-y-4">
      {/* Top Google Agenda Style Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Esquerda: Navegação e Data */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Botão Hoje */}
          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Hoje
          </button>

          {/* Setas de Navegação */}
          <div className="flex items-center rounded-lg border border-slate-300 bg-white shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Período Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-200" />
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Próximo Período"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Nome do Mês / Período */}
          <h2 className="text-base sm:text-lg font-bold text-slate-800 ml-1">
            {getPeriodLabel()}
          </h2>
        </div>

        {/* Direita: Modos de Visualização e Filtro */}
        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
          {/* Alternador de Visões: Mês, Semana, Dia */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mês
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'week'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'day'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dia
            </button>
          </div>

          {/* Botão Filtros */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filtros
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-blue-600 ml-0.5" />
            )}
          </button>

          {/* Botão Novo Prazo */}
          <button
            type="button"
            onClick={() => {
              if (onOpenCreateWithDate) {
                onOpenCreateWithDate(currentDate);
              } else {
                setIsCreateModalOpen(true);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Prazo
          </button>
        </div>
      </div>

      {/* Painel de Filtros do Calendário */}
      <CalendarFilters isOpen={showFilters} />

      {/* Conteúdo da Visão Selecionada */}
      {viewMode === 'month' && (
        <MonthView
          currentDate={currentDate}
          requests={filteredRequests}
          onSelectEvent={onSelectEvent}
          onSelectDay={handleDaySelect}
        />
      )}

      {viewMode === 'week' && (
        <WeekView
          currentDate={currentDate}
          requests={filteredRequests}
          onSelectEvent={onSelectEvent}
          onSelectDay={handleDaySelect}
        />
      )}

      {viewMode === 'day' && (
        <DayView
          currentDate={currentDate}
          requests={filteredRequests}
          onSelectEvent={onSelectEvent}
          onOpenCreate={(d) => {
            if (onOpenCreateWithDate) {
              onOpenCreateWithDate(d);
            } else {
              setIsCreateModalOpen(true);
            }
          }}
        />
      )}
    </div>
  );
};
