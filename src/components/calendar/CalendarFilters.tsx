import React from 'react';
import { useRequests } from '../../context/RequestContext';
import { useAuth } from '../../context/AuthContext';
import {
  TIPOS_DE_EXAME,
  ORIGENS_COMUNS,
} from '../../data/constants';
import { FilterX } from 'lucide-react';
import { SearchableSelect } from '../common/SearchableSelect';

interface CalendarFiltersProps {
  isOpen: boolean;
}

export const CalendarFilters: React.FC<CalendarFiltersProps> = ({ isOpen }) => {
  const { filters, setFilters, resetFilters } = useRequests();
  const { allowedSectors } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="relative z-20 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs text-xs animate-fade-in mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-3 items-end">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 truncate">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
            className="w-full h-[38px] px-2.5 sm:px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors text-slate-700 cursor-pointer"
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
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 truncate">
            Setor
          </label>
          <SearchableSelect
            size="sm"
            options={allowedSectors}
            value={filters.setor}
            onChange={(val) =>
              setFilters((prev) => ({ ...prev, setor: val }))
            }
            placeholder={allowedSectors.length > 0 ? 'Todos os setores' : 'Nenhum setor'}
            searchPlaceholder="Filtrar setor..."
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 truncate">
            Exame
          </label>
          <SearchableSelect
            size="sm"
            options={TIPOS_DE_EXAME}
            value={filters.tipoExame}
            onChange={(val) =>
              setFilters((prev) => ({ ...prev, tipoExame: val }))
            }
            placeholder="Todos os exames"
            searchPlaceholder="Filtrar exame..."
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 truncate">
            Origem / Juízo
          </label>
          <SearchableSelect
            size="sm"
            options={ORIGENS_COMUNS}
            value={filters.origem}
            onChange={(val) =>
              setFilters((prev) => ({ ...prev, origem: val }))
            }
            placeholder="Todas as origens"
            searchPlaceholder="Filtrar origem..."
          />
        </div>

        <div>
          <button
            type="button"
            onClick={resetFilters}
            className="w-full h-[38px] flex items-center justify-center gap-1.5 px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <FilterX className="w-3.5 h-3.5 text-slate-500" />
            Limpar Filtros
          </button>
        </div>
      </div>
    </div>
  );
};
