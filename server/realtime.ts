import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { pool } from './db.js';

let ioInstance: Server | null = null;

export interface RealtimeActor {
  id?: string;
  nome?: string;
  role?: string;
}

/**
 * Inicializa a instância Singleton do Socket.IO no servidor HTTP
 */
export function initRealtime(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 15000,
  });

  io.on('connection', async (socket: Socket) => {
    try {
      // 1. Extrai credenciais fornecidas no handshake (auth ou query)
      const handshakeAuth = socket.handshake.auth || {};
      const handshakeQuery = socket.handshake.query || {};
      const userId = handshakeAuth.userId || handshakeQuery.userId;

      if (!userId || typeof userId !== 'string') {
        // Conexão anônima não autenticada ainda - mantém socket apenas para canais públicos se houver
        socket.emit('realtime:ready', { status: 'unauthenticated' });
        return;
      }

      // 2. Consulta setores e permissões reais no PostgreSQL para evitar spoofing
      let userRole = 'Visualizador';
      let userName = 'Usuário';
      let userSectors: string[] = [];

      try {
        const userRes = await pool.query(
          `SELECT u.id, u.nome, u.role, COALESCE(array_agg(us.setor_nome) FILTER (WHERE us.setor_nome IS NOT NULL), '{}') as setores
           FROM usuarios u
           LEFT JOIN usuarios_setores us ON us.usuario_id = u.id
           WHERE u.id::text = $1
           GROUP BY u.id`,
          [userId]
        );

        if (userRes.rows.length > 0) {
          const row = userRes.rows[0];
          userRole = row.role;
          userName = row.nome;
          userSectors = row.setores || [];
        } else if (userId === 'a0000000-0000-0000-0000-000000000001') {
          userRole = 'Administrador';
          userName = 'Administrador Geral POLCAL';
        }
      } catch (dbErr) {
        // Fallback para valores enviados no handshake caso o banco esteja indisponível
        userRole = (handshakeAuth.role as string) || 'Visualizador';
        userName = (handshakeAuth.nome as string) || 'Usuário';
        if (Array.isArray(handshakeAuth.setores)) {
          userSectors = handshakeAuth.setores;
        }
      }

      // 3. Ingressa nas salas exclusivas por setor e perfil (Isolamento RBAC)
      const roomsJoined: string[] = [];

      // Sala pessoal para notificações diretas
      const userRoom = `user:${userId}`;
      socket.join(userRoom);
      roomsJoined.push(userRoom);

      // Sala de administradores (enxerga todos os 11 setores)
      if (userRole === 'Administrador') {
        socket.join('admin');
        roomsJoined.push('admin');
      }

      // Salas específicas de cada setor atribuído ao perito/usuário
      userSectors.forEach((setor) => {
        if (setor && typeof setor === 'string') {
          const sectorRoom = `sector:${setor.trim()}`;
          socket.join(sectorRoom);
          roomsJoined.push(sectorRoom);
        }
      });

      console.log(`[RealTime] Conexão estabelecida: ${userName} (${userRole}) -> Salas: [${roomsJoined.join(', ')}]`);

      socket.emit('realtime:ready', {
        status: 'authenticated',
        userId,
        role: userRole,
        rooms: roomsJoined,
        timestamp: new Date().toISOString(),
      });

      socket.on('disconnect', () => {
        console.log(`[RealTime] Desconexão: ${userName} (${userId})`);
      });
    } catch (err) {
      console.error('[RealTime] Erro no handshake do socket:', err);
    }
  });

  ioInstance = io;
  return io;
}

/**
 * Obtém a instância Singleton do Socket.IO
 */
export function getRealtime(): Server | null {
  return ioInstance;
}

/**
 * Emite evento de requisição criada exclusivamente para o setor responsável e para a administração
 */
export function emitRequestCreated(request: any, actor?: RealtimeActor): void {
  if (!ioInstance) return;

  const payload = {
    requisicao: request,
    actor: actor || { nome: request.criadoPor || 'Sistema' },
    timestamp: new Date().toISOString(),
  };

  const sectorRoom = request.setorSolicitante ? `sector:${request.setorSolicitante.trim()}` : null;

  if (sectorRoom) {
    ioInstance.to('admin').to(sectorRoom).emit('request:created', payload);
  } else {
    ioInstance.to('admin').emit('request:created', payload);
  }
}

/**
 * Emite evento de requisição atualizada (status, prazos, preenchimento, dilação ou anexo)
 */
export function emitRequestUpdated(request: any, actor?: RealtimeActor, previousSector?: string): void {
  if (!ioInstance) return;

  const payload = {
    requisicao: request,
    actor: actor || { nome: 'Sistema' },
    timestamp: new Date().toISOString(),
  };

  const targetRooms = new Set<string>(['admin']);

  if (request.setorSolicitante) {
    targetRooms.add(`sector:${request.setorSolicitante.trim()}`);
  }

  // Se houve transferência entre setores, notifica também o setor anterior para retirar da fila
  if (previousSector && previousSector !== request.setorSolicitante) {
    targetRooms.add(`sector:${previousSector.trim()}`);
  }

  targetRooms.forEach((room) => {
    ioInstance?.to(room).emit('request:updated', payload);
  });
}

/**
 * Emite evento de requisição excluída
 */
export function emitRequestDeleted(
  payloadData: { id: string; numeroProcesso: string; setorSolicitante?: string },
  actor?: RealtimeActor
): void {
  if (!ioInstance) return;

  const payload = {
    ...payloadData,
    actor: actor || { nome: 'Administrador' },
    timestamp: new Date().toISOString(),
  };

  const targetRooms = new Set<string>(['admin']);
  if (payloadData.setorSolicitante) {
    targetRooms.add(`sector:${payloadData.setorSolicitante.trim()}`);
  }

  targetRooms.forEach((room) => {
    ioInstance?.to(room).emit('request:deleted', payload);
  });
}
