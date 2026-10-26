import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuditService } from '../../services/auditService';
import {
  AuditLogEntry,
  AuditFilters,
  AuditActionType,
  AuditModule,
} from '../../types/audit';
import { AuditDetailModal } from './AuditDetailModal';
import {
  Search,
  FilterX,
  FileSpreadsheet,
  RefreshCw,
  Lock,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Eye,
  Shield,
  Clock,
} from 'lucide-react';

const ITEMS_PER_PAGE = 15;

const DEFAULT_FILTERS: AuditFilters = {
  busca: '',
  usuarioId: '',
  modulo: '',
  acao: '',
  status: '',
  dataInicio: '',
  dataFim: '',
};

export const AuditView: React.FC = () => {
  const { currentUser, can, users } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => AuditService.getLogs());
  const [filters, setFilters] = useState<AuditFilters>(DEFAULT_FILTERS);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Recarrega os logs
  const refreshLogs = () => {
    setLogs(AuditService.getLogs());
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  // Checagem estrita de permissão de acesso
  const hasAccess = can('canViewAudit');

  // Filtragem dos logs
  const filteredLogs = useMemo(() => {
    return AuditService.filterLogs(logs, filters);
  }, [logs, filters]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  const handleFilterChange = (key: keyof AuditFilters, val: string) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    filters.busca ||
    filters.usuarioId ||
    filters.modulo ||
    filters.acao ||
    filters.status ||
    filters.dataInicio ||
    filters.dataFim
  );


  if (!hasAccess) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xl space-y-4 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Acesso Restrito à Auditoria</h2>
          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
            Seu perfil atual (<strong>{currentUser.role}</strong>) não possui permissão para consultar
            os registros de auditoria do sistema PrazoJus.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-left space-y-1">
          <p className="font-semibold text-slate-700">Políticas de Segurança e Conformidade:</p>
          <p>
            • A consulta de logs de rastreabilidade é restrita ao perfil de{' '}
            <strong>Administrador</strong>.
          </p>
          <p>
            • Em caso de necessidade para fins de sindicância ou correição pericial, solicite a
            emissão de relatório ao Administrador da unidade.
          </p>
        </div>
      </div>
    );
  }

  const getModuleBadge = (mod: AuditModule) => {
    switch (mod) {
      case 'requisicoes':
        return { label: 'Requisições', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'usuarios':
        return { label: 'Usuários', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'documentos':
        return { label: 'Documentos', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'autenticacao':
        return { label: 'Acesso', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'backup':
        return { label: 'Backup', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'sistema':
        return { label: 'Sistema', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
      default:
        return { label: mod, bg: 'bg-slate-50 text-slate-600 border-slate-200' };
    }
  };

  const getActionBadge = (acao: AuditActionType) => {
    switch (acao) {
      case 'criacao':
        return { label: 'Criação', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 'edicao':
        return { label: 'Edição', color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'exclusao':
        return { label: 'Exclusão', color: 'text-rose-700 bg-rose-50 border-rose-200' };
      case 'status':
        return { label: 'Status', color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'documento':
        return { label: 'Documento', color: 'text-purple-700 bg-purple-50 border-purple-200' };
      case 'acesso':
        return { label: 'Acesso', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
      case 'backup':
        return { label: 'Backup', color: 'text-teal-700 bg-teal-50 border-teal-200' };
      default:
        return { label: acao, color: 'text-slate-700 bg-slate-50 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho Padronizado da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Auditoria e Rastreabilidade
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Histórico completo de ações, alterações de processos e controle de segurança
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={refreshLogs}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors shrink-0"
            title="Atualizar lista de registros"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            onClick={() => AuditService.exportToCSV(filteredLogs)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors shrink-0"
            title="Exportar planilha CSV formatada"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros Padronizada */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
        {/* Linha Superior: Busca Ampla */}
        <div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.busca}
              onChange={(e) => handleFilterChange('busca', e.target.value)}
              placeholder="Buscar por usuário, processo, protocolo, descrição ou matrícula..."
              className="w-full pl-10 pr-9 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors text-slate-700"
            />
            {filters.busca && (
              <button
                type="button"
                onClick={() => handleFilterChange('busca', '')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Linha Inferior: 5 Seletores Padronizados + Botão Limpar Filtros Sempre Ativo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-100 items-end">
          {/* MÓDULO */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 truncate">
              Módulo
            </label>
            <select
              value={filters.modulo}
              onChange={(e) => handleFilterChange('modulo', e.target.value)}
              className="w-full h-[38px] px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors text-slate-700 cursor-pointer"
            >
              <option value="">Todos</option>
              <option value="requisicoes">Requisições</option>
              <option value="documentos">Documentos / Anexos</option>
              <option value="usuarios">Gestão de Usuários</option>
              <option value="autenticacao">Autenticação & Acesso</option>
              <option value="backup">Backup & Dados</option>
              <option value="sistema">Sistema</option>
            </select>
          </div>

          {/* TIPO DE AÇÃO */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 truncate">
              Tipo de Ação
            </label>
            <select
              value={filters.acao}
              onChange={(e) => handleFilterChange('acao', e.target.value)}
              className="w-full h-[38px] px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors text-slate-700 cursor-pointer"
            >
              <option value="">Todas</option>
              <option value="criacao">Criação / Cadastro</option>
              <option value="edicao">Modificação / Edição</option>
              <option value="status">Mudança de Status</option>
              <option value="documento">Anexo de Documento</option>
              <option value="exclusao">Exclusão</option>
              <option value="acesso">Acesso / Sessão</option>
              <option value="backup">Cópia de Segurança</option>
            </select>
          </div>

          {/* USUÁRIO */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 truncate">
              Usuário
            </label>
            <select
              value={filters.usuarioId}
              onChange={(e) => handleFilterChange('usuarioId', e.target.value)}
              className="w-full h-[38px] px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors text-slate-700 cursor-pointer"
            >
              <option value="">Todos os usuários</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* DATA INICIAL */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 truncate">
              Data Inicial
            </label>
            <input
              type="date"
              value={filters.dataInicio}
              onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
              className="w-full h-[38px] px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors text-slate-700 cursor-pointer"
            />
          </div>

          {/* DATA FINAL */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 truncate">
              Data Final
            </label>
            <input
              type="date"
              value={filters.dataFim}
              onChange={(e) => handleFilterChange('dataFim', e.target.value)}
              className="w-full h-[38px] px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors text-slate-700 cursor-pointer"
            />
          </div>

          {/* BOTÃO LIMPAR FILTROS (SEMPRE ATIVO) */}
          <div>
            <button
              type="button"
              onClick={resetFilters}
              className="w-full h-[38px] flex items-center justify-center gap-1.5 px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
              title="Limpar todos os filtros aplicados"
            >
              <FilterX className="w-3.5 h-3.5 text-slate-500" />
              <span>Limpar Filtros</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Registros de Auditoria Padronizada */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Cabeçalho da Tabela */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">
              Trilha de Auditoria do Sistema
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mostrando {filteredLogs.length} eventos registrados em ordem cronológica decrescente
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-[11px]">Modo Somente Leitura</span>
          </div>
        </div>

        {/* Tabela com estilo de RequestList */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Data & Horário</th>
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-3">Módulo</th>
                <th className="py-3 px-3">Ação</th>
                <th className="py-3 px-4">Descrição da Operação</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center w-24">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.map((log) => {
                const modBadge = getModuleBadge(log.modulo);
                const actBadge = getActionBadge(log.acao);
                const isSuccess = log.status === 'sucesso';

                return (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    {/* Data / Hora */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-700 font-medium align-middle">
                      {log.dataHoraFormatada}
                    </td>

                    {/* Usuário */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-bold text-slate-900 leading-tight">
                        {log.usuarioNome}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <span className="font-semibold">{log.usuarioRole}</span>
                        {log.usuarioMatricula && (
                          <span className="font-mono text-slate-400">• {log.usuarioMatricula}</span>
                        )}
                      </div>
                    </td>

                    {/* Módulo */}
                    <td className="py-3.5 px-3 whitespace-nowrap align-middle">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${modBadge.bg}`}
                      >
                        {modBadge.label}
                      </span>
                    </td>

                    {/* Ação */}
                    <td className="py-3.5 px-3 whitespace-nowrap align-middle">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${actBadge.color}`}
                      >
                        {actBadge.label}
                      </span>
                    </td>

                    {/* Descrição */}
                    <td className="py-3.5 px-4 max-w-md text-slate-800 align-middle">
                      <p className="line-clamp-2 leading-relaxed font-medium">
                        {log.descricao}
                      </p>
                      {log.entidadeReferencia && (
                        <span className="inline-block mt-0.5 text-[10px] text-slate-500 font-mono bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200">
                          Ref: {log.entidadeReferencia}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap align-middle">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                          isSuccess
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {isSuccess ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                        )}
                        <span>{isSuccess ? 'Sucesso' : 'Falha'}</span>
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition-colors"
                        title="Ver dados e histórico completo deste registro"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {paginatedLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Shield className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 text-sm">
                      Nenhum registro de auditoria encontrado.
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tente alterar ou limpar os filtros de busca para visualizar outros eventos.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação Padronizada */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
            <div>
              Mostrando página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> (
              {filteredLogs.length} total)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      (p >= currentPage - 1 && p <= currentPage + 1)
                  )
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-slate-400">...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                          p === currentPage
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Próxima página"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Auditoria com Modal Padrão */}
      <AuditDetailModal
        log={selectedLog}
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
};
