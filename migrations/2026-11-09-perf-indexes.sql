-- Performance: índices em colunas de filtro mais usadas (kit performance item 17).
-- Idempotente — todos com IF NOT EXISTS.

-- essay_corrections: lista por usuário ordenada por data
CREATE INDEX IF NOT EXISTS essay_corrections_user_date_idx
  ON public.essay_corrections (user_id, created_at DESC);

-- simulado_history: lista por usuário ordenada por data
CREATE INDEX IF NOT EXISTS simulado_history_user_date_idx
  ON public.simulado_history (user_id, created_at DESC);

-- activity_logs: dashboard do aluno puxa por user_id + data
CREATE INDEX IF NOT EXISTS activity_logs_user_date_idx
  ON public.activity_logs (user_id, created_at DESC);

-- question_responses: estatísticas por user
CREATE INDEX IF NOT EXISTS question_responses_user_idx
  ON public.question_responses (user_id);

-- wallets: lookup por user_id é o único caminho de leitura
CREATE INDEX IF NOT EXISTS wallets_user_idx
  ON public.wallets (user_id);

-- profiles: lookup por parent_email (fluxo controle parental)
CREATE INDEX IF NOT EXISTS profiles_parent_email_idx
  ON public.profiles (parent_email) WHERE parent_email IS NOT NULL;
