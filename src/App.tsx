import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RequestProvider, useRequests } from './context/RequestContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { CalendarView } from './components/calendar/CalendarView';
import { RequestList } from './components/requests/RequestList';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { UserManagement } from './components/users/UserManagement';
import { BackupSettings } from './components/settings/BackupSettings';
import { AuditView } from './components/audit/AuditView';
import { RequestFormModal } from './components/requests/RequestFormModal';
import { RequestDetailModal } from './components/requests/RequestDetailModal';
import { DemoLoginModal } from './components/auth/DemoLoginModal';
import { VirtualAssistant } from './components/assistant/VirtualAssistant';
import { JudicialRequest } from './types/request';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const { currentUser } = useAuth();
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingRequest,
    setEditingRequest,
    selectedRequest,
    setSelectedRequest,
    resetFilters,
  } = useRequests();

  // Ao alternar entre módulos via menu (Sidebar/Header), limpa automaticamente todos os filtros ativos
  const handleNavMenuTab = (tab: NavTab) => {
    resetFilters();
    setCurrentTab(tab);
  };

  // Se o usuário alternar de perfil ou sair, limpa os filtros automaticamente
  const prevUserIdRef = React.useRef(currentUser.id);
  useEffect(() => {
    if (prevUserIdRef.current !== currentUser.id) {
      prevUserIdRef.current = currentUser.id;
      resetFilters();
    }
  }, [currentUser.id, resetFilters]);

  const handleOpenCreateWithDate = () => {
    setEditingRequest(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (req: JudicialRequest) => {
    setEditingRequest(req);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      {/* Sidebar de Navegação */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleNavMenuTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <Header
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenCreate={() => {
            setEditingRequest(null);
            setIsCreateModalOpen(true);
          }}
          onNavigate={handleNavMenuTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 sm:pb-32 max-w-7xl w-full mx-auto animate-fade-in">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={setCurrentTab}
              onSelectEvent={setSelectedRequest}
              onOpenCreate={() => {
                setEditingRequest(null);
                setIsCreateModalOpen(true);
              }}
            />
          )}

          {currentTab === 'calendar' && (
            <CalendarView
              onSelectEvent={setSelectedRequest}
              onOpenCreate={() => {
                setEditingRequest(null);
                setIsCreateModalOpen(true);
              }}
              onOpenCreateWithDate={handleOpenCreateWithDate}
            />
          )}

          {currentTab === 'requests' && (
            <RequestList
              onOpenCreate={() => {
                setEditingRequest(null);
                setIsCreateModalOpen(true);
              }}
              onOpenDetail={setSelectedRequest}
              onOpenEdit={handleOpenEdit}
            />
          )}

          {currentTab === 'notifications' && (
            <NotificationCenter onSelectRequest={setSelectedRequest} />
          )}

          {currentTab === 'users' && <UserManagement />}

          {currentTab === 'settings' && <BackupSettings />}

          {currentTab === 'audit' && <AuditView />}
        </main>
      </div>

      {/* Modal de Criação / Edição de Requisições */}
      <RequestFormModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingRequest(null);
        }}
        initialData={editingRequest}
      />

      {/* Modal de Detalhes dos Autos */}
      <RequestDetailModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onEdit={handleOpenEdit}
      />

      {/* Modal de Autenticação Demonstrativa */}
      <DemoLoginModal />

      {/* Assistente Virtual Flutuante com Mascote */}
      <VirtualAssistant onNavigate={setCurrentTab} currentTab={currentTab} />
    </div>
  );
};

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RequestProvider>
          <AppContent />
        </RequestProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
