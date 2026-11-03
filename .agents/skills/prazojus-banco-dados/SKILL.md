---
name: prazojus-banco-dados
description: >-
  Use esta skill quando precisar criar, migrar, estruturar ou manter o banco de dados do PrazoJus (PostgreSQL / Supabase ou backend dedicado Node.js), incluindo schemas de tabelas, triggers de auditoria e políticas de segurança por linha (RLS).
---

# Guia de Arquitetura e Migração do Banco de Dados — PrazoJus

Este guia orienta o processo de implantação do banco de dados relacional (PostgreSQL) para o PrazoJus, substituindo o armazenamento temporário de LocalStorage.

---

## 1. Esquema Relacional das Tabelas (DDL PostgreSQL)

```sql
-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Setores da Polícia Científica
CREATE TABLE IF NOT EXISTS setores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL UNIQUE,
    sigla VARCHAR(30),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Usuários / Servidores Forenses
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE, -- Vínculo com supabase.auth.users se aplicável
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    cargo VARCHAR(150) NOT NULL,
    departamento VARCHAR(200) NOT NULL,
    matricula VARCHAR(50) NOT NULL UNIQUE,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    role VARCHAR(30) NOT NULL CHECK (role IN ('Administrador', 'Operacional', 'Visualizador')),
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Associação Usuário <-> Setores (N:N)
CREATE TABLE IF NOT EXISTS usuarios_setores (
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    setor_nome VARCHAR(150) NOT NULL,
    PRIMARY KEY (usuario_id, setor_nome)
);

-- 5. Tabela de Requisições e Autos Periciais
CREATE TABLE IF NOT EXISTS requisicoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    
    -- Status e Fluxo
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

    -- Prazos e Prioridade
    tem_prazo_judicial BOOLEAN DEFAULT TRUE,
    tipo_prazo VARCHAR(20) CHECK (tipo_prazo IN ('judicial', 'interno')),
    data_recebimento DATE,
    dias_prazo INTEGER DEFAULT 10,
    prazo_judicial TIMESTAMP WITH TIME ZONE,
    motivo_prazo_interno TEXT,
    prioridade_manual VARCHAR(20) CHECK (prioridade_manual IN ('Baixa', 'Média', 'Alta', 'Urgente')),

    -- Auditoria de Criação
    criado_por VARCHAR(150) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de Anexos (Ofícios e Documentos Comprobatórios)
CREATE TABLE IF NOT EXISTS anexos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requisicao_id UUID NOT NULL REFERENCES requisicoes(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('oficio', 'decisao', 'email', 'laudo', 'comprovacao', 'comprovante_envio', 'outro')),
    tamanho BIGINT NOT NULL,
    url_storage TEXT NOT NULL,
    is_comprovacao BOOLEAN DEFAULT FALSE,
    data_upload TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Histórico de Atribuições / Transferências
CREATE TABLE IF NOT EXISTS historico_atribuicoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requisicao_id UUID NOT NULL REFERENCES requisicoes(id) ON DELETE CASCADE,
    usuario_anterior_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    usuario_anterior_nome VARCHAR(150),
    usuario_novo_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    usuario_novo_nome VARCHAR(150) NOT NULL,
    setor VARCHAR(150) NOT NULL,
    motivo TEXT,
    data TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabela de Auditoria Completa
CREATE TABLE IF NOT EXISTS auditoria_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    usuario_nome VARCHAR(150) NOT NULL,
    usuario_matricula VARCHAR(50),
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
```

---

## 2. Políticas de Segurança por Linha (Row Level Security - RLS)

Para o Supabase / PostgreSQL, ative o RLS para isolar setores:

```sql
ALTER TABLE requisicoes ENABLE ROW LEVEL SECURITY;

-- Administrador: visualiza e edita tudo
CREATE POLICY admin_all ON requisicoes
    FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM usuarios WHERE auth_user_id = auth.uid() AND role = 'Administrador')
    );

-- Operacional: visualiza e atua apenas nos seus setores
CREATE POLICY operacional_setor ON requisicoes
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios u
            JOIN usuarios_setores us ON us.usuario_id = u.id
            WHERE u.auth_user_id = auth.uid()
              AND us.setor_nome = requisicoes.setor_solicitante
        )
    );

-- Visualizador: somente leitura nas demandas dos seus setores
CREATE POLICY visualizador_readonly ON requisicoes
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios u
            JOIN usuarios_setores us ON us.usuario_id = u.id
            WHERE u.auth_user_id = auth.uid()
              AND (u.role = 'Visualizador')
              AND us.setor_nome = requisicoes.setor_solicitante
        )
    );
```

---

## 3. Procedimento de Substituição do `StorageService`

1. Instalar o cliente do banco:
   `npm install @supabase/supabase-js`
2. Criar `src/services/supabaseClient.ts` com as variáveis de ambiente `.env` (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`).
3. Adaptar `src/services/storageService.ts` ou criar `src/services/databaseService.ts` com métodos assíncronos (`getRequests()`, `saveRequest()`, `uploadAttachment()`).
4. Conectar o `RequestContext.tsx` ao serviço assíncrono mantendo o estado reativo no React.
