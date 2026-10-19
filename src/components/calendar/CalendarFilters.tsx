import React from 'react';
import { useRequests } from '../../context/RequestContext';
import {
  SETORES_SOLICITANTES,
  TIPOS_DE_EXAME,
  ORIGENS_COMUNS,
} from '../../data/constants';
import { RotateCcw } from 'lucide-react';

interface CalendarFiltersProps {
  isOpen: boolean;
}

export const CalendarFilters: React.FC<CalendarFiltersProps> = ({ isOpen }) => {
  const { filters, setFilters, resetFilters } = useRequests();

  if (!isOpen) return null;

  const hasActive =
    filters.status ||
    filters.prioridade ||
    filters.setor ||
    filters.tipoExame ||
    filters.origem;

  return (
    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs animate-fade-in space-y-2 mb-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
          Filtros Ativos no Calendário
        </span>
        {hasActive && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            Limpar Filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
        <div>
          <label className="block text-slate-500 font-medium mb-1">Status:</label>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
            className="w-full p-1.5 border border-slate-300 rounded-lg bg-white"
          >
            <option value="">Todos</option>
            <option value="Pendente">Pendente</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Aguardando informações">Aguardando inf.</option>
            <option value="Concluído">Concluído</option>
            <option value="Vencido">Vencido</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-medium mb-1">Prioridade:</label>
          <select
            value={filters.prioridade}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, prioridade: e.target.value }))
            }
            className="w-full p-1.5 border border-slate-300 rounded-lg bg-white"
          >
            <option value="">Todas</option>
            <option value="Urgente">Urgente</option>
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 font-medium mb-1">Setor:</label>
          <select
            value={filters.setor}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, setor: e.target.value }))
            }
            className="w-full p-1.5 border border-slate-300 rounded-lg bg-white"
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
          <label className="block text-slate-500 font-medium mb-1">Exame:</label>
          <select
            value={filters.tipoExame}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, tipoExame: e.target.value }))
            }
            className="w-full p-1.5 border border-slate-300 rounded-lg bg-white"
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
          <label className="block text-slate-500 font-medium mb-1">Origem:</label>
          <select
            value={filters.origem}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, origem: e.target.value }))
            }
            className="w-full p-1.5 border border-slate-300 rounded-lg bg-white"
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
