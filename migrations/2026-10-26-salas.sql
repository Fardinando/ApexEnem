-- Salas de competição com amigos (MVP). Idempotente.

CREATE TABLE IF NOT EXISTS public.salas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  code        text UNIQUE NOT NULL,
  owner_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_members int  NOT NULL DEFAULT 20,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS salas_owner_idx ON public.salas (owner_id);

CREATE TABLE IF NOT EXISTS public.sala_membros (
  sala_id    uuid NOT NULL REFERENCES public.salas(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at  timestamptz NOT NULL DEFAULT now(),
  xp_sala    int  NOT NULL DEFAULT 0,
  PRIMARY KEY (sala_id, user_id)
);

CREATE INDEX IF NOT EXISTS sala_membros_user_idx ON public.sala_membros (user_id);
CREATE INDEX IF NOT EXISTS sala_membros_rank_idx ON public.sala_membros (sala_id, xp_sala DESC);

ALTER TABLE public.salas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sala_membros  ENABLE ROW LEVEL SECURITY;

-- salas: dono gerencia; membros leem suas salas
DROP POLICY IF EXISTS "salas_select_member" ON public.salas;
CREATE POLICY "salas_select_member" ON public.salas
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.sala_membros m WHERE m.sala_id = salas.id AND m.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "salas_insert_owner" ON public.salas;
CREATE POLICY "salas_insert_owner" ON public.salas
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "salas_update_owner" ON public.salas;
CREATE POLICY "salas_update_owner" ON public.salas
  FOR UPDATE TO authenticated USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "salas_delete_owner" ON public.salas;
CREATE POLICY "salas_delete_owner" ON public.salas
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- sala_membros: cada membro vê os colegas da mesma sala
DROP POLICY IF EXISTS "membros_select_same_sala" ON public.sala_membros;
CREATE POLICY "membros_select_same_sala" ON public.sala_membros
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.sala_membros m2 WHERE m2.sala_id = sala_membros.sala_id AND m2.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.salas s WHERE s.id = sala_membros.sala_id AND s.owner_id = auth.uid())
  );

-- Entrada controlada pelo backend (service_role). Usuário só pode remover a si
-- mesmo e atualizar o próprio XP.
DROP POLICY IF EXISTS "membros_delete_self" ON public.sala_membros;
CREATE POLICY "membros_delete_self" ON public.sala_membros
  FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "membros_update_self" ON public.sala_membros;
CREATE POLICY "membros_update_self" ON public.sala_membros
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
