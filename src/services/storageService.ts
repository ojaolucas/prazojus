import { JudicialRequest } from '../types/request';
import { User } from '../types/user';
import { AppNotification } from '../types/notification';
import { MOCK_REQUESTS } from '../data/mockRequests';
import { MOCK_USERS } from '../data/mockUsers';
import { syncAllRequestsStatus } from './deadlineService';

const SCHEMA_VERSION = '1.0';
const STORAGE_KEYS = {
  REQUESTS: 'prazojus_requests_v1',
  USERS: 'prazojus_users_v1',
  CURRENT_USER_ID: 'prazojus_current_user_v1',
  NOTIFICATIONS: 'prazojus_notifs_v1',
  PREFERENCES: 'prazojus_prefs_v1',
  VERSION: 'prazojus_schema_version',
};

export interface UserPreferences {
  theme: 'light';
  viewMode: 'month' | 'week' | 'day';
  notifSound: boolean;
  compactMode: boolean;
}

export interface BackupPayload {
  version: string;
  exportedAt: string;
  source: string;
  requests: JudicialRequest[];
  users?: User[];
  notifications?: AppNotification[];
  preferences?: UserPreferences;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  viewMode: 'month',
  notifSound: false,
  compactMode: false,
};

/**
 * Serviço centralizado de persistência em LocalStorage
 */
export const StorageService = {
  /**
   * Inicializa o armazenamento com dados de demonstração SE for a primeira execução.
   * Nunca sobrescreve dados existentes do usuário.
   */
  initialize(): void {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.VERSION)) {
        localStorage.setItem(STORAGE_KEYS.VERSION, SCHEMA_VERSION);
      }

      if (!localStorage.getItem(STORAGE_KEYS.REQUESTS)) {
        const syncedSeed = syncAllRequestsStatus(MOCK_REQUESTS);
        localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(syncedSeed));
      }

      if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS));
      }

      if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, MOCK_USERS[0].id);
      }

      if (!localStorage.getItem(STORAGE_KEYS.PREFERENCES)) {
        localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(DEFAULT_PREFERENCES));
      }

      if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
      }
    } catch (err) {
      console.error('Falha ao inicializar o armazenamento local:', err);
    }
  },

  /**
   * Obtém todas as requisições armazenadas e garante status de vencimento sincronizado
   */
  getRequests(): JudicialRequest[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      if (!data) return [];
      const parsed: JudicialRequest[] = JSON.parse(data);
      // Sempre recalcula vencidos dinamicamente ao carregar
      const synced = syncAllRequestsStatus(parsed);
      return synced;
    } catch (err) {
      console.error('Erro ao ler requisições do localStorage:', err);
      return [];
    }
  },

  /**
   * Salva todas as requisições no localStorage
   */
  saveRequests(requests: JudicialRequest[]): boolean {
    try {
      const synced = syncAllRequestsStatus(requests);
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(synced));
      return true;
    } catch (err) {
      console.error('Erro ao salvar requisições:', err);
      return false;
    }
  },

  /**
   * Obtém todos os usuários fictícios
   */
  getUsers(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (!data) return MOCK_USERS;
      return JSON.parse(data);
    } catch (err) {
      console.error('Erro ao ler usuários:', err);
      return MOCK_USERS;
    }
  },

  /**
   * Salva usuários
   */
  saveUsers(users: User[]): boolean {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      return true;
    } catch (err) {
      console.error('Erro ao salvar usuários:', err);
      return false;
    }
  },

  /**
   * ID do usuário logado demonstrativo
   */
  getCurrentUserId(): string {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || MOCK_USERS[0].id;
  },

  setCurrentUserId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
  },

  /**
   * Notificações
   */
  getNotifications(): AppNotification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (!data) return [];
      return JSON.parse(data);
    } catch (err) {
      console.error('Erro ao ler notificações:', err);
      return [];
    }
  },

  saveNotifications(notifs: AppNotification[]): boolean {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
      return true;
    } catch (err) {
      console.error('Erro ao salvar notificações:', err);
      return false;
    }
  },

  /**
   * Preferências
   */
  getPreferences(): UserPreferences {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (!data) return DEFAULT_PREFERENCES;
      return JSON.parse(data);
    } catch {
      return DEFAULT_PREFERENCES;
    }
  },

  savePreferences(prefs: UserPreferences): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
    } catch (err) {
      console.error('Erro ao salvar preferências:', err);
    }
  },

  /**
   * Restaura os dados padrão de demonstração
   */
  resetToDemo(): boolean {
    try {
      const syncedSeed = syncAllRequestsStatus(MOCK_REQUESTS);
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(syncedSeed));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(DEFAULT_PREFERENCES));
      localStorage.setItem(STORAGE_KEYS.VERSION, SCHEMA_VERSION);
      return true;
    } catch (err) {
      console.error('Erro ao resetar para dados de demonstração:', err);
      return false;
    }
  },

  /**
   * Exporta backup completo em JSON e inicia o download
   */
  exportBackup(): void {
    const backup: BackupPayload = {
      version: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      source: 'PrazoJus - Sistema de Prazos Judiciais',
      requests: this.getRequests(),
      users: this.getUsers(),
      notifications: this.getNotifications(),
      preferences: this.getPreferences(),
    };

    const jsonBlob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(jsonBlob);
    const link = document.createElement('a');
    const nowStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.href = url;
    link.download = `prazojus_backup_${nowStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Valida a estrutura de um arquivo de backup antes de importar
   */
  validateBackupFile(fileContent: string): { valid: boolean; error?: string; data?: BackupPayload } {
    try {
      const parsed = JSON.parse(fileContent);

      if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: 'O arquivo informado não contém um objeto JSON válido.' };
      }

      if (!Array.isArray(parsed.requests)) {
        return { valid: false, error: 'O backup não contém a lista obrigatória de requisições ("requests").' };
      }

      // Validação básica dos campos de requisição
      for (const req of parsed.requests) {
        if (!req.numeroProcesso || !req.descricao || !req.setorSolicitante || !req.prazoJudicial) {
          return {
            valid: false,
            error: `Registro de requisição inválido no arquivo: processo "${req.numeroProcesso || 'desconhecido'}" com campos obrigatórios ausentes.`,
          };
        }
      }

      return { valid: true, data: parsed as BackupPayload };
    } catch (e: any) {
      return { valid: false, error: `Erro na análise do arquivo JSON: ${e.message}` };
    }
  },

  /**
   * Importa backup aplicando substituição total ('replace') ou mesclagem ('merge')
   */
  importBackup(payload: BackupPayload, mode: 'replace' | 'merge' = 'replace'): { success: boolean; message: string } {
    try {
      let finalRequests: JudicialRequest[] = [];

      if (mode === 'replace') {
        finalRequests = payload.requests;
      } else {
        // Modo mesclagem (merge): mantém existentes e atualiza/adiciona os do backup
        const current = this.getRequests();
        const map = new Map<string, JudicialRequest>();
        current.forEach((r) => map.set(r.id, r));
        payload.requests.forEach((r) => map.set(r.id, r));
        finalRequests = Array.from(map.values());
      }

      this.saveRequests(finalRequests);

      if (payload.users && Array.isArray(payload.users) && mode === 'replace') {
        this.saveUsers(payload.users);
      }

      if (payload.preferences && mode === 'replace') {
        this.savePreferences(payload.preferences);
      }

      return {
        success: true,
        message: `Backup restaurado com sucesso! ${finalRequests.length} requisições processadas no modo "${mode === 'replace' ? 'Substituição total' : 'Mesclagem'}".`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Erro ao importar dados: ${err.message}`,
      };
    }
  },
};
