-- ==============================================================================
-- PrazoJus — Esquema de Banco de Dados Oficial (PostgreSQL)
-- Sistema de Controle de Prazos Processuais e Requisições Periciais da POLCAL
-- ==============================================================================

-- 1. Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela de Setores Periciais da Polícia Científica
CREATE TABLE IF NOT EXISTS setores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL UNIQUE,
    sigla VARCHAR(30),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Usuários / Servidores Forenses
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    cargo VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    role VARCHAR(30) NOT NULL CHECK (role IN ('Administrador', 'Operacional', 'Visualizador')),
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
    senha_hash VARCHAR(255),
    precisa_trocar_senha BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_acesso TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Associação N:N entre Usuários e Setores Autorizados
CREATE TABLE IF NOT EXISTS usuarios_setores (
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    setor_nome VARCHAR(150) NOT NULL,
    PRIMARY KEY (usuario_id, setor_nome)
);

-- 5. Tabela de Requisições e Autos Periciais
CREATE TABLE IF NOT EXISTS requisicoes (
    id VARCHAR(100) PRIMARY KEY,
    numero_processo VARCHAR(50) NOT NULL,
    protocolo VARCHAR(50),
    rep VARCHAR(50),
    descricao TEXT NOT NULL,
    setor_solicitante VARCHAR(150) NOT NULL,
    tipo_exame VARCHAR(150) NOT NULL,
    vestigio TEXT,
    acusado_vitima TEXT,
    origem VARCHAR(200),
    referencias VARCHAR(200),
    
    -- Status e Fluxo Operacional
    status VARCHAR(30) NOT NULL DEFAULT 'Não iniciado' CHECK (status IN ('Não iniciado', 'Iniciado', 'Concluído', 'Cancelado')),
    status_operacional VARCHAR(30) NOT NULL DEFAULT 'Aguardando recebimento' CHECK (status_operacional IN ('Aguardando recebimento', 'Em andamento', 'Concluído')),
    cadastro_completo BOOLEAN NOT NULL DEFAULT FALSE,
    prazo_indefinido BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Atribuição Pericial
    responsavel_operacional_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    responsavel_operacional_nome VARCHAR(150),
    data_recebimento_operacional TIMESTAMP WITH TIME ZONE,
    data_iniciado_operacional TIMESTAMP WITH TIME ZONE,
    data_conclusao_operacional TIMESTAMP WITH TIME ZONE,

    -- Prazos Processuais
    tem_prazo_judicial BOOLEAN DEFAULT TRUE,
    tipo_prazo VARCHAR(20) CHECK (tipo_prazo IN ('judicial', 'interno')),
    data_recebimento DATE,
    dias_prazo INTEGER DEFAULT 10,
    prazo_judicial TIMESTAMP WITH TIME ZONE,
    motivo_prazo_interno TEXT,
    prioridade_manual VARCHAR(20) CHECK (prioridade_manual IN ('Baixa', 'Média', 'Alta', 'Urgente')),

    -- Auditoria de Registro
    criado_por VARCHAR(150) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de Anexos (Documentos em PDF: Ofícios, Laudos e Comprovantes)
CREATE TABLE IF NOT EXISTS anexos (
    id VARCHAR(100) PRIMARY KEY,
    requisicao_id VARCHAR(100) NOT NULL REFERENCES requisicoes(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('oficio', 'decisao', 'email', 'laudo', 'comprovacao', 'comprovante_envio', 'outro')),
    tamanho BIGINT NOT NULL,
    url_storage TEXT,
    conteudo_base64 TEXT,
    is_comprovacao BOOLEAN DEFAULT FALSE,
    data_upload TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Histórico de Atribuições e Transferências entre Peritos
CREATE TABLE IF NOT EXISTS historico_atribuicoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requisicao_id VARCHAR(100) NOT NULL REFERENCES requisicoes(id) ON DELETE CASCADE,
    usuario_anterior_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    usuario_anterior_nome VARCHAR(150),
    usuario_novo_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    usuario_novo_nome VARCHAR(150) NOT NULL,
    setor VARCHAR(150) NOT NULL,
    motivo TEXT,
    data TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabela de Pedidos de Dilação de Prazo (Informativo e Comprobatório)
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

-- 9. Tabela de Auditoria e Rastreabilidade Total
CREATE TABLE IF NOT EXISTS auditoria_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    usuario_nome VARCHAR(150) NOT NULL,
    usuario_cpf VARCHAR(14),
    usuario_cargo VARCHAR(150),
    usuario_role VARCHAR(30) NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    acao VARCHAR(50) NOT NULL,
    descricao TEXT NOT NULL,
    entidade_id VARCHAR(100),
    entidade_referencia VARCHAR(100),
    status VARCHAR(20) NOT NULL CHECK (status IN ('sucesso', 'falha')),
    motivo_falha TEXT,
    detalhes JSONB,
    data TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Índices para Otimização de Consultas Forenses
CREATE INDEX IF NOT EXISTS idx_requisicoes_processo ON requisicoes(numero_processo);
CREATE INDEX IF NOT EXISTS idx_requisicoes_setor ON requisicoes(setor_solicitante);
CREATE INDEX IF NOT EXISTS idx_requisicoes_status ON requisicoes(status);
CREATE INDEX IF NOT EXISTS idx_requisicoes_status_op ON requisicoes(status_operacional);
CREATE INDEX IF NOT EXISTS idx_requisicoes_responsavel ON requisicoes(responsavel_operacional_id);
CREATE INDEX IF NOT EXISTS idx_requisicoes_prazo ON requisicoes(prazo_judicial);
CREATE INDEX IF NOT EXISTS idx_anexos_requisicao ON anexos(requisicao_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_data ON auditoria_logs(data DESC);

-- ==============================================================================
-- CARGA INICIAL (SEEDS)
-- ==============================================================================

-- Setores Oficiais
INSERT INTO setores (nome, sigla) VALUES
('Seção de Balística Forense', 'SBF'),
('Seção de Perícias em Veículos e Acidentes de Trânsito', 'SPVAT'),
('Seção de Perícias em Locais de Crime Contra a Vida', 'SPLCCV'),
('Seção de Perícias em Crimes Contra o Patrimônio', 'SPCCP'),
('Seção de Química Forense', 'SQF'),
('Seção de Toxicologia Forense', 'STF'),
('Seção de Genética Forense / DNA', 'SGF'),
('Seção de Computação Forense e Exames em Dispositivos Eletrônicos', 'SCFEDE'),
('Seção de Documentoscopia e Grafotécnica', 'SDG'),
('Seção de Engenharia Legal e Meio Ambiente', 'SELMA'),
('Seção de Audiovisual e Identificação Biométrica Facial', 'SAIBF'),
('Seção de Identificação Papiloscópica Forense', 'SIPF'),
('Seção de Antropologia Forense e Odontologia Legal', 'SAFOL'),
('Seção de Tanatologia e Exames Necroscópicos', 'STEN'),
('Seção de Sexologia Forense e Exames de Lesão Corporal', 'SSFELC')
ON CONFLICT (nome) DO NOTHING;

-- Administrador Geral Inicial (Senha padrão: admin@2026 - Hash bcrypt com salt 12)
INSERT INTO usuarios (
    id, 
    nome, 
    email, 
    cargo, 
    cpf, 
    role, 
    status, 
    senha_hash,
    precisa_trocar_senha
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Administrador Geral POLCAL',
    'admin@polcal.al.gov.br',
    'Diretor-Geral Forense',
    '000.000.000-00',
    'Administrador',
    'Ativo',
    '$2b$12$15RN7vX5j9L9PzpGSNq5TucU6w4NVHupxwHM6gYoDwhmSXEb0Pi.y',
    FALSE
) ON CONFLICT (email) DO NOTHING;

-- Vincula o Administrador Geral a todos os setores para triagem e gestão unificada
INSERT INTO usuarios_setores (usuario_id, setor_nome)
SELECT 'a0000000-0000-0000-0000-000000000001', nome FROM setores
ON CONFLICT (usuario_id, setor_nome) DO NOTHING;

