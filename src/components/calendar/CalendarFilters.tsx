import React from 'react';
import { useRequests } from '../../context/RequestContext';
import {
  SETORES_SOLICITANTES,
  TIPOS_DE_EXAME,
  ORIGENS_COMUNS,
} from '../../data/constants';
import { FilterX } from 'lucide-react';

interface CalendarFiltersProps {
  isOpen: boolean;
}

export const CalendarFilters: React.FC<CalendarFiltersProps> = ({ isOpen }) => {
  const { filters, setFilters, resetFilters } = useRequests();

  if (!isOpen) return null;

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs text-xs animate-fade-in space-y-3.5 mb-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
          Filtros do Calendário
        </span>
        <button
          type="button"
          onClick={resetFilters}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
        >
          <FilterX className="w-3.5 h-3.5 text-slate-500" />
          Limpar Filtros
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors text-slate-700"
          >
            <option value="">Todos os status</option>
            <option value="Não iniciado">Não iniciado</option>
            <option value="Iniciado">Iniciado</option>
            <option value="Concluído">Concluído</option>
            <option value="Vencido">Vencido</option>
            <option value="urgente">Urgente (Até 5 dias)</option>
            <option value="alta">Alta (6-15 dias)</option>
            <option value="media">Média (16-30 dias)</option>
            <option value="baixa">Baixa (+30 dias)</option>
            <option value="Cancelado">Cancelado</option>
            <option value="proximos">Vencendo nos próximos 7 dias</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Setor
          </label>
          <select
            value={filters.setor}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, setor: e.target.value }))
            }
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors text-slate-700"
          >
            <option value="">Todos os setores</option>
            {SETORES_SOLICITANTES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Exame
          </label>
          <select
            value={filters.tipoExame}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, tipoExame: e.target.value }))
            }
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors text-slate-700"
          >
            <option value="">Todos os exames</option>
            {TIPOS_DE_EXAME.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Origem / Juízo
          </label>
          <select
            value={filters.origem}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, origem: e.target.value }))
            }
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors text-slate-700"
          >
            <option value="">Todas as origens</option>
            {ORIGENS_COMUNS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
