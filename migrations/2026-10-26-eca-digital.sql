-- Lei Felca / ECA Digital (Lei nº 15.211/2025) + LGPD Art. 14
-- Adiciona colunas ao profiles e cria tabela de denúncias.
-- Executar no Supabase SQL Editor. Idempotente (seguro rodar várias vezes).

-- 1) Colunas de idade/responsável/consentimento no profile
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS birthdate date,
  ADD COLUMN IF NOT EXISTS is_minor boolean,
  ADD COLUMN IF NOT EXISTS parent_email text,
  ADD COLUMN IF NOT EXISTS parent_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_version text;

-- Trigger: se birthdate existir, calcula is_minor automaticamente
CREATE OR REPLACE FUNCTION public.set_is_minor()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.birthdate IS NOT NULL THEN
    NEW.is_minor := (age(NEW.birthdate) < interval '18 years');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS profiles_set_is_minor ON public.profiles;
CREATE TRIGGER profiles_set_is_minor
  BEFORE INSERT OR UPDATE OF birthdate ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_is_minor();

-- 2) Tabela de denúncias (canal extrajudicial exigido pela ECA Digital)
CREATE TABLE IF NOT EXISTS public.denuncias (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria   text NOT NULL,
  descricao   text NOT NULL,
  url_conteudo text,
  contato     text,
  ip_hash     text,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status      text NOT NULL DEFAULT 'aberta', -- aberta | em_analise | resolvida | arquivada
  resposta    text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS denuncias_status_idx ON public.denuncias (status, created_at DESC);
CREATE INDEX IF NOT EXISTS denuncias_user_idx   ON public.denuncias (user_id);

ALTER TABLE public.denuncias ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado (ou anônimo via service role no backend) pode criar denúncia.
-- Leitura: apenas o próprio autor ou admin (service_role sempre bypassa RLS).
DROP POLICY IF EXISTS "denuncias_insert_any" ON public.denuncias;
CREATE POLICY "denuncias_insert_any" ON public.denuncias
  FOR INSERT TO authenticated, anon WITH CHECK (true);

DROP POLICY IF EXISTS "denuncias_select_own" ON public.denuncias;
CREATE POLICY "denuncias_select_own" ON public.denuncias
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 3) Sanidade: profiles RLS deve impedir leitura cruzada entre contas
-- (não recria políticas existentes; apenas garante que RLS está ligado)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
