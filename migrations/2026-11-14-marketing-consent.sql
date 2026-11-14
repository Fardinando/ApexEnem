-- Consentimento de marketing separado (LGPD Art. 8º §4º). Idempotente.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_consent_at timestamptz;

CREATE INDEX IF NOT EXISTS profiles_marketing_consent_idx
  ON public.profiles (marketing_consent_at)
  WHERE marketing_consent_at IS NOT NULL;
