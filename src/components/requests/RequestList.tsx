import React, { useState, useMemo, useEffect } from 'react';
import { useRequests } from '../../context/RequestContext';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, TipoPrazoBadge } from './StatusBadge';
import {
  formatDatePtBR,
  formatDeadlineCountdown,
  isRequestPrazoIndefinido,
} from '../../services/deadlineService';
import {
  SETORES_SOLICITANTES,
  TIPOS_DE_EXAME,
  ORIGENS_COMUNS,
  getExamesPorSetor,
} from '../../data/constants';
import {
  Search,
  FilterX,
  Plus,
  Trash2,
  Edit,
  Eye,
  Clock,
  Calendar,
  Building2,
  FileText,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileSpreadsheet,
  Printer,
  Handshake,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Zap,
  Inbox,
  Microscope,
  PlayCircle,
} from 'lucide-react';
import { JudicialRequest } from '../../types/request';
import { ConfirmDialog } from '../layout/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { ReportService } from '../../services/reportService';
import { SearchableSelect } from '../common/SearchableSelect';

interface RequestListProps {
  onOpenCreate: () => void;
  onOpenDetail: (req: JudicialRequest) => void;
  onOpenEdit: (req: JudicialRequest) => void;
}

export const RequestList: React.FC<RequestListProps> = ({
  onOpenCreate,
  onOpenDetail,
  onOpenEdit,
}) => {
  const {
    requests,
    filteredRequests,
    filters,
    setFilters,
    resetFilters,
    deleteRequest,
    receiveRequest,
    startRequestWork,
  } = useRequests();
  const { currentUser, can } = useAuth();
  const { success } = useToast();

  const [sortField, setSortField] = useState<'criacao' | 'prazo' | 'processo'>('criacao');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [requestToDelete, setRequestToDelete] = useState<JudicialRequest | null>(null);
  const [requestToReceive, setRequestToReceive] = useState<JudicialRequest | null>(null);

  const allowedSectors = useMemo(() => {
    if (currentUser.role === 'Administrador') {
      return SETORES_SOLICITANTES;
    }
    return currentUser.setores && currentUser.setores.length > 0 ? currentUser.setores : [];
  }, [currentUser]);

  const hasNoAssignedSectors =
    currentUser.role !== 'Administrador' &&
    (!currentUser.setores || currentUser.setores.length === 0);

  const availableExamsForFilter = useMemo(() => {
    return getExamesPorSetor(filters.setor);
  }, [filters.setor]);

  // Paginação Padronizada
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleExportCSV = () => {
    ReportService.exportToCSV(sortedRequests, {
      filters,
      totalFiltered: sortedRequests.length,
      totalAll: requests.length,
      currentUser,
    });
    success(
      'Exportação Concluída',
      `${sortedRequests.length} requisição(ões) exportada(s) em planilha CSV.`
    );
  };

  const handleExportPDF = () => {
    ReportService.exportToPDF(sortedRequests, {
      filters,
      totalFiltered: sortedRequests.length,
      totalAll: requests.length,
      currentUser,
    });
    success(
      'Relatório Gerado',
      `Visualização e impressão do relatório em PDF iniciada para ${sortedRequests.length} registro(s).`
    );
  };

  const toggleSort = (field: 'prazo' | 'processo' | 'criacao') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Aplica ordenação
  const sortedRequests = useMemo(() => {
    return [...filteredRequests].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'prazo') {
        const isAIndef = isRequestPrazoIndefinido(a);
        const isBIndef = isRequestPrazoIndefinido(b);
        if (isAIndef && isBIndef) {
          comparison = 0;
        } else if (isAIndef) {
          comparison = 1;
        } else if (isBIndef) {
          comparison = -1;
        } else {
          comparison =
            new Date(a.prazoJudicial).getTime() - new Date(b.prazoJudicial).getTime();
        }
      } else if (sortField === 'processo') {
        comparison = a.numeroProcesso.localeCompare(b.numeroProcesso);
      } else if (sortField === 'criacao') {
        comparison =
          new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredRequests, sortField, sortOrder]);

  // Paginação
  const totalRecords = sortedRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRequests.slice(start, start + pageSize);
  }, [sortedRequests, currentPage, pageSize]);

  const handleClearFilters = () => {
    resetFilters();
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Requisições e Autos Periciais
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Controle de prazos processuais, exames forenses e andamento dos autos
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors shrink-0"
            title="Exportar requisições filtradas em planilha CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors shrink-0"
            title="Salvar relatório em PDF com os filtros ativos"
          >
            <Printer className="w-4 h-4 text-rose-600" />
            <span>Salvar PDF</span>
          </button>

          {can('canCreateRequest') && (
            <button
              type="button"
              onClick={onOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nova Requisição
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtros Padronizada */}
      <div className="relative z-20 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
        {/* Linha Superior: Busca Ampla 100% de largura */}
        <div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.busca}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, busca: e.target.value }));
                setCurrentPage(1);
              }}
              placeholder="Buscar processo, protocolo, REP, partes, origem ou descrição..."
              className="w-full h-[38px] pl-10 pr-9 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors text-slate-700"
            />
            {filters.busca && (
              <button
                type="button"
                onClick={() => {
                  setFilters((prev) => ({ ...prev, busca: '' }));
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Linha Inferior: Grade Equilibrada de Filtros com Período de Datas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 pt-3 border-t border-slate-100">
          {/* 1. Setor */}
          <div className="min-w-0">
            <div className="h-4 flex items-center mb-1.5">
              <label
                className="text-[10px] xl:text-[10.5px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap truncate block"
                title="Setor Solicitante"
              >
                Setor
              </label>
            </div>
            <SearchableSelect
              size="sm"
              options={allowedSectors}
              value={filters.setor}
              onChange={(val) => {
                setFilters((prev) => {
                  const newExams = getExamesPorSetor(val);
                  const resetExame = prev.tipoExame && !newExams.includes(prev.tipoExame);
                  return {
                    ...prev,
                    setor: val,
                    ...(resetExame ? { tipoExame: '' } : {}),
                  };
                });
                setCurrentPage(1);
              }}
              placeholder={allowedSectors.length > 0 ? 'Todos os setores' : 'Nenhum setor'}
              searchPlaceholder="Filtrar setor..."
            />
          </div>

          {/* 2. Tipo de Exame */}
          <div className="min-w-0">
            <div className="h-4 flex items-center mb-1.5">
              <label
                className="text-[10px] xl:text-[10.5px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap truncate block"
                title="Tipo de Exame Forense"
              >
                Tipo de Exame
              </label>
            </div>
            <SearchableSelect
              size="sm"
              options={availableExamsForFilter}
              value={filters.tipoExame}
              onChange={(val) => {
                setFilters((prev) => ({ ...prev, tipoExame: val }));
                setCurrentPage(1);
              }}
              placeholder={filters.setor ? 'Exames do setor' : 'Todos os exames'}
              searchPlaceholder="Filtrar exame..."
            />
          </div>

          {/* 3. Origem / Juízo (Agrupado junto a Setor e Exame como dados do processo) */}
          <div className="min-w-0">
            <div className="h-4 flex items-center mb-1.5">
              <label
                className="text-[10px] xl:text-[10.5px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap truncate block"
                title="Origem / Juízo Solicitante"
              >
                Origem / Juízo
              </label>
            </div>
            <SearchableSelect
              size="sm"
              options={ORIGENS_COMUNS}
              value={filters.origem}
              onChange={(val) => {
                setFilters((prev) => ({ ...prev, origem: val }));
                setCurrentPage(1);
              }}
              placeholder="Todas as origens"
              searchPlaceholder="Filtrar comarca, vara..."
            />
          </div>

          {/* 4. Status Operacional (Fluxo Canônico da Esteira & Alertas) */}
          <div className="min-w-0">
            <div className="h-4 flex items-center mb-1.5">
              <label
                className="text-[10px] xl:text-[10.5px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap truncate block"
                title="Status Operacional do Setor"
              >
                Status Operacional
              </label>
            </div>
            <select
              value={
                filters.status === 'Vencido'
                  ? 'Vencido'
                  : filters.status === 'urgente'
                  ? 'urgente'
                  : filters.statusOperacional || ''
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'Vencido' || val === 'urgente') {
                  setFilters((prev) => ({
                    ...prev,
                    status: val,
                    statusOperacional: '',
                  }));
                } else {
                  setFilters((prev) => ({
                    ...prev,
                    statusOperacional: (val as any) || '',
                    status: '',
                  }));
                }
                setCurrentPage(1);
              }}
              className="w-full h-[38px] px-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors text-slate-700"
            >
              <option value="">Todos os status</option>
              <option value="Aguardando recebimento">Aguardando Recebimento</option>
              <option value="Em andamento">Em Execução</option>
              <option value="Concluído">Concluídas</option>
              <option value="Vencido">Prazos Vencidos</option>
              <option value="urgente">Urgentes (Até 5 dias)</option>
            </select>
          </div>

          {/* 5. Tipo de Prazo */}
          <div className="min-w-0">
            <div className="h-4 flex items-center mb-1.5">
              <label
                className="text-[10px] xl:text-[10.5px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap truncate block"
                title="Tipo de Prazo (Judicial ou Interno)"
              >
                Tipo de Prazo
              </label>
            </div>
            <select
              value={filters.tipoPrazo || ''}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, tipoPrazo: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full h-[38px] px-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors text-slate-700"
            >
              <option value="">Todos</option>
              <option value="judicial">Prazo Judicial</option>
              <option value="interno">Sem Prazo Judicial</option>
            </select>
          </div>

          {/* 6. Data Inicial */}
          <div className="min-w-0">
            <div className="h-4 flex items-center mb-1.5">
              <label
                className="text-[10px] xl:text-[10.5px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap truncate block"
                title="Data Inicial do Prazo"
              >
                Data Inicial
              </label>
            </div>
            <input
              type="date"
              value={filters.dataInicio || ''}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, dataInicio: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full h-[38px] px-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors text-slate-700 leading-normal"
            />
          </div>

          {/* 7. Data Final */}
          <div className="min-w-0">
            <div className="h-4 flex items-center mb-1.5">
              <label
                className="text-[10px] xl:text-[10.5px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap truncate block"
                title="Data Final do Prazo"
              >
                Data Final
              </label>
            </div>
            <input
              type="date"
              value={filters.dataFim || ''}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, dataFim: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full h-[38px] px-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors text-slate-700 leading-normal"
            />
          </div>
        </div>

        {/* Barra de Filtros Ativos com Chips e Botão Único Limpar Filtros */}
        {(Boolean(
          filters.busca ||
          filters.tipoPrazo ||
          filters.status ||
          filters.statusOperacional ||
          filters.setor ||
          filters.tipoExame ||
          filters.origem ||
          filters.dataInicio ||
          filters.dataFim
        )) && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs animate-fade-in">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Filtrando por:
            </span>

            {filters.statusOperacional && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold">
                <span>Status Operacional:</span>
                <span className="text-indigo-900">
                  {filters.statusOperacional === 'Em andamento'
                    ? 'Em Execução'
                    : filters.statusOperacional}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, statusOperacional: '' }));
                    setCurrentPage(1);
                  }}
                  className="hover:text-indigo-950 font-bold ml-1 text-sm leading-none"
                  title="Remover este filtro"
                >
                  ×
                </button>
              </span>
            )}

            {filters.status && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                <span>Status:</span>
                <span className="text-blue-900">
                  {filters.status === 'pendentes'
                    ? 'Pendentes (Em Aberto)'
                    : filters.status === 'urgente'
                    ? 'Urgente (Até 5 dias)'
                    : filters.status === 'alta'
                    ? 'Alta (6-15 dias)'
                    : filters.status === 'media'
                    ? 'Média (16-30 dias)'
                    : filters.status === 'baixa'
                    ? 'Baixa (+30 dias)'
                    : filters.status === 'proximos'
                    ? 'Vencendo nos próximos 7 dias'
                    : filters.status}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, status: '' }));
                    setCurrentPage(1);
                  }}
                  className="hover:text-blue-950 font-bold ml-1 text-sm leading-none"
                  title="Remover este filtro"
                >
                  ×
                </button>
              </span>
            )}

            {filters.setor && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                <span>Setor:</span>
                <span className="text-slate-900">{filters.setor}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, setor: '' }));
                    setCurrentPage(1);
                  }}
                  className="hover:text-slate-950 font-bold ml-1 text-sm leading-none"
                  title="Remover este filtro"
                >
                  ×
                </button>
              </span>
            )}

            {filters.tipoExame && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                <span>Exame:</span>
                <span className="text-slate-900">{filters.tipoExame}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, tipoExame: '' }));
                    setCurrentPage(1);
                  }}
                  className="hover:text-slate-950 font-bold ml-1 text-sm leading-none"
                  title="Remover este filtro"
                >
                  ×
                </button>
              </span>
            )}

            {filters.tipoPrazo && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                <span>Tipo:</span>
                <span className="text-slate-900">
                  {filters.tipoPrazo === 'judicial' ? 'Prazo Judicial' : 'Sem Prazo Judicial'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, tipoPrazo: '' }));
                    setCurrentPage(1);
                  }}
                  className="hover:text-slate-950 font-bold ml-1 text-sm leading-none"
                  title="Remover este filtro"
                >
                  ×
                </button>
              </span>
            )}

            {filters.origem && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                <span>Origem:</span>
                <span className="text-slate-900">{filters.origem}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, origem: '' }));
                    setCurrentPage(1);
                  }}
                  className="hover:text-slate-950 font-bold ml-1 text-sm leading-none"
                  title="Remover este filtro"
                >
                  ×
                </button>
              </span>
            )}

            {filters.dataInicio && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                <span>A partir de:</span>
                <span className="text-slate-900">{formatDatePtBR(filters.dataInicio, false)}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, dataInicio: '' }));
                    setCurrentPage(1);
                  }}
                  className="hover:text-slate-950 font-bold ml-1 text-sm leading-none"
                  title="Remover este filtro"
                >
                  ×
                </button>
              </span>
            )}

            {filters.dataFim && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                <span>Até:</span>
                <span className="text-slate-900">{formatDatePtBR(filters.dataFim, false)}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, dataFim: '' }));
                    setCurrentPage(1);
                  }}
                  className="hover:text-slate-950 font-bold ml-1 text-sm leading-none"
                  title="Remover este filtro"
                >
                  ×
                </button>
              </span>
            )}

            {filters.busca && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                <span>Busca:</span>
                <span className="text-slate-900">"{filters.busca}"</span>
                <button
                  type="button"
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, busca: '' }));
                    setCurrentPage(1);
                  }}
                  className="hover:text-slate-950 font-bold ml-1 text-sm leading-none"
                  title="Remover este filtro"
                >
                  ×
                </button>
              </span>
            )}

            {/* Botão Único Limpar Filtros à direita (sem o duplicado "Limpar todos") */}
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 rounded-xl transition-colors ml-auto"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabela de Requisições / Lista */}
      {sortedRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          {hasNoAssignedSectors ? (
            <>
              <h3 className="text-base font-semibold text-slate-800">
                Acesso Operacional Restrito: Nenhum Setor Atribuído
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Seu perfil institucional não possui setores periciais responsáveis vinculados. Para visualizar, consultar e movimentar requisições, solicite ao Administrador a inclusão de seus setores de atuação.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-base font-semibold text-slate-800">
                Nenhuma requisição judicial encontrada
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Nenhum registro corresponde aos filtros selecionados. Tente alterar os termos da busca.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shadow-2xs"
                >
                  Limpar Filtros
                </button>
                {can('canCreateRequest') && (
                  <button
                    onClick={onOpenCreate}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                  >
                    Cadastrar Nova Requisição
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-blue-600 select-none"
                    onClick={() => toggleSort('criacao')}
                    title="Clique para alternar ordenação por data de cadastro (mais recentes)"
                  >
                    <div className="flex items-center gap-1">
                      <span>Processo / Protocolo / REP</span>
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'criacao' || sortField === 'processo' ? 'text-blue-600' : 'text-slate-400'}`} />
                      {sortField === 'criacao' && (
                        <span className="text-[10px] text-blue-600 font-bold lowercase">
                          (mais recentes)
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4">Setor & Exame</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-blue-600 select-none min-w-[200px]"
                    onClick={() => toggleSort('prazo')}
                    title="Clique para ordenar por prazo limite"
                  >
                    <div className="flex items-center gap-1">
                      <span>Prazo Limite</span>
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'prazo' ? 'text-blue-600' : 'text-slate-400'}`} />
                    </div>
                  </th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRequests.map((req) => {
                  const isPrazoIndefinido = isRequestPrazoIndefinido(req);
                  const countdown = formatDeadlineCountdown(req.prazoJudicial, req.status, new Date(), isPrazoIndefinido);
                  const prazoDate = new Date(req.prazoJudicial);
                  const diffMs = prazoDate.getTime() - new Date().getTime();
                  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

                  const countdownColorClass =
                    isPrazoIndefinido
                      ? 'text-slate-600 bg-slate-100 border-slate-200'
                      : req.status === 'Concluído'
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200/80'
                      : diffMs < 0 || diffDays <= 5
                      ? 'text-red-700 bg-red-50 border-red-200/80'
                      : diffDays <= 15
                      ? 'text-amber-800 bg-amber-50 border-amber-200/80'
                      : diffDays <= 30
                      ? 'text-blue-700 bg-blue-50 border-blue-200/80'
                      : 'text-slate-600 bg-slate-50 border-slate-200';

                  return (
                    <tr
                      key={req.id}
                      onClick={() => onOpenDetail(req)}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                    >
                      {/* Processo e Protocolo */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 font-mono text-xs sm:text-sm">
                          {req.numeroProcesso}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {req.descricao}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-mono flex-wrap">
                          <span>Entrada: {formatDatePtBR(req.criadoEm, false)}</span>
                          {req.protocolo && <span>• Prot: {req.protocolo}</span>}
                          {req.rep && <span>• REP: {req.rep}</span>}
                        </div>
                      </td>

                      {/* Setor e Exame */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 text-xs">
                          {req.tipoExame}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {req.setorSolicitante}
                        </div>
                        {req.origem && (
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                            {req.origem}
                          </div>
                        )}
                      </td>

                      {/* Prazo Limite */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5 justify-center">
                          {isPrazoIndefinido ? (
                            <>
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <span className="font-semibold text-slate-700 text-xs italic">
                                  A definir pelo setor
                                </span>
                              </div>
                              <div className="flex items-center">
                                <div className="inline-flex items-center gap-1.5 text-[10.5px] font-medium px-2 py-0.5 rounded-md border bg-slate-100 text-slate-600 border-slate-200">
                                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>Aguardando recebimento</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              {/* Linha 1: Data e Tipo de Prazo (lado a lado, padrão consistente em 100% das linhas) */}
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <span className="font-bold text-slate-900 text-xs font-mono tracking-tight">
                                  {formatDatePtBR(req.prazoJudicial)}
                                </span>
                                <TipoPrazoBadge
                                  tipoPrazo={req.tipoPrazo}
                                  temPrazoJudicial={req.temPrazoJudicial}
                                  size="sm"
                                />
                              </div>

                              {/* Linha 2: Contagem Regressiva e Urgência (em baixo da data, alinhado e padronizado) */}
                              <div className="flex items-center">
                                <div
                                  className={`inline-flex items-center gap-1.5 text-[10.5px] font-semibold px-2 py-0.5 rounded-md border shadow-2xs ${countdownColorClass}`}
                                >
                                  <Clock className="w-3 h-3 shrink-0" />
                                  <span>{countdown.label}</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Status Unificado e Perito Responsável */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5">
                          {req.statusOperacional === 'Aguardando recebimento' ? (
                            <>
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1.5 font-semibold text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  Aguardando Recebimento
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 text-[11px]">
                                {(currentUser.role === 'Administrador' ||
                                  (currentUser.role === 'Operacional' && (currentUser.setores || []).includes(req.setorSolicitante))) ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRequestToReceive(req);
                                    }}
                                    className="px-2.5 py-0.5 text-[11px] font-bold text-white bg-blue-700 hover:bg-blue-800 rounded shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                                    title="Receber formalmente esta demanda para o seu usuário"
                                  >
                                    <Handshake className="w-3 h-3" />
                                    Receber
                                  </button>
                                ) : (
                                  <span className="text-slate-400 italic">
                                    Fila do Setor
                                  </span>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5">
                                <StatusBadge
                                  status={req.status}
                                  statusOperacional={req.statusOperacional}
                                  size="sm"
                                />
                              </div>

                              <div className="flex items-center gap-1 text-[11px]">
                                <span
                                  className="text-slate-600 flex items-center gap-1 truncate max-w-[170px]"
                                  title={`Responsável: ${req.responsavelOperacionalNome || 'Setor'}`}
                                >
                                  <UserCheck className="w-3 h-3 text-blue-600 shrink-0" />
                                  <span className="font-medium text-slate-700 truncate">
                                    {req.responsavelOperacionalNome || 'Setor'}
                                  </span>
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Ações */}
                      <td
                        className="py-3.5 px-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenDetail(req)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Ver Detalhes do Processo"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {(() => {
                            const isAguardando = req.statusOperacional === 'Aguardando recebimento';
                            const isMine = !req.responsavelOperacionalId || req.responsavelOperacionalId === currentUser.id;
                            const isConcluido = req.status === 'Concluído';
                            // Administrador tem permissão total de correção.
                            // Usuário Operacional: NÃO pode editar antes de receber (deve clicar em 'Receber' primeiro) e não pode editar demanda já concluída.
                            const canEditRow = can('canEditRequest') && (
                              currentUser.role === 'Administrador' ||
                              (!isAguardando && isMine && !isConcluido && (currentUser.setores || []).includes(req.setorSolicitante))
                            );

                            return canEditRow ? (
                              <button
                                type="button"
                                onClick={() => onOpenEdit(req)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Editar Requisição"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            ) : null;
                          })()}

                          {can('canDeleteRequest') && (
                            <button
                              type="button"
                              onClick={() => setRequestToDelete(req)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Excluir Registro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Barra de Paginação Padronizada */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/60 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>Mostrar:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              >
                <option value={5}>5 registros</option>
                <option value={10}>10 registros</option>
                <option value={20}>20 registros</option>
                <option value={50}>50 registros</option>
              </select>
              <span>por página</span>
            </div>

            <div>
              Mostrando {totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1} a{' '}
              {Math.min(currentPage * pageSize, totalRecords)} de {totalRecords} registros
            </div>

            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  type="button"
                  onClick={() => setCurrentPage(pg)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                    currentPage === pg
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 hover:bg-white text-slate-600'
                  }`}
                >
                  {pg}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmação de exclusão */}
      {requestToDelete && (
        <ConfirmDialog
          isOpen={!!requestToDelete}
          onClose={() => setRequestToDelete(null)}
          onConfirm={() => {
            if (requestToDelete) {
              deleteRequest(requestToDelete.id);
              setRequestToDelete(null);
            }
          }}
          title="Excluir Requisição Judicial"
          message={`Confirmar a exclusão da requisição referente ao processo ${requestToDelete.numeroProcesso}?`}
          confirmLabel="Excluir Definitivamente"
          isDestructive
        />
      )}

      {/* Confirmação de Recebimento da Requisição direto na lista */}
      {requestToReceive && (
        <ConfirmDialog
          isOpen={Boolean(requestToReceive)}
          onClose={() => setRequestToReceive(null)}
          onConfirm={() => {
            if (requestToReceive) {
              const target = requestToReceive;
              const ok = receiveRequest(target.id);
              setRequestToReceive(null);
              if (ok) {
                // Abre imediatamente o modal de preenchimento completo!
                onOpenEdit({
                  ...target,
                  statusOperacional: 'Em andamento',
                  responsavelOperacionalId: currentUser.id,
                  responsavelOperacionalNome: currentUser.nome,
                  dataRecebimentoOperacional: new Date().toISOString(),
                  dataIniciadoOperacional: new Date().toISOString(),
                });
              }
            }
          }}
          title="Receber Requisição Pericial"
          message={`Deseja assumir formalmente a responsabilidade técnica pela demanda do Processo nº "${requestToReceive.numeroProcesso}" no setor de ${requestToReceive.setorSolicitante}? Ao confirmar, seu usuário (${currentUser.nome}) será registrado e o formulário de preenchimento completo abrirá automaticamente.`}
          confirmLabel="Sim, Receber"
          cancelLabel="Cancelar"
          iconType="question"
        />
      )}
    </div>
  );
};
