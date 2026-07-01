-- Migration: Criar tabelas de perfis e dados dos alunos
-- Execute este SQL no SQL Editor do Supabase Dashboard

-- 1. Tabela de perfis (estende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT,
  state TEXT,
  city TEXT,
  avatar TEXT,
  serie TEXT,
  target_score INTEGER,
  hard_subjects TEXT[],
  streak INTEGER DEFAULT 1,
  last_login_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de correções de redação
CREATE TABLE IF NOT EXISTS public.essay_corrections (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  score INTEGER NOT NULL,
  general_feedback TEXT,
  competencies JSONB DEFAULT '[]',
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de histórico de simulados
CREATE TABLE IF NOT EXISTS public.simulado_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score_percent INTEGER NOT NULL,
  subject TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de logs de atividade
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  time_ago TEXT,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_essay_user ON public.essay_corrections(user_id);
CREATE INDEX IF NOT EXISTS idx_simulado_user ON public.simulado_history(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(id);

-- Segurança: Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.essay_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulado_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Políticas: cada usuário só vê/altera os próprios dados
DROP POLICY IF EXISTS "Usuarios podem ler seu perfil" ON public.profiles;
CREATE POLICY "Usuarios podem ler seu perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuarios podem inserir seu perfil" ON public.profiles;
CREATE POLICY "Usuarios podem inserir seu perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Usuarios podem atualizar seu perfil" ON public.profiles;
CREATE POLICY "Usuarios podem atualizar seu perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuarios podem ler suas correcoes" ON public.essay_corrections;
CREATE POLICY "Usuarios podem ler suas correcoes"
  ON public.essay_corrections FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios podem inserir correcoes" ON public.essay_corrections;
CREATE POLICY "Usuarios podem inserir correcoes"
  ON public.essay_corrections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios podem ler seus simulados" ON public.simulado_history;
CREATE POLICY "Usuarios podem ler seus simulados"
  ON public.simulado_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios podem inserir simulados" ON public.simulado_history;
CREATE POLICY "Usuarios podem inserir simulados"
  ON public.simulado_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios podem ler seus logs" ON public.activity_logs;
CREATE POLICY "Usuarios podem ler seus logs"
  ON public.activity_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios podem inserir logs" ON public.activity_logs;
CREATE POLICY "Usuarios podem inserir logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger: criar perfil automaticamente ao cadastrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, region, state, city)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'Estudante'),
    NEW.raw_user_meta_data ->> 'region',
    NEW.raw_user_meta_data ->> 'state',
    NEW.raw_user_meta_data ->> 'city'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
