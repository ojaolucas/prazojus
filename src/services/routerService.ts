import { NavTab } from '../components/layout/Sidebar';

export interface ParsedRoute {
  tab: NavTab;
  isLogin: boolean;
  modalAction: 'detail' | 'create' | 'edit' | null;
  requestId: string | null;
}

export const TAB_ROUTES: Record<NavTab, string> = {
  dashboard: '/dashboard',
  calendar: '/calendario',
  requests: '/requisicoes',
  kanban: '/kanban',
  notifications: '/notificacoes',
  users: '/usuarios',
  settings: '/configuracoes',
  audit: '/auditoria',
};

// Mapeamento tolerante de aliases e variantes (com/sem acento, inglês/português)
const ROUTE_ALIASES: Record<string, NavTab> = {
  dashboard: 'dashboard',
  calendario: 'calendar',
  'calendário': 'calendar',
  calendar: 'calendar',
  requisicoes: 'requests',
  'requisições': 'requests',
  requests: 'requests',
  kanban: 'kanban',
  notificacoes: 'notifications',
  'notificações': 'notifications',
  notifications: 'notifications',
  usuarios: 'users',
  'usuários': 'users',
  users: 'users',
  configuracoes: 'settings',
  'configurações': 'settings',
  settings: 'settings',
  backup: 'settings',
  auditoria: 'audit',
  audit: 'audit',
};

export const RouterService = {
  /**
   * Converte o pathname atual do navegador em uma rota estruturada do PrazoJus
   */
  parseUrl(pathname: string): ParsedRoute {
    try {
      const decoded = decodeURIComponent(pathname || '/');
      const segments = decoded
        .split('/')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      if (segments.length === 0) {
        return {
          tab: 'dashboard',
          isLogin: false,
          modalAction: null,
          requestId: null,
        };
      }

      const first = segments[0];

      if (first === 'login') {
        return {
          tab: 'dashboard',
          isLogin: true,
          modalAction: null,
          requestId: null,
        };
      }

      const tab: NavTab = ROUTE_ALIASES[first] || 'dashboard';

      // Sem parâmetros adicionais (ex: /dashboard, /requisicoes)
      if (segments.length === 1) {
        return {
          tab,
          isLogin: false,
          modalAction: null,
          requestId: null,
        };
      }

      const second = segments[1];

      // Abertura de modal de nova requisição (ex: /requisicoes/nova ou /kanban/nova)
      if (second === 'nova' || second === 'novo' || second === 'criar') {
        return {
          tab,
          isLogin: false,
          modalAction: 'create',
          requestId: null,
        };
      }

      // Edição de requisição (ex: /requisicoes/req-123/editar)
      if (segments.length >= 3 && (segments[2] === 'editar' || segments[2] === 'edit')) {
        return {
          tab,
          isLogin: false,
          modalAction: 'edit',
          requestId: second,
        };
      }

      // Detalhes da requisição (ex: /requisicoes/req-123 ou /kanban/req-123)
      return {
        tab,
        isLogin: false,
        modalAction: 'detail',
        requestId: second,
      };
    } catch {
      return {
        tab: 'dashboard',
        isLogin: false,
        modalAction: null,
        requestId: null,
      };
    }
  },

  /**
   * Constrói a URL canônica para o estado do sistema
   */
  buildUrl(
    tab: NavTab,
    modalAction?: 'detail' | 'create' | 'edit' | null,
    requestId?: string | null
  ): string {
    const base = TAB_ROUTES[tab] || '/dashboard';

    if (!modalAction) {
      return base;
    }

    if (modalAction === 'create') {
      return `${base}/nova`;
    }

    if (modalAction === 'edit' && requestId) {
      return `${base}/${encodeURIComponent(requestId)}/editar`;
    }

    if (modalAction === 'detail' && requestId) {
      return `${base}/${encodeURIComponent(requestId)}`;
    }

    return base;
  },

  /**
   * Atualiza a URL no navegador sem recarregar a página
   */
  pushRoute(url: string): void {
    if (typeof window === 'undefined') return;
    if (window.location.pathname !== url) {
      window.history.pushState({ path: url }, '', url);
    }
  },

  /**
   * Substitui a URL no histórico sem recarregar
   */
  replaceRoute(url: string): void {
    if (typeof window === 'undefined') return;
    if (window.location.pathname !== url) {
      window.history.replaceState({ path: url }, '', url);
    }
  },
};

