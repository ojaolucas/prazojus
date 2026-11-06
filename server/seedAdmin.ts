import bcrypt from 'bcryptjs';
import { pool } from './db.js';
import dotenv from 'dotenv';

dotenv.config();

export async function ensureAdminUser(): Promise<void> {
  const client = await pool.connect();
  try {
    // 1. Garante que as colunas e tabelas necessárias existam
    await client.query(`
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(255);
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultimo_acesso TIMESTAMP WITH TIME ZONE;
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS precisa_trocar_senha BOOLEAN NOT NULL DEFAULT FALSE;

      CREATE TABLE IF NOT EXISTS pedidos_dilacao (
          id VARCHAR(100) PRIMARY KEY,
          requisicao_id VARCHAR(100) NOT NULL REFERENCES requisicoes(id) ON DELETE CASCADE,
          dias_solicitados INTEGER CHECK (dias_solicitados IS NULL OR dias_solicitados > 0),
          anexo_id VARCHAR(100) REFERENCES anexos(id) ON DELETE SET NULL,
          documento_nome VARCHAR(255) NOT NULL,
          documento_url TEXT,
          documento_base64 TEXT,
          criado_por_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
          criado_por_nome VARCHAR(150) NOT NULL,
          data_solicitacao DATE NOT NULL DEFAULT CURRENT_DATE,
          criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      ALTER TABLE pedidos_dilacao ALTER COLUMN dias_solicitados DROP NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_pedidos_dilacao_req ON pedidos_dilacao(requisicao_id);
    `);

    // 2. Verifica se já existe ao menos um Administrador cadastrado
    const checkAdmin = await client.query(`
      SELECT id, nome, email FROM usuarios WHERE role = 'Administrador' LIMIT 1
    `);

    if (checkAdmin.rows.length > 0) {
      console.log(`[Seed Admin] Administrador já existente: ${checkAdmin.rows[0].nome} (${checkAdmin.rows[0].email})`);
      return;
    }

    // 3. Obtém credenciais do Administrador via variáveis de ambiente ou padrões seguros
    const email = (process.env.ADMIN_EMAIL || 'admin@polcal.al.gov.br').trim().toLowerCase();
    const nome = (process.env.ADMIN_NOME || 'Administrador Geral POLCAL').trim();
    const cpf = (process.env.ADMIN_CPF || '000.000.000-00').trim();
    const cargo = (process.env.ADMIN_CARGO || 'Diretor-Geral Forense').trim();
    const rawPassword = process.env.ADMIN_PASSWORD || 'admin@2026';

    console.log(`[Seed Admin] Criando Administrador Geral com e-mail: ${email}`);

    // Gera hash com salt 12
    const senhaHash = await bcrypt.hash(rawPassword, 12);
    const adminId = 'a0000000-0000-0000-0000-000000000001';

    await client.query('BEGIN');

    await client.query(
      `
      INSERT INTO usuarios (id, nome, email, cargo, cpf, role, status, senha_hash)
      VALUES ($1, $2, $3, $4, $5, 'Administrador', 'Ativo', $6)
      ON CONFLICT (email) DO UPDATE SET
        senha_hash = EXCLUDED.senha_hash,
        role = 'Administrador',
        status = 'Ativo'
      `,
      [adminId, nome, email, cargo, cpf, senhaHash]
    );

    // Vincula o Administrador a todos os setores cadastrados
    await client.query(`
      INSERT INTO usuarios_setores (usuario_id, setor_nome)
      SELECT $1, nome FROM setores
      ON CONFLICT (usuario_id, setor_nome) DO NOTHING;
    `, [adminId]);

    // Registra log de auditoria
    await client.query(`
      INSERT INTO auditoria_logs 
        (usuario_id, usuario_nome, usuario_cpf, usuario_cargo, usuario_role, modulo, acao, descricao, status)
      VALUES 
        ($1, $2, $3, $4, 'Administrador', 'usuarios', 'criacao', 'Conta mestre de Administrador Geral inicializada.', 'sucesso')
    `, [adminId, nome, cpf, cargo]);

    await client.query('COMMIT');
    console.log(`[Seed Admin] Administrador Geral (${email}) criado e vinculado a todos os setores da POLCAL.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Seed Admin] Erro ao inicializar Administrador:', error);
  } finally {
    client.release();
  }
}

// Se executado diretamente via CLI
if (process.argv[1]?.endsWith('seedAdmin.ts') || process.argv[1]?.endsWith('seedAdmin.js')) {
  ensureAdminUser().then(() => {
    console.log('[Seed Admin] Concluído.');
    process.exit(0);
  }).catch((err) => {
    console.error('[Seed Admin] Falha fatal:', err);
    process.exit(1);
  });
}

