import React, { useState, useMemo } from 'react';
import { useRequests } from '../../context/RequestContext';
import { useAuth } from '../../context/AuthContext';
import { KanbanBoard } from '../requests/KanbanBoard';
import { JudicialRequest } from '../../types/request';
import { SearchableSelect } from '../common/SearchableSelect';
import { Search, Plus, Building2, FilterX, Columns3 } from 'lucide-react';

interface KanbanViewProps {
  onOpenCreate: () => void;
  onOpenDetail: (req: JudicialRequest) => void;
  onOpenEdit: (req: JudicialRequest) => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  onOpenCreate,
  onOpenDetail,
  onOpenEdit,
}) => {
  const { requests } = useRequests();
  const { currentUser, allowedSectors, can } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');

  // Filtra as requisições respeitando o perfil/setores do usuário e os filtros rápidos do Kanban
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // 1. Restrição de acesso setorial do usuário
      if (
        currentUser.role !== 'Administrador' &&
        allowedSectors.length > 0 &&
        !allowedSectors.includes(req.setorSolicitante)
      ) {
        return false;
      }

      // 2. Filtro de setor selecionado
      if (selectedSector && req.setorSolicitante !== selectedSector) {
        return false;
      }

      // 3. Busca por texto (processo, descrição/ofício, protocolo, REP, partes)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesProcess = (req.numeroProcesso || '').toLowerCase().includes(term);
        const matchesDesc = (req.descricao || '').toLowerCase().includes(term);
        const matchesProt = (req.protocolo || '').toLowerCase().includes(term);
        const matchesRep = (req.rep || '').toLowerCase().includes(term);
        const matchesTipo = (req.tipoExame || '').toLowerCase().includes(term);
        const matchesResp = (req.responsavelOperacionalNome || '').toLowerCase().includes(term);

        if (
          !matchesProcess &&
          !matchesDesc &&
          !matchesProt &&
          !matchesRep &&
          !matchesTipo &&
          !matchesResp
        ) {
          return false;
        }
      }

      return true;
    });
  }, [requests, currentUser, allowedSectors, selectedSector, searchTerm]);

  const hasActiveFilters = Boolean(searchTerm || selectedSector);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Barra Superior do Módulo Kanban: Título, Filtros Diretos e Ação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100/70 text-blue-800">
              <Columns3 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Quadro de Demandas Operacionais
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão visual da esteira setorial: triagem de entrada, perícias em execução e homologação de laudos.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          {can('canCreateRequest') && (
            <button
              type="button"
              onClick={onOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nova Requisição
            </button>
          )}
        </div>
      </div>

      {/* Controles de Busca Rápida e Filtro por Setor */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Campo de Busca Amplo */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por processo, ofício, protocolo, perito ou tipo de exame..."
            className="w-full h-[36px] pl-9 pr-8 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors text-slate-700"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold"
              title="Limpar busca"
            >
              ×
            </button>
          )}
        </div>

        {/* Filtro de Setor */}
        <div className="w-full sm:w-64">
          <SearchableSelect
            size="sm"
            options={allowedSectors}
            value={selectedSector}
            onChange={(val) => setSelectedSector(val)}
            placeholder={allowedSectors.length > 0 ? 'Todos os setores' : 'Nenhum setor'}
            searchPlaceholder="Filtrar setor..."
          />
        </div>

        {/* Botão Limpar Filtros */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedSector('');
            }}
            className="flex items-center justify-center gap-1.5 px-3 h-[36px] text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Limpar filtros"
          >
            <FilterX className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Limpar</span>
          </button>
        )}
      </div>

      {/* Renderização do Quadro Kanban */}
      <KanbanBoard
        requests={filteredRequests}
        onOpenDetail={onOpenDetail}
        onOpenEdit={onOpenEdit}
      />
    </div>
  );
};

