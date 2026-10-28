-- Metas de curso + universidade escolhidas no onboarding.
-- Guardadas em JSONB pra flexibilidade (lista pode crescer, cursoId/uniId
-- podem virar FK no futuro). Idempotente.

ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS target_courses jsonb;

-- Formato esperado:
-- [
--   { "cursoId": "medicina",            "uniId": "usp",   "nota": 839 },
--   { "cursoId": "engenharia-computacao","uniId": "unicamp","nota": 728 }
-- ]
