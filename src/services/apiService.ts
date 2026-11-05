import { JudicialRequest, PedidoDilacao } from '../types/request';
import { User } from '../types/user';
import { AuditLogEntry } from '../types/audit';

const API_BASE = '/api';

/**
 * Cliente HTTP para comunicação com a API Backend e banco de dados PostgreSQL
 */
export const ApiService = {
  // 1. Health Check
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return false;
      const data = await res.json();
      return data.database === 'conectado';
    } catch {
      return false;
    }
  },

  // 2. Requisições Periciais
  async getRequests(): Promise<JudicialRequest[] | null> {
    try {
      const res = await fetch(`${API_BASE}/requisicoes`, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async createRequest(data: Partial<JudicialRequest>): Promise<JudicialRequest | null> {
    try {
      const res = await fetch(`${API_BASE}/requisicoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      const result = await res.json();
      return result.requisicao;
    } catch {
      return null;
    }
  },

  async updateRequest(id: string, data: Partial<JudicialRequest>): Promise<JudicialRequest | null> {
    try {
      const res = await fetch(`${API_BASE}/requisicoes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      const result = await res.json();
      return result.requisicao;
    } catch {
      return null;
    }
  },

  async receiveRequest(id: string, usuarioId: string, usuarioNome: string): Promise<JudicialRequest | null> {
    try {
      const res = await fetch(`${API_BASE}/requisicoes/${id}/receber`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId, usuarioNome }),
      });
      if (!res.ok) return null;
      const result = await res.json();
      return result.requisicao;
    } catch {
      return null;
    }
  },

  async deleteRequest(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/requisicoes/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  },

  async registerExtension(
    id: string,
    data: {
      diasSolicitados?: number | null;
      documento: { nome: string; tamanho: number; conteudoBase64?: string; url?: string };
      criadoPorId?: string;
      criadoPorNome: string;
      dataSolicitacao?: string;
    }
  ): Promise<{ success: boolean; pedido?: PedidoDilacao; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/requisicoes/${id}/dilacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Erro ao registrar pedido de dilação.' };
      }
      return { success: true, pedido: resData.pedido };
    } catch {
      return { success: false, error: 'Falha de comunicação com o servidor.' };
    }
  },

  async updateExtension(
    id: string,
    dilacaoId: string,
    data: {
      diasSolicitados?: number | null;
      documento?: { nome: string; tamanho: number; conteudoBase64?: string; url?: string };
    }
  ): Promise<{ success: boolean; pedido?: PedidoDilacao; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/requisicoes/${id}/dilacao/${dilacaoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Erro ao atualizar pedido de dilação.' };
      }
      return { success: true, pedido: resData.pedido };
    } catch {
      return { success: false, error: 'Falha de comunicação com o servidor.' };
    }
  },

  async deleteExtension(
    id: string,
    dilacaoId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/requisicoes/${id}/dilacao/${dilacaoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const resData = await res.json();
      if (!res.ok) {
        return { success: false, error: resData.error || 'Erro ao excluir pedido de dilação.' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Falha de comunicação com o servidor.' };
    }
  },

  // 3. Usuários e Autenticação
  async getUsers(): Promise<User[] | null> {
    try {
      const res = await fetch(`${API_BASE}/usuarios`, { 
        credentials: 'include',
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const res = await fetch(`${API_BASE}/usuarios/me`, {
        credentials: 'include',
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user || null;
    } catch {
      return null;
    }
  },

  async login(identifier: string, password?: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Credenciais inválidas.' };
      }
      return { success: true, user: data.user };
    } catch {
      return { success: false, error: 'Falha de comunicação com o servidor.' };
    }
  },

  async logout(userId?: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/usuarios/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async createUser(userData: any): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Erro ao cadastrar usuário.' };
      }
      return { success: true, user: data.user };
    } catch {
      return { success: false, error: 'Erro de comunicação ao cadastrar usuário.' };
    }
  },

  async updateUser(id: string, userData: any): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Erro ao atualizar usuário.' };
      }
      return { success: true, user: data.user };
    } catch {
      return { success: false, error: 'Erro de comunicação ao atualizar usuário.' };
    }
  },

  async updateUserStatus(id: string, status: 'Ativo' | 'Inativo'): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/usuarios/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async resetUserPassword(id: string, novaSenha: string): Promise<{ success: boolean; user?: User; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/usuarios/${id}/reset-senha`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ novaSenha }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Erro ao redefinir senha.' };
      }
      return { success: true, user: data.user, message: data.message };
    } catch {
      return { success: false, error: 'Erro de comunicação ao redefinir senha.' };
    }
  },

  async changePassword(
    novaSenha: string,
    confirmarNovaSenha: string,
    userId?: string
  ): Promise<{ success: boolean; user?: User; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/usuarios/trocar-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ novaSenha, confirmarNovaSenha, userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Erro ao cadastrar nova senha.' };
      }
      return { success: true, user: data.user, message: data.message };
    } catch {
      return { success: false, error: 'Erro de comunicação ao cadastrar nova senha.' };
    }
  },

  // 4. Auditoria Forense
  async getAuditLogs(): Promise<AuditLogEntry[] | null> {
    try {
      const res = await fetch(`${API_BASE}/auditoria`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async logAudit(log: Partial<AuditLogEntry>): Promise<void> {
    try {
      await fetch(`${API_BASE}/auditoria`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
    } catch {
      // Ignora falha de log para não travar UX
    }
  },
};

