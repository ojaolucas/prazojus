-- ==============================================================================
-- PrazoJus — Migração: Tabela de Pedidos de Dilação de Prazo
-- Sistema de Controle de Prazos Processuais e Requisições Periciais da POLCAL
-- ==============================================================================

CREATE TABLE IF NOT EXISTS pedidos_dilacao (
    id VARCHAR(100) PRIMARY KEY,
    requisicao_id VARCHAR(100) NOT NULL REFERENCES requisicoes(id) ON DELETE CASCADE,
    dias_solicitados INTEGER NOT NULL CHECK (dias_solicitados > 0),
    anexo_id VARCHAR(100) REFERENCES anexos(id) ON DELETE SET NULL,
    documento_nome VARCHAR(255) NOT NULL,
    documento_url TEXT,
    documento_base64 TEXT,
    criado_por_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    criado_por_nome VARCHAR(150) NOT NULL,
    data_solicitacao DATE NOT NULL DEFAULT CURRENT_DATE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_dilacao_req ON pedidos_dilacao(requisicao_id);

