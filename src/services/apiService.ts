import { JudicialRequest } from '../types/request';
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

  // 3. Usuários e Autenticação
  async getUsers(): Promise<User[] | null> {
    try {
      const res = await fetch(`${API_BASE}/usuarios`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async login(identifier: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
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
