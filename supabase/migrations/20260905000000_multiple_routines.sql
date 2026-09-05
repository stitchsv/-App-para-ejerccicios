-- =====================================================================
-- Rutinas múltiples: tabla `routines` + routine_days.routine_id
--
-- Antes: routine_days tenía unique(user_id, day_of_week) — un usuario
-- solo podía tener UNA rutina activa a la vez, sin nombre ni forma de
-- guardar varias (ver roadmap-funcionalidades.md #1).
--
-- Este cambio introduce `routines` (varias por usuario, una marcada como
-- activa a la vez) y cuelga routine_days de routine_id en vez de solo
-- user_id. El backfill convierte la rutina ya sembrada de cada usuario en
-- una fila "Mi rutina" (source='custom', is_active=true) sin perder datos.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ROUTINES
-- ---------------------------------------------------------------------
create table public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  source text not null default 'custom' check (source in ('template', 'custom')),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  constraint routines_user_name_unique unique (user_id, name)
);

create index routines_user_id_idx on public.routines (user_id);

-- Solo una rutina activa por usuario a la vez.
create unique index routines_one_active_per_user
  on public.routines (user_id)
  where (is_active);

alter table public.routines enable row level security;

create policy "routines_owner_access"
  on public.routines
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 2. Backfill: una rutina "Mi rutina" por cada usuario que ya tiene
--    routine_days sembrados, marcada como activa.
-- ---------------------------------------------------------------------
insert into public.routines (user_id, name, source, is_active)
select distinct user_id, 'Mi rutina', 'custom', true
from public.routine_days;

-- ---------------------------------------------------------------------
-- 3. routine_days pasa a colgar de routine_id (además de user_id, que
--    se conserva para no tener que tocar sus políticas RLS).
-- ---------------------------------------------------------------------
alter table public.routine_days
  add column routine_id uuid references public.routines (id) on delete cascade;

update public.routine_days rd
set routine_id = r.id
from public.routines r
where r.user_id = rd.user_id and r.name = 'Mi rutina';

alter table public.routine_days
  alter column routine_id set not null;

create index routine_days_routine_id_idx on public.routine_days (routine_id);

-- El día de la semana ahora es único por rutina, no por usuario: puedes
-- tener "Pierna" el miércoles en dos rutinas distintas al mismo tiempo.
alter table public.routine_days
  drop constraint routine_days_user_day_unique;

alter table public.routine_days
  add constraint routine_days_routine_day_unique unique (routine_id, day_of_week);
