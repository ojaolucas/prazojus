import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRequests } from '../../context/RequestContext';
import { AppNotification } from '../../types/notification';
import { JudicialRequest } from '../../types/request';
import { formatDatePtBR } from '../../services/deadlineService';
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Info,
  CheckCircle,
  FilterX,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';

interface NotificationCenterProps {
  onSelectRequest: (req: JudicialRequest) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onSelectRequest,
}) => {
  const { currentUser } = useAuth();
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    requests,
  } = useRequests();

  // Filtros
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');

  // Paginação
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitulo = n.titulo.toLowerCase().includes(q);
        const matchesMsg = n.mensagem.toLowerCase().includes(q);
        const matchesProcesso = (n.numeroProcesso || '').toLowerCase().includes(q);
        const matchesLidaPor = (n.lidaPor || '').toLowerCase().includes(q);
        if (!matchesTitulo && !matchesMsg && !matchesProcesso && !matchesLidaPor) return false;
      }

      if (filterStatus === 'unread' && n.lida) return false;
      if (filterStatus === 'read' && !n.lida) return false;

      if (filterTipo !== 'all' && n.tipo !== filterTipo) return false;

      return true;
    });
  }, [notifications, search, filterStatus, filterTipo]);

  const totalRecords = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleClearFilters = () => {
    setSearch('');
    setFilterStatus('all');
    setFilterTipo('all');
    setCurrentPage(1);
  };

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    const target = requests.find((r) => r.id === notif.requisicaoId);
    if (target) {
      onSelectRequest(target);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header da Central */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Central de Notificações de Prazos
            </h1>
            {unreadNotificationsCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800">
                {unreadNotificationsCount} novas
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Alertas preventivos gerados com base na proximidade dos prazos processuais (7d, 3d, 1d, hoje e vencidos)
          </p>
        </div>

        {unreadNotificationsCount > 0 && (
          <button
            type="button"
            onClick={markAllNotificationsAsRead}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors shrink-0"
          >
            <CheckCheck className="w-4 h-4" />
            Marcar Todas como Lidas
          </button>
        )}
      </div>

      {/* Barra de Filtros Padronizada */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
          {/* Buscar */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Buscar Notificação / Processo
            </label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Situação */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Situação da Notificação
            </label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as 'all' | 'unread' | 'read');
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors text-slate-700"
            >
              <option value="all">Todas as notificações</option>
              <option value="unread">Apenas Não Lidas</option>
              <option value="read">Apenas Lidas</option>
            </select>
          </div>

          {/* Tipo de Alerta */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Tipo de Alerta
            </label>
            <select
              value={filterTipo}
              onChange={(e) => {
                setFilterTipo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors text-slate-700"
            >
              <option value="all">Todos os tipos</option>
              <option value="urgente">Urgente (Vencido / Vence Hoje)</option>
              <option value="alerta">Alerta (1 a 3 dias)</option>
              <option value="aviso">Aviso (7 dias)</option>
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
      </div>

      {/* Lista de Notificações com Paginação Padronizada */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">
            Nenhuma notificação encontrada
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Não há avisos de prazos correspondentes aos filtros selecionados.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shadow-2xs"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {paginatedNotifications.map((notif) => {
              let icon = <Info className="w-5 h-5 text-blue-600" />;
              let badgeText = 'Aviso';
              let badgeBg = 'bg-blue-100 text-blue-800 border-blue-200';

              if (notif.tipo === 'urgente') {
                icon = <AlertCircle className="w-5 h-5 text-rose-600" />;
                badgeText = notif.marco === 'vencido' ? 'Vencido' : 'Vence Hoje';
                badgeBg = 'bg-rose-100 text-rose-800 border-rose-300';
              } else if (notif.tipo === 'alerta') {
                icon = <AlertTriangle className="w-5 h-5 text-amber-600" />;
                badgeText = notif.marco === '1d' ? 'Vence Amanhã' : 'Prazo em 3 dias';
                badgeBg = 'bg-amber-100 text-amber-800 border-amber-300';
              } else if (notif.tipo === 'aviso') {
                icon = <Clock className="w-5 h-5 text-sky-600" />;
                badgeText = 'Prazo em 7 dias';
                badgeBg = 'bg-sky-100 text-sky-800 border-sky-300';
              }

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 transition-colors cursor-pointer flex items-start justify-between gap-3 hover:bg-slate-50/60 ${
                    notif.lida ? 'bg-white opacity-85' : 'bg-blue-50/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 shrink-0 mt-0.5">
                      {icon}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-full border ${badgeBg}`}
                        >
                          {badgeText}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                          {notif.titulo}
                        </h4>
                        {!notif.lida && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        {notif.mensagem}
                      </p>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 flex-wrap">
                        <span>Gerado em {formatDatePtBR(notif.criadaEm)}</span>
                        <span>• Clique para inspecionar os autos</span>
                        <span className="text-slate-300">•</span>
                        {notif.lida ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200/70 px-2 py-0.5 rounded-md border border-slate-200/80 transition-colors"
                            title={notif.lidaEm ? `Visualizado em ${formatDatePtBR(notif.lidaEm, true)}` : undefined}
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              Visualizado por{' '}
                              <strong className="text-slate-800 font-semibold">
                                "{notif.lidaPor || currentUser.nome}"
                              </strong>
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-700 bg-blue-50/90 border border-blue-200/70 px-2 py-0.5 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                            <span>Não visualizado</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!notif.lida && (
                      <button
                        type="button"
                        onClick={() => markNotificationAsRead(notif.id)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Marcar como lida"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteNotification(notif.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir notificação"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
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
    </div>
  );
};
