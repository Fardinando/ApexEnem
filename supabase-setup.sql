-- =============================================
-- ApexEnem - Supabase Schema
-- Execute este SQL no SQL Editor do Supabase
-- =============================================

-- 1. TABELA: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Estudante',
  region TEXT,
  state TEXT,
  city TEXT,
  avatar TEXT,
  serie TEXT,
  target_score INTEGER,
  hard_subjects TEXT[],
  streak INTEGER DEFAULT 1,
  longest_streak INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  last_login_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read" ON public.profiles;
DROP POLICY IF EXISTS "insert" ON public.profiles;
DROP POLICY IF EXISTS "update" ON public.profiles;

CREATE POLICY "read" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. TABELA: essay_corrections
CREATE TABLE IF NOT EXISTS public.essay_corrections (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_essay_user ON public.essay_corrections(user_id);

ALTER TABLE public.essay_corrections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read" ON public.essay_corrections;
DROP POLICY IF EXISTS "insert" ON public.essay_corrections;
DROP POLICY IF EXISTS "update" ON public.essay_corrections;

CREATE POLICY "read" ON public.essay_corrections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert" ON public.essay_corrections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update" ON public.essay_corrections FOR UPDATE USING (auth.uid() = user_id);

-- 3. TABELA: simulado_history
CREATE TABLE IF NOT EXISTS public.simulado_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "scorePercent" INTEGER NOT NULL,
  subject TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_simulado_user ON public.simulado_history(user_id);

ALTER TABLE public.simulado_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read" ON public.simulado_history;
DROP POLICY IF EXISTS "insert" ON public.simulado_history;
DROP POLICY IF EXISTS "update" ON public.simulado_history;

CREATE POLICY "read" ON public.simulado_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert" ON public.simulado_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update" ON public.simulado_history FOR UPDATE USING (auth.uid() = user_id);

-- 4. TABELA: activity_logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  "timeAgo" TEXT,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_user ON public.activity_logs(user_id);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read" ON public.activity_logs;
DROP POLICY IF EXISTS "insert" ON public.activity_logs;
DROP POLICY IF EXISTS "update" ON public.activity_logs;

CREATE POLICY "read" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update" ON public.activity_logs FOR UPDATE USING (auth.uid() = user_id);

-- 5. TABELA: ApexEnem_progress
CREATE TABLE IF NOT EXISTS public."ApexEnem_progress" (
  email TEXT PRIMARY KEY,
  progress JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public."ApexEnem_progress" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "all_access" ON public."ApexEnem_progress";

CREATE POLICY "all_access" ON public."ApexEnem_progress"
  USING (auth.jwt() ->> 'email' = email)
  WITH CHECK (auth.jwt() ->> 'email' = email);

-- 6. TRIGGER: Auto-criar profile ao registrar
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
