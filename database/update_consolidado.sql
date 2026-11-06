-- ==============================================================================
-- PrazoJus — Script de Atualização Incremental Consolidada do Banco de Dados
-- Sistema de Controle de Prazos Processuais e Requisições Periciais da POLCAL
-- ==============================================================================
-- Este script aplica todas as novidades recentes em um banco PostgreSQL existente:
-- 1. Controle de Primeiro Acesso e Troca Obrigatória de Senha
-- 2. Tabela Oficial de Pedidos e Histórico de Dilações de Prazo
-- 3. Índices de Desempenho e Auditoria
-- ==============================================================================

BEGIN;

-- 1. Adicionar controle de primeiro acesso na tabela de usuários
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS precisa_trocar_senha BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE usuarios ALTER COLUMN precisa_trocar_senha SET DEFAULT TRUE;

COMMENT ON COLUMN usuarios.precisa_trocar_senha IS 'Sinaliza se o usuário deve obrigatoriamente definir uma nova senha no próximo login.';

-- Marca usuários novos que nunca acessaram para exigirem troca de senha no primeiro login
UPDATE usuarios 
SET precisa_trocar_senha = TRUE 
WHERE email <> 'admin@polcal.al.gov.br' AND (ultimo_acesso IS NULL);

-- Garante que administradores principais não fiquem bloqueados
UPDATE usuarios 
SET precisa_trocar_senha = FALSE 
WHERE role = 'Administrador' AND (email = 'admin@polcal.al.gov.br' OR cpf = '000.000.000-00');

-- Remove matricula e departamento da tabela usuarios se ainda existirem
ALTER TABLE usuarios DROP COLUMN IF EXISTS matricula CASCADE;
ALTER TABLE usuarios DROP COLUMN IF EXISTS departamento CASCADE;
ALTER TABLE auditoria_logs DROP COLUMN IF EXISTS usuario_matricula CASCADE;
ALTER TABLE auditoria_logs ADD COLUMN IF NOT EXISTS usuario_cpf VARCHAR(14);

-- 2. Criar a tabela de Pedidos de Dilação de Prazo (se ainda não existir)
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

-- Flexibiliza coluna de dias solicitados para suportar dilações sem prazo fixo
ALTER TABLE pedidos_dilacao ALTER COLUMN dias_solicitados DROP NOT NULL;

-- 3. Índices para garantir alta velocidade nas buscas e relatórios
CREATE INDEX IF NOT EXISTS idx_pedidos_dilacao_req ON pedidos_dilacao(requisicao_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_dilacao_data ON pedidos_dilacao(data_solicitacao DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_data ON auditoria_logs(data DESC);

COMMIT;

