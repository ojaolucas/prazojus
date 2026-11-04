import { Router } from 'express';
import { pool } from '../db.js';

export const auditoriaRouter = Router();

// Listar logs de auditoria
auditoriaRouter.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 100;
    const result = await pool.query(
      `
      SELECT 
        id,
        usuario_id AS "usuarioId",
        usuario_nome AS "usuarioNome",
        usuario_matricula AS "usuarioMatricula",
        usuario_cargo AS "usuarioCargo",
        usuario_role AS "usuarioRole",
        modulo,
        acao,
        descricao,
        entidade_id AS "entidadeId",
        entidade_referencia AS "entidadeReferencia",
        status,
        motivo_falha AS "motivoFalha",
        detalhes,
        data
      FROM auditoria_logs
      ORDER BY data DESC
      LIMIT $1
      `,
      [limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('[API /auditoria] Erro ao listar logs:', error);
    res.status(500).json({ error: 'Erro ao carregar logs de auditoria.' });
  }
});

// Registrar log de auditoria
auditoriaRouter.post('/', async (req, res) => {
  try {
    const log = req.body;
    const result = await pool.query(
      `
      INSERT INTO auditoria_logs (
        usuario_id, usuario_nome, usuario_matricula, usuario_cargo,
        usuario_role, modulo, acao, descricao, entidade_id,
        entidade_referencia, status, motivo_falha, detalhes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
      `,
      [
        log.usuarioId || null,
        log.usuarioNome || 'Sistema',
        log.usuarioMatricula || null,
        log.usuarioCargo || null,
        log.usuarioRole || 'Operador',
        log.modulo,
        log.acao,
        log.descricao,
        log.entidadeId || null,
        log.entidadeReferencia || null,
        log.status || 'sucesso',
        log.motivoFalha || null,
        log.detalhes ? JSON.stringify(log.detalhes) : null,
      ]
    );

    res.status(201).json({ success: true, log: result.rows[0] });
  } catch (error) {
    console.error('[API /auditoria] Erro ao gravar log:', error);
    res.status(500).json({ error: 'Erro ao registrar log de auditoria.' });
  }
});

