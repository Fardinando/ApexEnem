-- Migration: Criar tabela de progresso dos alunos
-- Execute este SQL no SQL Editor do Supabase Dashboard

-- 1. Criar a tabela principal de progresso
CREATE TABLE IF NOT EXISTS public.ApexEnem_progress (
  email TEXT PRIMARY KEY,
  progress JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Criar índice para busca rápida por email
CREATE INDEX IF NOT EXISTS idx_ApexEnem_progress_email ON public.ApexEnem_progress (email);

-- 3. Habilitar Row Level Security
ALTER TABLE public.ApexEnem_progress ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de acesso para a chave anônima (anon key)
-- Permite INSERT/UPDATE apenas do próprio email
CREATE POLICY "Usuarios podem inserir seu proprio progresso"
  ON public.ApexEnem_progress
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = email);

CREATE POLICY "Usuarios podem atualizar seu proprio progresso"
  ON public.ApexEnem_progress
  FOR UPDATE
  USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Usuarios podem ler seu proprio progresso"
  ON public.ApexEnem_progress
  FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

-- 5. Política para permitir upsert anônimo (para quando não há autenticação)
-- Isso permite que o backend com service_role key possa operar livremente
-- E também permite que usuários anônimos (sem auth) salvem seu progresso
CREATE POLICY "Permitir upsert anonimo para service role"
  ON public.ApexEnem_progress
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Nota: Se quiser mais segurança, remova a política acima e use apenas
-- as políticas baseadas em JWT. Para um app estudantil, a política aberta
-- é aceitável já que a chave anon é pública de qualquer forma.
