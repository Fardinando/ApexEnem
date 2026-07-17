-- Execute este SQL no Supabase Dashboard > SQL Editor
-- Apenas adiciona os UPDATE policies que estavam faltando

-- Profiles (já tem, mas garantir)
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Essay corrections
DROP POLICY IF EXISTS "essay_update" ON public.essay_corrections;
CREATE POLICY "essay_update" ON public.essay_corrections FOR UPDATE USING (auth.uid() = user_id);

-- Simulado history
DROP POLICY IF EXISTS "sim_update" ON public.simulado_history;
CREATE POLICY "sim_update" ON public.simulado_history FOR UPDATE USING (auth.uid() = user_id);

-- Activity logs
DROP POLICY IF EXISTS "logs_update" ON public.activity_logs;
CREATE POLICY "logs_update" ON public.activity_logs FOR UPDATE USING (auth.uid() = user_id);
