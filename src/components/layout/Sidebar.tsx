import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRequests } from '../../context/RequestContext';
import {
  LayoutDashboard,
  Calendar,
  FileSpreadsheet,
  Bell,
  Users,
  Database,
  Shield,
  LogOut,
  X,
  Scale,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'calendar'
  | 'requests'
  | 'notifications'
  | 'users'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { currentUser, currentRole, setIsLoginModalOpen } = useAuth();
  const { unreadNotificationsCount } = useRequests();

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'calendar',
      label: 'Calendário de Prazos',
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      id: 'requests',
      label: 'Requisições e Autos',
      icon: <FileSpreadsheet className="w-5 h-5" />,
    },
    {
      id: 'notifications',
      label: 'Notificações',
      icon: <Bell className="w-5 h-5" />,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
    },
    {
      id: 'users',
      label: 'Gestão de Usuários',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'Backup e Dados',
      icon: <Database className="w-5 h-5" />,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#122443] text-slate-300 flex flex-col justify-between border-r border-[#274578]/50 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Branding */}
        <div>
          <div className="flex items-center justify-between px-4 py-4 border-b border-[#274578]/40 bg-[#0B1629]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0F1D38] border border-[#C5B641]/40 p-1 flex items-center justify-center shadow-inner shrink-0 group">
                <img
                  src="/policia-cientifica-logo.png"
                  alt="Polícia Científica AL"
                  className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] transition-transform duration-200 group-hover:scale-105"
                />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
                  PrazoJus
                  <span className="text-[9px] font-bold bg-[#C5B641] text-[#0F0D02] px-1.5 py-0.2 rounded shadow-2xs">
                    PCAL
                  </span>
                </h1>
                <p className="text-[10px] text-[#C9D7EE] font-medium leading-tight">
                  Polícia Científica de Alagoas
                </p>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#274578] text-white font-semibold shadow-xs border-l-3 border-[#C5B641]'
                      : 'text-[#C9D7EE]/80 hover:text-white hover:bg-[#274578]/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-[#EFDD51]' : 'text-[#95B1DE]'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        item.id === 'notifications'
                          ? 'bg-[#D12429] text-white'
                          : isActive
                          ? 'bg-[#C5B641] text-[#0F0D02]'
                          : 'bg-[#274578] text-[#C9D7EE]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-3 border-t border-[#274578]/50 bg-[#0B1629]">
          <div className="p-3 rounded-xl bg-[#122443] border border-[#274578]/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  currentRole === 'Administrador'
                    ? 'bg-[#C5B641] text-[#0F0D02]'
                    : currentRole === 'Supervisor'
                    ? 'bg-[#3E69B1] text-white'
                    : 'bg-[#274578] text-white'
                }`}
              >
                {currentUser.nome
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-white block truncate">
                  {currentUser.nome}
                </span>
                <span className="text-[10px] text-[#C9D7EE] block truncate">
                  {currentRole}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#274578]/50 rounded-lg transition-colors shrink-0"
              title="Alternar Perfil ou Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2 text-center">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="text-[11px] text-[#C9D7EE] hover:text-white font-medium flex items-center justify-center gap-1 mx-auto transition-colors"
            >
              <span>Alternar Sessão</span> &rarr;
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
