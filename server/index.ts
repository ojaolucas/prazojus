import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { testConnection } from './db.js';
import { usuariosRouter } from './routes/usuarios.js';
import { requisicoesRouter } from './routes/requisicoes.js';
import { auditoriaRouter } from './routes/auditoria.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;

// Middlewares
app.use(cors());
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
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Inicialização do Servidor
app.listen(PORT, async () => {
  console.log(`[PrazoJus] Servidor rodando na porta ${PORT}`);
  await testConnection();
});
