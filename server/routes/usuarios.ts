import { Router } from 'express';
import { pool } from '../db.js';

export const usuariosRouter = Router();

// Listar todos os usuários com seus setores associados
usuariosRouter.get('/', async (_req, res) => {
  try {
    const usersResult = await pool.query(`
      SELECT 
        u.id, 
        u.nome, 
        u.email, 
        u.cargo, 
        u.departamento, 
        u.matricula, 
        u.cpf, 
        u.role, 
        u.status,
        COALESCE(
          json_agg(us.setor_nome) FILTER (WHERE us.setor_nome IS NOT NULL), 
          '[]'
        ) AS setores
      FROM usuarios u
      LEFT JOIN usuarios_setores us ON us.usuario_id = u.id
      GROUP BY u.id
      ORDER BY u.nome ASC
    `);

    res.json(usersResult.rows);
  } catch (error) {
    console.error('[API /usuarios] Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao consultar usuários no banco de dados.' });
  }
});

// Listar setores oficiais
usuariosRouter.get('/setores', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM setores WHERE ativo = TRUE ORDER BY nome ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('[API /setores] Erro ao listar setores:', error);
    res.status(500).json({ error: 'Erro ao consultar setores.' });
  }
});

// Autenticação institucional via E-mail ou CPF
usuariosRouter.post('/login', async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier || typeof identifier !== 'string') {
      return res.status(400).json({ error: 'Informe seu e-mail institucional ou CPF.' });
    }

    const cleanId = identifier.trim().toLowerCase();
    const cleanCpfDigits = cleanId.replace(/\D/g, '');

    const userResult = await pool.query(
      `
      SELECT 
        u.id, 
        u.nome, 
        u.email, 
        u.cargo, 
        u.departamento, 
        u.matricula, 
        u.cpf, 
        u.role, 
        u.status,
        COALESCE(
          json_agg(us.setor_nome) FILTER (WHERE us.setor_nome IS NOT NULL), 
          '[]'
        ) AS setores
      FROM usuarios u
      LEFT JOIN usuarios_setores us ON us.usuario_id = u.id
      WHERE LOWER(u.email) = $1 
         OR ($2 <> '' AND regexp_replace(u.cpf, '\\D', '', 'g') = $2)
      GROUP BY u.id
      LIMIT 1
      `,
      [cleanId, cleanCpfDigits]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Credenciais institucionais não localizadas. Verifique os dados digitados.',
      });
    }

    const user = userResult.rows[0];

    if (user.status === 'Inativo') {
      return res.status(403).json({
        error: 'Este usuário encontra-se inativo no sistema. Contate a Diretoria-Geral (DGPC).',
      });
    }

    // Registra auditoria de login
    await pool.query(
      `
      INSERT INTO auditoria_logs 
        (usuario_id, usuario_nome, usuario_matricula, usuario_cargo, usuario_role, modulo, acao, descricao, status)
      VALUES 
        ($1, $2, $3, $4, $5, 'autenticacao', 'acesso', $6, 'sucesso')
      `,
      [
        user.id,
        user.nome,
        user.matricula,
        user.cargo,
        user.role,
        `Acesso autenticado ao sistema via login institucional: ${user.nome} (${user.role}) - ${user.cargo}.`,
      ]
    );

    res.json({ success: true, user });
  } catch (error) {
    console.error('[API /login] Erro no login:', error);
    res.status(500).json({ error: 'Erro ao processar autenticação no banco de dados.' });
  }
});
