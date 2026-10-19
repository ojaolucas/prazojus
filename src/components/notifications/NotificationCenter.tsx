import React, { useState } from 'react';
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
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface NotificationCenterProps {
  onSelectRequest: (req: JudicialRequest) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onSelectRequest,
}) => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    requests,
  } = useRequests();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.lida;
    return true;
  });

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    const target = requests.find((r) => r.id === notif.requisicaoId);
    if (target) {
      onSelectRequest(target);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header da Central */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-700" />
              Central de Notificações de Prazos
            </h2>
            {unreadNotificationsCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800">
                {unreadNotificationsCount} novas
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Alertas preventivos gerados com base na proximidade dos prazos processuais (7d, 3d, 1d, hoje e vencidos)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Alternador Todas / Não Lidas */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium border border-slate-200">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filter === 'unread'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Não lidas ({unreadNotificationsCount})
            </button>
          </div>

          {unreadNotificationsCount > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs shrink-0"
            >
              <CheckCheck className="w-4 h-4 text-blue-600" />
              Marcar Todas como Lidas
            </button>
          )}
        </div>
      </div>

      {/* Aviso Técnico Importante de Escopo Local */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block">Funcionamento da Central de Alertas</span>
          <p className="text-blue-800 mt-0.5">
            As notificações são recalculadas em tempo real a partir dos registros persistidos no
            LocalStorage ao abrir ou interagir com o sistema. Por operar exclusivamente no cliente,
            não são emitidos alertas quando o navegador estiver fechado.
          </p>
        </div>
      </div>

      {/* Lista de Notificações */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">
            Nenhuma notificação {filter === 'unread' ? 'não lida' : ''}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {filter === 'unread'
              ? 'Todas as suas notificações foram visualizadas.'
              : 'Não há avisos de prazos no momento.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((notif) => {
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
                className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs flex items-start justify-between gap-3 ${
                  notif.lida
                    ? 'bg-white border-slate-200 opacity-80'
                    : 'bg-white border-blue-300 ring-1 ring-blue-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 shrink-0 mt-0.5">
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

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5">
                      <span>Gerado em {formatDatePtBR(notif.criadaEm)}</span>
                      <span>• Clique para inspecionar os autos</span>
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
                      className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Marcar como lida"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteNotification(notif.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Excluir notificação"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
