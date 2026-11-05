-- ==============================================================================
-- PrazoJus — Migração de Segurança e Limpeza de Dados Fictícios
-- Sistema de Controle de Prazos Processuais e Requisições Periciais da POLCAL
-- ==============================================================================

-- 1. Garante colunas de segurança na tabela de usuários
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultimo_acesso TIMESTAMP WITH TIME ZONE;

-- 2. Limpeza dos registros fictícios de demonstração
DELETE FROM anexos;
DELETE FROM historico_atribuicoes;
DELETE FROM auditoria_logs;
DELETE FROM requisicoes;
DELETE FROM usuarios_setores;
DELETE FROM usuarios;

-- 3. Garante que os Setores Oficiais da POLCAL estejam cadastrados
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

-- 4. Criação do Primeiro Administrador Real (Senha inicial padrão: admin@2026)
-- Hash bcrypt gerado com salt rounds 12
INSERT INTO usuarios (
    id, 
    nome, 
    email, 
    cargo, 
    departamento, 
    matricula, 
    cpf, 
    role, 
    status, 
    senha_hash
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Administrador Geral POLCAL',
    'admin@polcal.al.gov.br',
    'Diretor-Geral Forense',
    'DGPC - Direção-Geral de Perícia Científica',
    'POLCAL-0001',
    '000.000.000-00',
    'Administrador',
    'Ativo',
    '$2b$12$15RN7vX5j9L9PzpGSNq5TucU6w4NVHupxwHM6gYoDwhmSXEb0Pi.y'
) ON CONFLICT (email) DO UPDATE SET
    senha_hash = EXCLUDED.senha_hash,
    status = 'Ativo',
    role = 'Administrador';

-- 5. Vincula o Administrador Geral a todos os setores para gestão unificada
INSERT INTO usuarios_setores (usuario_id, setor_nome)
SELECT 'a0000000-0000-0000-0000-000000000001', nome FROM setores
ON CONFLICT (usuario_id, setor_nome) DO NOTHING;

-- 6. Log inicial de auditoria
INSERT INTO auditoria_logs (
    usuario_id,
    usuario_nome,
    usuario_matricula,
    usuario_cargo,
    usuario_role,
    modulo,
    acao,
    descricao,
    status
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Administrador Geral POLCAL',
    'POLCAL-0001',
    'Diretor-Geral Forense',
    'Administrador',
    'sistema',
    'migracao',
    'Sistema migrado para ambiente de produção real com autenticação criptográfica segura.',
    'sucesso'
);

