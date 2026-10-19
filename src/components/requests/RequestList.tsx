import React, { useState } from 'react';
import { useRequests } from '../../context/RequestContext';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, PriorityBadge } from './StatusBadge';
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
  Filter,
  Plus,
  Trash2,
  Edit,
  Eye,
  RotateCcw,
  Clock,
  ArrowUpDown,
  Building2,
  FileText,
  AlertCircle,
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
  const [showFilters, setShowFilters] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<JudicialRequest | null>(null);

  const toggleSort = (field: 'prazo' | 'processo' | 'criacao') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Aplica ordenação
  const sortedRequests = [...filteredRequests].sort((a, b) => {
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

  const hasActiveFilters =
    filters.busca ||
    filters.setor ||
    filters.tipoExame ||
    filters.origem ||
    filters.status ||
    filters.prioridade;

  return (
    <div className="space-y-4">
      {/* Barra de Busca e Ações Rápidas */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Campo de Busca Geral */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.busca}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, busca: e.target.value }))
              }
              placeholder="Buscar por Processo, Protocolo, REP, Investigado, Vítima ou Descrição..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
            {filters.busca && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, busca: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtros
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-blue-600 ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={onOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nova Requisição
            </button>
          </div>
        </div>

        {/* Painel Expansível de Filtros Avançados */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 animate-fade-in text-xs">
            {/* Filtro Status */}
            <div>
              <label className="block text-slate-500 font-medium mb-1">Status:</label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">Todos os status</option>
                <option value="Pendente">Pendente</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Aguardando informações">Aguardando informações</option>
                <option value="Concluído">Concluído</option>
                <option value="Vencido">Vencido</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            {/* Filtro Prioridade */}
            <div>
              <label className="block text-slate-500 font-medium mb-1">Prioridade:</label>
              <select
                value={filters.prioridade}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, prioridade: e.target.value }))
                }
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">Todas as prioridades</option>
                <option value="Urgente">Urgente (&le; 1 dia)</option>
                <option value="Alta">Alta (2 a 3 dias)</option>
                <option value="Média">Média (4 a 7 dias)</option>
                <option value="Baixa">Baixa (&gt; 7 dias)</option>
              </select>
            </div>

            {/* Filtro Setor */}
            <div>
              <label className="block text-slate-500 font-medium mb-1">Setor Solicitante:</label>
              <select
                value={filters.setor}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, setor: e.target.value }))
                }
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">Todos os setores</option>
                {SETORES_SOLICITANTES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Exame */}
            <div>
              <label className="block text-slate-500 font-medium mb-1">Tipo de Exame:</label>
              <select
                value={filters.tipoExame}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, tipoExame: e.target.value }))
                }
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">Todos os tipos</option>
                {TIPOS_DE_EXAME.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Origem */}
            <div>
              <label className="block text-slate-500 font-medium mb-1">Origem / Juízo:</label>
              <select
                value={filters.origem}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, origem: e.target.value }))
                }
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
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
        )}

        {/* Linha de Status de Filtros */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-2">
            <span>
              Exibindo <strong>{sortedRequests.length}</strong> de{' '}
              {filteredRequests.length} requisições
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium ml-2"
              >
                <RotateCcw className="w-3 h-3" />
                Limpar Filtros
              </button>
            )}
          </div>

          {/* Ordenador */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400">Ordenar por:</span>
            <button
              onClick={() => toggleSort('prazo')}
              className={`px-2 py-0.5 rounded font-medium ${
                sortField === 'prazo'
                  ? 'bg-blue-100 text-blue-800'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              Prazo {sortField === 'prazo' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('processo')}
              className={`px-2 py-0.5 rounded font-medium ${
                sortField === 'processo'
                  ? 'bg-blue-100 text-blue-800'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              Processo {sortField === 'processo' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Requisições / Lista */}
      {sortedRequests.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">
            Nenhuma requisição judicial encontrada
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {hasActiveFilters
              ? 'Nenhum registro corresponde aos filtros selecionados. Tente alterar os termos da busca.'
              : 'Não há requisições cadastradas no momento. Clique abaixo para protocolar o primeiro registro.'}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Limpar Filtros
              </button>
            )}
            <button
              onClick={onOpenCreate}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors"
            >
              Cadastrar Nova Requisição
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Processo / Protocolo</th>
                  <th className="py-3 px-4">Setor & Exame</th>
                  <th className="py-3 px-4">Prazo Limite</th>
                  <th className="py-3 px-4">Prioridade</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sortedRequests.map((req) => {
                  const countdown = formatDeadlineCountdown(req.prazoJudicial, req.status);

                  return (
                    <tr
                      key={req.id}
                      onClick={() => onOpenDetail(req)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Processo e Protocolo */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-700 font-mono text-xs sm:text-sm">
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
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 text-xs">
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
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900 text-xs">
                          {formatDatePtBR(req.prazoJudicial)}
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

                      {/* Prioridade */}
                      <td className="py-3 px-4">
                        <PriorityBadge
                          prazoJudicial={req.prazoJudicial}
                          status={req.status}
                          prioridadeManual={req.prioridadeManual}
                          size="sm"
                        />
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={req.status} size="sm" />
                      </td>

                      {/* Ações */}
                      <td
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenDetail(req)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver Detalhes do Processo"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenEdit(req)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Editar Requisição"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {can('canDeleteRequest') && (
                            <button
                              type="button"
                              onClick={() => setRequestToDelete(req)}
                              className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
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
        </div>
      )}

      {/* Confirmação de exclusão da lista */}
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
