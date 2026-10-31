-- Salas: competição semanal com 4 categorias.
-- Idempotente. Rodar após 2026-10-26-salas.sql.

ALTER TABLE IF EXISTS public.sala_membros
  ADD COLUMN IF NOT EXISTS week_start date,       -- segunda-feira da semana atual
  ADD COLUMN IF NOT EXISTS essay_max int   NOT NULL DEFAULT 0, -- maior nota de redação na semana
  ADD COLUMN IF NOT EXISTS xp_week   int   NOT NULL DEFAULT 0, -- XP ganho na semana
  ADD COLUMN IF NOT EXISTS lessons_week int NOT NULL DEFAULT 0, -- aulas lidas/assistidas na semana
  ADD COLUMN IF NOT EXISTS video_minutes_week int NOT NULL DEFAULT 0; -- minutos de vídeo assistido na semana

-- Função auxiliar: começo da semana (segunda-feira) em UTC.
CREATE OR REPLACE FUNCTION public.sala_week_start(ts timestamptz DEFAULT now())
RETURNS date LANGUAGE sql IMMUTABLE AS $$
  SELECT (date_trunc('week', ts at time zone 'UTC'))::date;
$$;

-- Trigger: ao inserir ou atualizar membro, se week_start é null ou de semana anterior,
-- zera as métricas semanais e seta pra semana atual.
CREATE OR REPLACE FUNCTION public.reset_sala_week_if_needed()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  cur date := public.sala_week_start(now());
BEGIN
  IF NEW.week_start IS NULL OR NEW.week_start < cur THEN
    NEW.week_start := cur;
    NEW.essay_max := 0;
    NEW.xp_week := 0;
    NEW.lessons_week := 0;
    NEW.video_minutes_week := 0;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS sala_membros_week_reset ON public.sala_membros;
CREATE TRIGGER sala_membros_week_reset
  BEFORE INSERT OR UPDATE ON public.sala_membros
  FOR EACH ROW EXECUTE FUNCTION public.reset_sala_week_if_needed();

-- Backfill: membros existentes recebem week_start desta semana
UPDATE public.sala_membros
SET week_start = public.sala_week_start(now())
WHERE week_start IS NULL;
