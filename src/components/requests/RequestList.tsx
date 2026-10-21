import React, { useState, useMemo } from 'react';
import { useRequests } from '../../context/RequestContext';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, TipoPrazoBadge } from './StatusBadge';
import {
  formatDatePtBR,
  formatDeadlineCountdown,
} from '../../services/deadlineService';
import {
  SETORES_SOLICITANTES,
  TIPOS_DE_EXAME,
  ORIGENS_COMUNS,
} from '../../data/constants';
import {
  Search,
  FilterX,
  Plus,
  Trash2,
  Edit,
  Eye,
  Clock,
  Building2,
  FileText,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import { JudicialRequest } from '../../types/request';
import { ConfirmDialog } from '../layout/ConfirmDialog';

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
  const { filteredRequests, filters, setFilters, resetFilters, deleteRequest } =
    useRequests();
  const { can } = useAuth();

  const [sortField, setSortField] = useState<'prazo' | 'processo' | 'criacao'>('prazo');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [requestToDelete, setRequestToDelete] = useState<JudicialRequest | null>(null);

  // Paginação Padronizada
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

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
        comparison =
          new Date(a.prazoJudicial).getTime() - new Date(b.prazoJudicial).getTime();
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

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nova Requisição
          </button>
        </div>
      </div>

      {/* Barra de Filtros Padronizada */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
          {/* Buscar Processo / Protocolo / REP / Partes */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Buscar Processo / Protocolo / REP / Partes
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.busca}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, busca: e.target.value }));
                  setCurrentPage(1);
                }}
                placeholder="Buscar..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors"
              />
              {filters.busca && (
                <button
                  type="button"
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, busca: '' }));
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Tipo de Prazo */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Tipo de Prazo
            </label>
            <select
              value={filters.tipoPrazo || ''}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, tipoPrazo: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors text-slate-700"
            >
              <option value="">Todos os tipos</option>
              <option value="judicial">Prazo Judicial</option>
              <option value="interno">Sem Prazo Judicial</option>
            </select>
          </div>

          {/* Status Operacional / Prazo */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Status Operacional / Prazo
            </label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, status: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors text-slate-700"
            >
              <option value="">Todos os status</option>
              <option value="Não iniciado">Não iniciado</option>
              <option value="Iniciado">Iniciado</option>
              <option value="Concluído">Concluído</option>
              <option value="Vencido">Vencido</option>
              <option value="Cancelado">Cancelado</option>
              <option value="proximos">Vencendo nos próximos 7 dias</option>
            </select>
          </div>

          {/* Botão Limpar Filtros */}
          <div>
            <button
              type="button"
              onClick={handleClearFilters}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs h-[38px]"
            >
              <FilterX className="w-3.5 h-3.5 text-slate-500" />
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Linha Complementar de Filtros (Setor, Exame, Origem) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-3.5 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Setor Solicitante
            </label>
            <select
              value={filters.setor}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, setor: e.target.value }));
                setCurrentPage(1);
              }}
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
              Tipo de Exame
            </label>
            <select
              value={filters.tipoExame}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, tipoExame: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors text-slate-700"
            >
              <option value="">Todos os tipos</option>
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
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, origem: e.target.value }));
                setCurrentPage(1);
              }}
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

      {/* Tabela de Requisições / Lista */}
      {sortedRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
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
            <button
              onClick={onOpenCreate}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              Cadastrar Nova Requisição
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-blue-600 select-none"
                    onClick={() => toggleSort('processo')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Processo / Protocolo / REP</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Setor & Exame</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-blue-600 select-none"
                    onClick={() => toggleSort('prazo')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Prazo Limite</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRequests.map((req) => {
                  const countdown = formatDeadlineCountdown(req.prazoJudicial, req.status);

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
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-mono">
                          {req.protocolo && <span>Prot: {req.protocolo}</span>}
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs">
                            {formatDatePtBR(req.prazoJudicial)}
                          </span>
                          <TipoPrazoBadge
                            tipoPrazo={req.tipoPrazo}
                            temPrazoJudicial={req.temPrazoJudicial}
                            size="sm"
                          />
                        </div>
                        <div
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold mt-1 px-1.5 py-0.5 rounded ${
                            countdown.urgency === 'vencido'
                              ? 'text-rose-700 bg-rose-50'
                              : countdown.urgency === 'hoje'
                              ? 'text-amber-700 bg-amber-50'
                              : countdown.urgency === 'proximo'
                              ? 'text-blue-700 bg-blue-50'
                              : countdown.urgency === 'concluido'
                              ? 'text-emerald-700 bg-emerald-50'
                              : 'text-slate-600 bg-slate-50'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {countdown.label}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={req.status} size="sm" />
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
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver Detalhes do Processo"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenEdit(req)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Editar Requisição"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

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
    </div>
  );
};
