import { io, Socket } from 'socket.io-client';
import { JudicialRequest } from '../types/request';
import { User } from '../types/user';

export interface RealtimePayload<T = JudicialRequest> {
  requisicao: T;
  actor?: {
    id?: string;
    nome?: string;
    role?: string;
  };
  timestamp: string;
}

export interface DeletePayload {
  id: string;
  numeroProcesso: string;
  actor?: {
    id?: string;
    nome?: string;
  };
  timestamp: string;
}

type RealtimeEventHandler<T> = (data: T) => void;

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private currentUser: User | null = null;
  private onReconnectCallbacks: Array<() => void> = [];

  /**
   * Inicializa ou atualiza a conexão WebSocket única da aplicação
   */
  public connect(user: User): Socket {
    this.currentUser = user;

    // Se já estiver conectado com o mesmo usuário, reaproveita a conexão
    if (this.socket && this.socket.connected) {
      this.socket.emit('auth:update', {
        userId: user.id,
        role: user.role,
        nome: user.nome,
        setores: user.setores || [],
      });
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    // Cria a conexão WebSocket única apontando para a mesma origem (proxy transparente)
    this.socket = io({
      path: '/socket.io',
      auth: {
        userId: user.id,
        role: user.role,
        nome: user.nome,
        setores: user.setores || [],
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log(`[SocketService] Conectado ao servidor RealTime (ID: ${this.socket?.id})`);
    });

    this.socket.on('realtime:ready', (info) => {
      console.log('[SocketService] Canais de tempo real prontos:', info);
    });

    // 5. Sincronização inteligente ao reconectar: notifica ouvintes para buscar eventuais deltas
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`[SocketService] Reconectado após ${attemptNumber} tentativa(s). Sincronizando dados...`);
      this.onReconnectCallbacks.forEach((cb) => {
        try {
          cb();
        } catch (e) {
          console.error('[SocketService] Erro no callback de reconexão:', e);
        }
      });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.warn(`[SocketService] Desconectado do servidor RealTime. Motivo: ${reason}`);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[SocketService] Falha temporária na conexão WebSocket:', err.message);
    });

    return this.socket;
  }

  /**
   * Registra callback para ressincronização automática quando a conexão for restabelecida
   */
  public onReconnect(callback: () => void): () => void {
    this.onReconnectCallbacks.push(callback);
    return () => {
      this.onReconnectCallbacks = this.onReconnectCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Assina evento de nova requisição cadastrada
   */
  public onRequestCreated(handler: RealtimeEventHandler<RealtimePayload>): () => void {
    if (!this.socket) return () => {};
    this.socket.on('request:created', handler);
    return () => {
      this.socket?.off('request:created', handler);
    };
  }

  /**
   * Assina evento de requisição atualizada (status, prazos, preenchimento, dilação ou anexos)
   */
  public onRequestUpdated(handler: RealtimeEventHandler<RealtimePayload>): () => void {
    if (!this.socket) return () => {};
    this.socket.on('request:updated', handler);
    return () => {
      this.socket?.off('request:updated', handler);
    };
  }

  /**
   * Assina evento de requisição excluída
   */
  public onRequestDeleted(handler: RealtimeEventHandler<DeletePayload>): () => void {
    if (!this.socket) return () => {};
    this.socket.on('request:deleted', handler);
    return () => {
      this.socket?.off('request:deleted', handler);
    };
  }

  /**
   * Desconecta o socket (usado no logout)
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  public getStatus(): { connected: boolean; socketId: string | undefined } {
    return {
      connected: Boolean(this.socket?.connected),
      socketId: this.socket?.id,
    };
  }
}

export const socketService = new SocketService();
