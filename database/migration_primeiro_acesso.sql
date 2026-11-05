-- ==============================================================================
-- PrazoJus — Migração: Controle de Alteração Obrigatória de Senha (1º Acesso)
-- Sistema de Controle de Prazos Processuais e Requisições Periciais da POLCAL
-- ==============================================================================

-- Adiciona a coluna precisa_trocar_senha se ainda não existir
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS precisa_trocar_senha BOOLEAN NOT NULL DEFAULT FALSE;

-- Garante que o administrador mestre não fique bloqueado
UPDATE usuarios 
SET precisa_trocar_senha = FALSE 
WHERE role = 'Administrador' AND (email = 'admin@polcal.al.gov.br' OR matricula = 'POLCAL-0001');

COMMENT ON COLUMN usuarios.precisa_trocar_senha IS 'Sinaliza se o usuário deve obrigatoriamente definir uma nova senha no próximo login.';
