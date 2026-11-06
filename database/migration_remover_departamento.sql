-- ==============================================================
-- PrazoJus — Migração: Remoção de Departamento / Órgão
-- ==============================================================

-- Remover a coluna departamento da tabela usuarios
ALTER TABLE usuarios DROP COLUMN IF EXISTS departamento CASCADE;
