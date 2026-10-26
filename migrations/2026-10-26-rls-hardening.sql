-- RLS Hardening + proteção de tasks de IA. Idempotente.
-- Rodar APÓS supabase-setup.sql e as outras migrations.

-- 1) beta_requests: NUNCA deve ser legível por outros usuários.
--    A policy antiga era FOR SELECT USING (true) — vazava email de todos os
--    pedidos para qualquer autenticado. Removemos e restringimos a service_role.
DROP POLICY IF EXISTS "read_beta"   ON public.beta_requests;
DROP POLICY IF EXISTS "insert_beta" ON public.beta_requests;

-- INSERT público (até via anon) continua, mas SELECT só pelo service_role (que
-- bypassa RLS). O backend lê via supabaseAdmin se precisar.
CREATE POLICY "beta_requests_insert" ON public.beta_requests
  FOR INSERT TO authenticated, anon WITH CHECK (true);

-- Nenhuma policy de SELECT = ninguém lê via anon/authenticated. service_role
-- (backend) ignora RLS. Isso é intencional.
--
-- Se depois quiser que o próprio solicitante veja seu pedido, descomente:
-- CREATE POLICY "beta_requests_read_own" ON public.beta_requests
--   FOR SELECT TO authenticated USING (email = auth.jwt() ->> 'email');


-- 2) DELETE policies ausentes: usuário deve poder apagar os próprios dados
--    (direito ao esquecimento LGPD). O backend /api/delete-account já faz
--    isso via service_role, mas policies DELETE também protegem contra bugs.
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "essay_delete_own" ON public.essay_corrections;
CREATE POLICY "essay_delete_own" ON public.essay_corrections
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "sim_delete_own" ON public.simulado_history;
CREATE POLICY "sim_delete_own" ON public.simulado_history
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "logs_delete_own" ON public.activity_logs;
CREATE POLICY "logs_delete_own" ON public.activity_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "qr_delete_own" ON public.question_responses;
CREATE POLICY "qr_delete_own" ON public.question_responses
  FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- 3) ApexEnem_progress: policy "all_access" é vaga. Precisa checar ownership.
--    Tabela usa email como chave; conferimos contra auth.jwt() email.
--    NOTE: idealmente migraria pra user_id, mas por retro-compat deixamos email.
DROP POLICY IF EXISTS "all_access"      ON public."ApexEnem_progress";
DROP POLICY IF EXISTS "progress_select" ON public."ApexEnem_progress";
DROP POLICY IF EXISTS "progress_insert" ON public."ApexEnem_progress";
DROP POLICY IF EXISTS "progress_update" ON public."ApexEnem_progress";

CREATE POLICY "progress_select" ON public."ApexEnem_progress"
  FOR SELECT TO authenticated
  USING (email = (auth.jwt() ->> 'email'));

CREATE POLICY "progress_insert" ON public."ApexEnem_progress"
  FOR INSERT TO authenticated
  WITH CHECK (email = (auth.jwt() ->> 'email'));

CREATE POLICY "progress_update" ON public."ApexEnem_progress"
  FOR UPDATE TO authenticated
  USING (email = (auth.jwt() ->> 'email'));


-- 4) ai_tasks: associa cura (UUID retornado pelo backend) ao user_id dono.
--    Permite que endpoints de status verifiquem ownership antes de devolver
--    o resultado da IA, bloqueando bisbilhotagem via UUID adivinhado.
CREATE TABLE IF NOT EXISTS public.ai_tasks (
  cura        text PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  job_type    text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS ai_tasks_user_idx    ON public.ai_tasks (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_tasks_cleanup_idx ON public.ai_tasks (created_at);

ALTER TABLE public.ai_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_tasks_read_own" ON public.ai_tasks;
CREATE POLICY "ai_tasks_read_own" ON public.ai_tasks
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);
-- (user_id IS NULL permite tasks anônimas públicas tipo repertoires)


-- 5) Garantir RLS ligado em TODAS as tabelas sensíveis (defesa em profundidade)
ALTER TABLE IF EXISTS public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.essay_corrections  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.simulado_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.beta_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."ApexEnem_progress" ENABLE ROW LEVEL SECURITY;
