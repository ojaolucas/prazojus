-- ==============================================================
-- PrazoJus — Migração: Remoção Completa de Matrícula
-- Substituição pela identificação civil/forense oficial: CPF
-- ==============================================================

-- 1. Remover a coluna matricula da tabela usuarios (e qualquer constraint vinculada)
ALTER TABLE usuarios DROP COLUMN IF EXISTS matricula CASCADE;

-- 2. Garantir que CPF seja o identificador único oficial do colaborador
ALTER TABLE usuarios ALTER COLUMN cpf SET NOT NULL;
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_cpf_key'
    ) THEN
        ALTER TABLE usuarios ADD CONSTRAINT usuarios_cpf_key UNIQUE (cpf);
    END IF;
END $$;

-- 3. Atualizar tabela de auditoria: substituir usuario_matricula por usuario_cpf
ALTER TABLE auditoria_logs DROP COLUMN IF EXISTS usuario_matricula CASCADE;
ALTER TABLE auditoria_logs ADD COLUMN IF NOT EXISTS usuario_cpf VARCHAR(14);

-- 4. Criar índice para busca ágil por CPF na auditoria
CREATE INDEX IF NOT EXISTS idx_auditoria_cpf ON auditoria_logs(usuario_cpf);
