import http from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { testConnection } from './db.js';
import { usuariosRouter } from './routes/usuarios.js';
import { requisicoesRouter } from './routes/requisicoes.js';
import { auditoriaRouter } from './routes/auditoria.js';
import { initRealtime } from './realtime.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const io = initRealtime(httpServer);
const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 80 : 3001);

// Middlewares
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', async (_req, res) => {
  const dbOk = await testConnection();
  res.json({
    status: 'ok',
    sistema: 'PrazoJus — Polícia Científica de Alagoas',
    database: dbOk ? 'conectado' : 'desconectado',
    timestamp: new Date().toISOString(),
  });
});

// Rotas da API
app.use('/api/usuarios', usuariosRouter);
app.use('/api/requisicoes', requisicoesRouter);
app.use('/api/auditoria', auditoriaRouter);

// Servir arquivos estáticos do Frontend em produção (Vite SPA)
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback SPA: Qualquer rota não-API serve o index.html
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Inicialização do Servidor HTTP + WebSocket
httpServer.listen(PORT, async () => {
  console.log(`[PrazoJus] Servidor HTTP e RealTime (Socket.IO) rodando na porta ${PORT}`);
  const ok = await testConnection();
  if (ok) {
    try {
      const { ensureAdminUser } = await import('./seedAdmin.js');
      await ensureAdminUser();
    } catch (e) {
      console.warn('[Seed Admin] Aviso ao verificar/inicializar Administrador:', (e as Error).message);
    }
  }
});

