import React, { useState, useEffect, useRef } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RequestProvider, useRequests } from './context/RequestContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { CalendarView } from './components/calendar/CalendarView';
import { RequestList } from './components/requests/RequestList';
import { KanbanView } from './components/kanban/KanbanView';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { UserManagement } from './components/users/UserManagement';
import { BackupSettings } from './components/settings/BackupSettings';
import { AuditView } from './components/audit/AuditView';
import { RequestFormModal } from './components/requests/RequestFormModal';
import { RequestDetailModal } from './components/requests/RequestDetailModal';
import { LoginPage } from './components/auth/LoginPage';
import { ForcePasswordChangeModal } from './components/auth/ForcePasswordChangeModal';
import { VirtualAssistant } from './components/assistant/VirtualAssistant';
import { JudicialRequest } from './types/request';
import { RouterService } from './services/routerService';

const AppContent: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const {
    requests,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingRequest,
    setEditingRequest,
    selectedRequest,
    setSelectedRequest,
    resetFilters,
  } = useRequests();

  // Inicializa a aba com base na URL do navegador
  const [currentTab, setCurrentTab] = useState<NavTab>(() => {
    if (typeof window !== 'undefined') {
      const parsed = RouterService.parseUrl(window.location.pathname);
      return parsed.tab;
    }
    return 'dashboard';
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Navegação de abas (Menu Lateral / Topo / Cards) com atualização da URL
  const handleNavMenuTab = (tab: NavTab) => {
    resetFilters();
    setCurrentTab(tab);
    setSelectedRequest(null);
    setIsCreateModalOpen(false);
    setEditingRequest(null);
    RouterService.pushRoute(RouterService.buildUrl(tab));
  };

  // Abertura do Modal de Detalhes com reflexo na URL (ex: /requisicoes/req-123)
  const handleOpenDetail = (req: JudicialRequest) => {
    setSelectedRequest(req);
    setIsCreateModalOpen(false);
    setEditingRequest(null);
    RouterService.pushRoute(RouterService.buildUrl(currentTab, 'detail', req.id));
  };

  // Fechamento do Modal de Detalhes restaurando a URL da página base
  const handleCloseDetail = () => {
    setSelectedRequest(null);
    RouterService.pushRoute(RouterService.buildUrl(currentTab));
  };

  // Abertura do Modal de Criação com reflexo na URL (ex: /requisicoes/nova)
  const handleOpenCreate = () => {
    setEditingRequest(null);
    setSelectedRequest(null);
    setIsCreateModalOpen(true);
    RouterService.pushRoute(RouterService.buildUrl(currentTab, 'create'));
  };

  // Abertura de Criação a partir do calendário
  const handleOpenCreateWithDate = () => {
    setEditingRequest(null);
    setSelectedRequest(null);
    setIsCreateModalOpen(true);
    RouterService.pushRoute(RouterService.buildUrl(currentTab, 'create'));
  };

  // Abertura do Modal de Edição com reflexo na URL (ex: /requisicoes/req-123/editar)
  const handleOpenEdit = (req: JudicialRequest) => {
    setEditingRequest(req);
    setSelectedRequest(null);
    setIsCreateModalOpen(true);
    RouterService.pushRoute(RouterService.buildUrl(currentTab, 'edit', req.id));
  };

  // Fechamento do Modal de Criação / Edição restaurando a URL da página base
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setEditingRequest(null);
    RouterService.pushRoute(RouterService.buildUrl(currentTab));
  };

  // Sincronização da URL inicial (deep linking ao acessar diretamente ou recarregar)
  const initialHandledRef = useRef(false);
  useEffect(() => {
    if (initialHandledRef.current) return;
    if (typeof window === 'undefined') return;

    const path = window.location.pathname;

    // Rota raiz: redireciona para dashboard ou login
    if (path === '/' || path === '') {
      if (isAuthenticated) {
        RouterService.replaceRoute('/dashboard');
        setCurrentTab('dashboard');
      } else {
        RouterService.replaceRoute('/login');
      }
      initialHandledRef.current = true;
      return;
    }

    if (!isAuthenticated) {
      if (path !== '/login') {
        RouterService.replaceRoute('/login');
      }
      initialHandledRef.current = true;
      return;
    }

    const parsed = RouterService.parseUrl(path);

    // Se estiver logado e acessou /login, direciona para o dashboard
    if (parsed.isLogin) {
      RouterService.replaceRoute('/dashboard');
      setCurrentTab('dashboard');
      initialHandledRef.current = true;
      return;
    }

    setCurrentTab(parsed.tab);

    // Deep link para criação ou detalhes de requisição
    if (parsed.modalAction === 'create') {
      setEditingRequest(null);
      setIsCreateModalOpen(true);
      initialHandledRef.current = true;
    } else if ((parsed.modalAction === 'detail' || parsed.modalAction === 'edit') && parsed.requestId) {
      const match = requests.find(
        (r) =>
          r.id === parsed.requestId ||
          r.numeroProcesso.toLowerCase() === parsed.requestId?.toLowerCase()
      );
      if (match) {
        if (parsed.modalAction === 'edit') {
          setEditingRequest(match);
          setIsCreateModalOpen(true);
        } else {
          setSelectedRequest(match);
        }
        initialHandledRef.current = true;
      }
    } else {
      initialHandledRef.current = true;
    }
  }, [isAuthenticated, requests, setEditingRequest, setIsCreateModalOpen, setSelectedRequest]);

  // Suporte a navegação pelo histórico do navegador (botões Voltar e Avançar)
  useEffect(() => {
    const handlePopState = () => {
      const parsed = RouterService.parseUrl(window.location.pathname);
      setCurrentTab(parsed.tab);

      if (parsed.modalAction === 'detail' && parsed.requestId) {
        const match = requests.find(
          (r) =>
            r.id === parsed.requestId ||
            r.numeroProcesso.toLowerCase() === parsed.requestId?.toLowerCase()
        );
        if (match) {
          setSelectedRequest(match);
          setIsCreateModalOpen(false);
          setEditingRequest(null);
        }
      } else if (parsed.modalAction === 'edit' && parsed.requestId) {
        const match = requests.find(
          (r) =>
            r.id === parsed.requestId ||
            r.numeroProcesso.toLowerCase() === parsed.requestId?.toLowerCase()
        );
        setSelectedRequest(null);
        setEditingRequest(match || null);
        setIsCreateModalOpen(true);
      } else if (parsed.modalAction === 'create') {
        setSelectedRequest(null);
        setEditingRequest(null);
        setIsCreateModalOpen(true);
      } else {
        // Sem modal na URL: fecha todos os modais abertos
        setSelectedRequest(null);
        setIsCreateModalOpen(false);
        setEditingRequest(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [requests, setSelectedRequest, setIsCreateModalOpen, setEditingRequest]);

  // Se o usuário alternar de perfil ou sair, limpa os filtros automaticamente
  const prevUserIdRef = useRef(currentUser.id);
  useEffect(() => {
    if (prevUserIdRef.current !== currentUser.id) {
      prevUserIdRef.current = currentUser.id;
      resetFilters();
    }
  }, [currentUser.id, resetFilters]);

  // Visualizadores não possuem acesso ao módulo Kanban
  useEffect(() => {
    if (currentTab === 'kanban' && currentUser.role === 'Visualizador') {
      setCurrentTab('dashboard');
      RouterService.replaceRoute('/dashboard');
    }
  }, [currentTab, currentUser.role]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const isForcingPasswordChange = Boolean(currentUser?.precisaTrocarSenha);

  return (
    <>
      <div
        className={`min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800 ${
          isForcingPasswordChange ? 'filter blur-md select-none pointer-events-none' : ''
        }`}
        aria-hidden={isForcingPasswordChange}
      >
        {/* Sidebar de Navegação */}
        <Sidebar
          currentTab={isForcingPasswordChange ? 'dashboard' : currentTab}
          onSelectTab={handleNavMenuTab}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Área Principal de Conteúdo */}
        <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
          <Header
            currentTab={isForcingPasswordChange ? 'dashboard' : currentTab}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onOpenCreate={handleOpenCreate}
            onNavigate={handleNavMenuTab}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 sm:pb-32 max-w-7xl w-full mx-auto animate-fade-in">
            {(isForcingPasswordChange || currentTab === 'dashboard') && (
              <DashboardView
                onNavigate={handleNavMenuTab}
                onSelectEvent={handleOpenDetail}
                onOpenCreate={handleOpenCreate}
              />
            )}

            {!isForcingPasswordChange && currentTab === 'calendar' && (
              <CalendarView
                onSelectEvent={handleOpenDetail}
                onOpenCreate={handleOpenCreate}
                onOpenCreateWithDate={handleOpenCreateWithDate}
              />
            )}

            {!isForcingPasswordChange && currentTab === 'requests' && (
              <RequestList
                onOpenCreate={handleOpenCreate}
                onOpenDetail={handleOpenDetail}
                onOpenEdit={handleOpenEdit}
              />
            )}

            {!isForcingPasswordChange && currentTab === 'kanban' && currentUser.role !== 'Visualizador' && (
              <KanbanView
                onOpenCreate={handleOpenCreate}
                onOpenDetail={handleOpenDetail}
                onOpenEdit={handleOpenEdit}
              />
            )}

            {!isForcingPasswordChange && currentTab === 'notifications' && (
              <NotificationCenter onSelectRequest={handleOpenDetail} />
            )}

            {!isForcingPasswordChange && currentTab === 'users' && <UserManagement />}

            {!isForcingPasswordChange && currentTab === 'settings' && <BackupSettings />}

            {!isForcingPasswordChange && currentTab === 'audit' && <AuditView />}
          </main>
        </div>

        {/* Modal de Criação / Edição de Requisições */}
        {!isForcingPasswordChange && (
          <RequestFormModal
            isOpen={isCreateModalOpen}
            onClose={handleCloseCreateModal}
            initialData={editingRequest}
          />
        )}

        {/* Modal de Detalhes dos Autos */}
        {!isForcingPasswordChange && (
          <RequestDetailModal
            request={selectedRequest}
            onClose={handleCloseDetail}
            onEdit={handleOpenEdit}
          />
        )}

        {/* Assistente Virtual Flutuante com Mascote */}
        {!isForcingPasswordChange && (
          <VirtualAssistant onNavigate={handleNavMenuTab} currentTab={currentTab} />
        )}
      </div>

      {/* Modal Bloqueante de Definição Obrigatória de Senha sobreposto com Desfoque */}
      {isForcingPasswordChange && <ForcePasswordChangeModal />}
    </>
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
