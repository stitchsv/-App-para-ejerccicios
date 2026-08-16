-- =====================================================================
-- Datos semilla: catálogo de ejercicios + rutina semanal de referencia
--
-- v_user_id es el usuario oficial (por ahora) de la app:
--   guzmanmoraneduardo+test@gmail.com
-- Si cambia el usuario oficial más adelante, obtén el nuevo id con:
--   select id from auth.users where email = 'tu-email@ejemplo.com';
-- y reemplaza el valor abajo antes de volver a correr este archivo.
-- =====================================================================

do $$
declare
  v_user_id uuid := '1a47dd9b-98ac-443f-9d19-ac3d1e7c3f5b';
begin

  -- -------------------------------------------------------------------
  -- Ejercicios (catálogo)
  -- -------------------------------------------------------------------
  insert into public.exercises (user_id, name, muscle_group, type)
  values
    (v_user_id, 'Remo con barra', 'espalda', 'fuerza'),
    (v_user_id, 'Dominadas asistidas', 'espalda', 'fuerza'),
    (v_user_id, 'Remo unilateral', 'espalda', 'fuerza'),
    (v_user_id, 'Extensión de tríceps en polea', 'triceps', 'fuerza'),
    (v_user_id, 'Curl inverso (polea)', 'antebrazo', 'fuerza'),
    (v_user_id, 'Curl de antebrazo', 'antebrazo', 'fuerza'),
    (v_user_id, 'Crunch en polea', 'abdomen', 'fuerza'),
    (v_user_id, 'Elíptica', 'cardio', 'cardio'),
    (v_user_id, 'Sentadilla', 'pierna', 'fuerza'),
    (v_user_id, 'Peso muerto rumano', 'pierna', 'fuerza'),
    (v_user_id, 'Prensa', 'pierna', 'fuerza'),
    (v_user_id, 'Curl femoral', 'pierna', 'fuerza'),
    (v_user_id, 'Gemelos de pie', 'pierna', 'fuerza'),
    (v_user_id, 'Curl de muñeca (supino/prono)', 'antebrazo', 'fuerza'),
    (v_user_id, 'Crunch en polea (variante)', 'abdomen', 'fuerza'),
    (v_user_id, 'Saltos / Box jumps', 'pierna', 'pliometria'),
    (v_user_id, 'Press militar con mancuernas', 'hombro', 'fuerza'),
    (v_user_id, 'Elevaciones laterales', 'hombro', 'fuerza'),
    (v_user_id, 'Press inclinado', 'pecho', 'fuerza'),
    (v_user_id, 'Fly con mancuernas', 'pecho', 'fuerza'),
    (v_user_id, 'Fondos asistidos', 'pecho', 'fuerza'),
    (v_user_id, 'Curl de bíceps', 'biceps', 'fuerza'),
    (v_user_id, 'Curl martillo', 'biceps', 'fuerza'),
    (v_user_id, 'Carrera suave', 'cardio', 'cardio'),
    (v_user_id, 'Curl de muñeca (ligero)', 'antebrazo', 'fuerza');

  -- -------------------------------------------------------------------
  -- Días de rutina (1 = lunes ... 7 = domingo)
  -- -------------------------------------------------------------------
  insert into public.routine_days (user_id, day_of_week, focus)
  values
    (v_user_id, 1, 'Espalda + Tríceps (pesado)'),
    (v_user_id, 2, 'Antebrazo + Abdomen + Cardio (suave)'),
    (v_user_id, 3, 'Pierna (pesado, fijo)'),
    (v_user_id, 4, 'Antebrazo + Abdomen + Cardio (suave)'),
    (v_user_id, 5, 'Pliometría + Hombro (ligero)'),
    (v_user_id, 6, 'Pecho + Bíceps (pesado)'),
    (v_user_id, 7, 'Correr (zona 2)');

  -- -------------------------------------------------------------------
  -- Ejercicios objetivo por día (el "plan ideal" a comparar con lo real)
  -- -------------------------------------------------------------------
  insert into public.routine_day_exercises
    (user_id, routine_day_id, exercise_id, target_sets, target_reps_min,
     target_reps_max, target_duration_minutes, order_index, notes)
  select
    v_user_id,
    rd.id,
    e.id,
    v.target_sets,
    v.target_reps_min,
    v.target_reps_max,
    v.target_duration_minutes,
    v.order_index,
    v.notes
  from (
    values
      (1, 'Remo con barra', 3::smallint, 6::smallint, 10::smallint, null::smallint, 1::smallint, null::text),
      (1, 'Dominadas asistidas', 3, 6, 10, null, 2, null),
      (1, 'Remo unilateral', 3, 8, 12, null, 3, null),
      (1, 'Extensión de tríceps en polea', 3, 10, 15, null, 4, null),

      (2, 'Curl inverso (polea)', 3, 10, 15, null, 1, null),
      (2, 'Curl de antebrazo', 3, 10, 15, null, 2, null),
      (2, 'Crunch en polea', 3, 12, 15, null, 3, null),
      (2, 'Elíptica', null, null, null, 25, 4, 'Cardio zona 2, suave'),

      (3, 'Sentadilla', 3, 6, 10, null, 1, null),
      (3, 'Peso muerto rumano', 3, 8, 10, null, 2, null),
      (3, 'Prensa', 3, 10, 12, null, 3, null),
      (3, 'Curl femoral', 3, 10, 12, null, 4, null),
      (3, 'Gemelos de pie', 3, 12, 15, null, 5, null),

      (4, 'Curl de muñeca (supino/prono)', 3, 12, 15, null, 1, null),
      (4, 'Crunch en polea (variante)', 3, 12, 15, null, 2, null),
      (4, 'Elíptica', null, null, null, 25, 3, 'Cardio zona 2, suave'),

      (5, 'Saltos / Box jumps', 3, 8, 10, null, 1, 'Evitar juntar con pierna o carrera sin margen de recuperación'),
      (5, 'Press militar con mancuernas', 3, 8, 12, null, 2, null),
      (5, 'Elevaciones laterales', 3, 12, 15, null, 3, null),

      (6, 'Press inclinado', 3, 8, 10, null, 1, null),
      (6, 'Fly con mancuernas', 3, 10, 12, null, 2, null),
      (6, 'Fondos asistidos', 3, 8, 12, null, 3, null),
      (6, 'Curl de bíceps', 3, 10, 12, null, 4, null),
      (6, 'Curl martillo', 3, 10, 12, null, 5, null),

      (7, 'Carrera suave', null, null, null, 35, 1, 'Zona 2, ritmo suave'),
      (7, 'Curl de muñeca (ligero)', 2, 15, 20, null, 2, 'Opcional')
  ) as v(day_of_week, exercise_name, target_sets, target_reps_min,
         target_reps_max, target_duration_minutes, order_index, notes)
  join public.routine_days rd
    on rd.user_id = v_user_id and rd.day_of_week = v.day_of_week
  join public.exercises e
    on e.user_id = v_user_id and e.name = v.exercise_name;

end $$;
