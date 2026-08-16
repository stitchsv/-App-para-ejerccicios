-- =====================================================================
-- App de seguimiento de entrenamiento — esquema inicial
-- Tablas + relaciones (FK) + índices + políticas RLS
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. EXERCISES — catálogo de ejercicios del usuario
-- ---------------------------------------------------------------------
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  muscle_group text not null,
  type text not null check (type in ('fuerza', 'cardio', 'pliometria')),
  created_at timestamptz not null default now(),
  constraint exercises_user_name_unique unique (user_id, name)
);

create index exercises_user_id_idx on public.exercises (user_id);

alter table public.exercises enable row level security;

create policy "exercises_owner_access"
  on public.exercises
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 2. ROUTINE_DAYS — plantilla semanal fija (1 = lunes ... 7 = domingo)
-- ---------------------------------------------------------------------
create table public.routine_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 1 and 7),
  focus text not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint routine_days_user_day_unique unique (user_id, day_of_week)
);

create index routine_days_user_id_idx on public.routine_days (user_id);

alter table public.routine_days enable row level security;

create policy "routine_days_owner_access"
  on public.routine_days
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 3. ROUTINE_DAY_EXERCISES — ejercicios y objetivo de cada día de plantilla
--    (plan ideal: series/reps objetivo, o duración objetivo si es cardio)
-- ---------------------------------------------------------------------
create table public.routine_day_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  routine_day_id uuid not null references public.routine_days (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  target_sets smallint,
  target_reps_min smallint,
  target_reps_max smallint,
  target_duration_minutes smallint,
  order_index smallint not null default 1,
  notes text,
  created_at timestamptz not null default now()
);

create index routine_day_exercises_user_id_idx on public.routine_day_exercises (user_id);
create index routine_day_exercises_routine_day_id_idx on public.routine_day_exercises (routine_day_id);
create index routine_day_exercises_exercise_id_idx on public.routine_day_exercises (exercise_id);

alter table public.routine_day_exercises enable row level security;

create policy "routine_day_exercises_owner_access"
  on public.routine_day_exercises
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 4. WORKOUT_SESSIONS — sesión real de entrenamiento
-- ---------------------------------------------------------------------
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_date date not null,
  routine_day_id uuid references public.routine_days (id) on delete set null,
  energy_level smallint check (energy_level between 1 and 5),
  notes text,
  created_at timestamptz not null default now()
);

create index workout_sessions_user_id_idx on public.workout_sessions (user_id);
create index workout_sessions_user_date_idx on public.workout_sessions (user_id, session_date);
create index workout_sessions_routine_day_id_idx on public.workout_sessions (routine_day_id);

alter table public.workout_sessions enable row level security;

create policy "workout_sessions_owner_access"
  on public.workout_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 5. SESSION_SETS — detalle real por serie (peso x reps).
--    Aquí vive el progreso real; exercise_id usa ON DELETE RESTRICT
--    para no perder historial si se borra un ejercicio del catálogo.
-- ---------------------------------------------------------------------
create table public.session_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  set_number smallint not null,
  weight_kg numeric(6, 2),
  reps smallint not null,
  rpe numeric(3, 1) check (rpe between 0 and 10),
  notes text,
  created_at timestamptz not null default now()
);

create index session_sets_user_id_idx on public.session_sets (user_id);
create index session_sets_session_id_idx on public.session_sets (session_id);
create index session_sets_exercise_id_idx on public.session_sets (exercise_id);

alter table public.session_sets enable row level security;

create policy "session_sets_owner_access"
  on public.session_sets
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 6. BODY_MEASUREMENTS — medidas corporales en el tiempo
-- ---------------------------------------------------------------------
create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  measurement_date date not null,
  forearm_cm numeric(5, 2),
  bicep_cm numeric(5, 2),
  body_weight_kg numeric(5, 2),
  notes text,
  created_at timestamptz not null default now()
);

create index body_measurements_user_id_idx on public.body_measurements (user_id);
create index body_measurements_user_date_idx on public.body_measurements (user_id, measurement_date);

alter table public.body_measurements enable row level security;

create policy "body_measurements_owner_access"
  on public.body_measurements
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 7. CARDIO_SESSIONS — elíptica y carrera
-- ---------------------------------------------------------------------
create table public.cardio_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid references public.workout_sessions (id) on delete set null,
  cardio_date date not null,
  activity_type text not null check (activity_type in ('carrera', 'eliptica')),
  duration_minutes smallint not null,
  distance_km numeric(6, 2),
  avg_heart_rate smallint,
  heart_rate_zone smallint check (heart_rate_zone between 1 and 5),
  notes text,
  created_at timestamptz not null default now()
);

create index cardio_sessions_user_id_idx on public.cardio_sessions (user_id);
create index cardio_sessions_user_date_idx on public.cardio_sessions (user_id, cardio_date);
create index cardio_sessions_session_id_idx on public.cardio_sessions (session_id);

alter table public.cardio_sessions enable row level security;

create policy "cardio_sessions_owner_access"
  on public.cardio_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
