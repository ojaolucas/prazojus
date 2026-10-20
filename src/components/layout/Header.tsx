import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRequests } from '../../context/RequestContext';
import { NavTab } from './Sidebar';
import {
  Menu,
  Bell,
  Plus,
  Shield,
  Calendar as CalendarIcon,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { formatDatePtBR } from '../../services/deadlineService';

interface HeaderProps {
  currentTab: NavTab;
  onOpenMobileMenu: () => void;
  onOpenCreate: () => void;
  onNavigate: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileMenu,
  onOpenCreate,
  onNavigate,
}) => {
  const { currentUser, currentRole, setIsLoginModalOpen } = useAuth();
  const { notifications, unreadNotificationsCount, markNotificationAsRead } =
    useRequests();

  const [isNotifPopoverOpen, setIsNotifPopoverOpen] = useState(false);

  const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Visão Geral dos Prazos',
      subtitle: 'Acompanhamento integrado de prazos e perícias',
    },
    calendar: {
      title: 'Calendário de Prazos',
      subtitle: 'Organização visual estilo Google Agenda',
    },
    requests: {
      title: 'Requisições Judiciais',
      subtitle: 'Gestão, consulta e acompanhamento de autos',
    },
    notifications: {
      title: 'Central de Alertas',
      subtitle: 'Notificações preventivas de vencimento',
    },
    users: {
      title: 'Gestão de Usuários',
      subtitle: 'Credenciais institucionais, cargos e permissões de acesso',
    },
    settings: {
      title: 'Backup e Persistência',
      subtitle: 'Armazenamento local e exportação/importação',
    },
  };

  const currentMeta = tabTitles[currentTab];
  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-3">
        {/* Esquerda: Botão Menu Mobile e Título */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg md:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
              {currentMeta.title}
            </h2>
            <p className="text-xs text-slate-400 hidden sm:block">
              {currentMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Direita: Data, Notificações, Perfil e Botão Adicionar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Data Atual */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
            <span className="capitalize">{todayFormatted}</span>
          </div>

          {/* Sino de Notificações com Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotifPopoverOpen(!isNotifPopoverOpen)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Notificações"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#D12429] rounded-full ring-2 ring-white" />
              )}
            </button>

            {/* Popover Rápido de Notificações */}
            {isNotifPopoverOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsNotifPopoverOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Notificações Recentes
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotifPopoverOpen(false);
                        onNavigate('notifications');
                      }}
                      className="text-xs text-[#274578] hover:underline font-semibold"
                    >
                      Ver Todas
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-1.5">
                    {notifications.slice(0, 4).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationAsRead(n.id);
                          setIsNotifPopoverOpen(false);
                          onNavigate('notifications');
                        }}
                        className={`p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                          n.lida
                            ? 'bg-slate-50 text-slate-600'
                            : 'bg-[#C9D7EE]/40 text-[#122443] font-medium'
                        }`}
                      >
                        <p className="font-semibold text-[11px] truncate">{n.titulo}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                          {n.mensagem}
                        </p>
                      </div>
                    ))}

                    {notifications.length === 0 && (
                      <p className="text-xs text-slate-400 py-4 text-center">
                        Nenhuma notificação recente.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Chip do Perfil Ativo */}
          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors"
            title="Clique para alternar o perfil de usuário"
          >
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px] text-white shrink-0 ${
                currentRole === 'Administrador'
                  ? 'bg-[#122443]'
                  : currentRole === 'Supervisor'
                  ? 'bg-[#797025]'
                  : 'bg-[#274578]'
              }`}
            >
              {currentUser.nome[0]}
            </div>
            <div className="hidden md:block">
              <span className="text-xs font-semibold text-slate-800 block leading-tight">
                {currentUser.nome.split(' ')[0]}
              </span>
              <span className="text-[10px] text-slate-500 block leading-tight">
                {currentRole}
              </span>
            </div>
          </button>

          {/* Botão Nova Requisição */}
          <button
            type="button"
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold text-[#0F0D02] bg-[#C5B641] hover:bg-[#EFDD51] rounded-lg shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4 text-[#0F0D02]" />
            <span className="hidden sm:inline">Nova Requisição</span>
          </button>
        </div>
      </div>
    </header>
  );
};
