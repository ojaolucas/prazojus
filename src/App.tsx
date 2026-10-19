import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { RequestProvider, useRequests } from './context/RequestContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { CalendarView } from './components/calendar/CalendarView';
import { RequestList } from './components/requests/RequestList';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { UserManagement } from './components/users/UserManagement';
import { BackupSettings } from './components/settings/BackupSettings';
import { RequestFormModal } from './components/requests/RequestFormModal';
import { RequestDetailModal } from './components/requests/RequestDetailModal';
import { DemoLoginModal } from './components/auth/DemoLoginModal';
import { JudicialRequest } from './types/request';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingRequest,
    setEditingRequest,
    selectedRequest,
    setSelectedRequest,
  } = useRequests();

  const handleOpenCreateWithDate = (date: Date) => {
    // Abre formulário com data sugerida
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatted = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T18:00`;

    setEditingRequest({
      id: '',
      numeroProcesso: '',
      descricao: '',
      setorSolicitante: 'Balística Forense',
      prazoJudicial: formatted,
      tipoExame: 'Confronto Balístico',
      status: 'Pendente',
      criadoEm: '',
      atualizadoEm: '',
      criadoPor: '',
    });
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
        onSelectTab={setCurrentTab}
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
          onNavigate={setCurrentTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
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
