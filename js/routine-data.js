// Acceso a "qué toca hoy" según la plantilla de rutina.
// Lee de Supabase (routine_days + routine_day_exercises + exercises).
// Si esas tablas no tienen fila para el día de hoy (usuario nuevo, o BD
// vacía), usa RUTINA_REFERENCIA como semilla local — los mismos valores
// del seed SQL — para poder trabajar en el frontend igual.
//
// Esquema real (supabase/migrations):
//   routine_days(id, user_id, day_of_week smallint 1-7 [1=lunes...7=domingo], focus, notes)
//   routine_day_exercises(id, user_id, routine_day_id, exercise_id, target_sets,
//     target_reps_min, target_reps_max, target_duration_minutes, order_index, notes)
//   exercises(id, user_id, name, muscle_group, type ['fuerza'|'cardio'|'pliometria'])

const DIAS_SEMANA = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// JS Date.getDay() usa 0=domingo...6=sábado; la BD usa 1=lunes...7=domingo.
function jsDayToDbDay(jsDay) {
  return jsDay === 0 ? 7 : jsDay;
}

const RUTINA_REFERENCIA = {
  1: { focus: 'Espalda + Tríceps (pesado)', ejercicios: [
    { name: 'Remo con barra', type: 'fuerza', target_sets: 3, target_reps_min: 6, target_reps_max: 10, target_duration_minutes: null },
    { name: 'Dominadas asistidas', type: 'fuerza', target_sets: 3, target_reps_min: 6, target_reps_max: 10, target_duration_minutes: null },
    { name: 'Remo unilateral', type: 'fuerza', target_sets: 3, target_reps_min: 8, target_reps_max: 12, target_duration_minutes: null },
    { name: 'Extensión de tríceps en polea', type: 'fuerza', target_sets: 3, target_reps_min: 10, target_reps_max: 15, target_duration_minutes: null },
  ]},
  2: { focus: 'Antebrazo + Abdomen + Cardio (suave)', ejercicios: [
    { name: 'Curl inverso (polea)', type: 'fuerza', target_sets: 3, target_reps_min: 10, target_reps_max: 15, target_duration_minutes: null },
    { name: 'Curl de antebrazo', type: 'fuerza', target_sets: 3, target_reps_min: 10, target_reps_max: 15, target_duration_minutes: null },
    { name: 'Crunch en polea', type: 'fuerza', target_sets: 3, target_reps_min: 12, target_reps_max: 15, target_duration_minutes: null },
    { name: 'Elíptica', type: 'cardio', target_sets: null, target_reps_min: null, target_reps_max: null, target_duration_minutes: 25 },
  ]},
  3: { focus: 'Pierna (pesado, fijo)', ejercicios: [
    { name: 'Sentadilla', type: 'fuerza', target_sets: 3, target_reps_min: 6, target_reps_max: 10, target_duration_minutes: null },
    { name: 'Peso muerto rumano', type: 'fuerza', target_sets: 3, target_reps_min: 8, target_reps_max: 10, target_duration_minutes: null },
    { name: 'Prensa', type: 'fuerza', target_sets: 3, target_reps_min: 10, target_reps_max: 12, target_duration_minutes: null },
    { name: 'Curl femoral', type: 'fuerza', target_sets: 3, target_reps_min: 10, target_reps_max: 12, target_duration_minutes: null },
    { name: 'Gemelos de pie', type: 'fuerza', target_sets: 3, target_reps_min: 12, target_reps_max: 15, target_duration_minutes: null },
  ]},
  4: { focus: 'Antebrazo + Abdomen + Cardio (suave)', ejercicios: [
    { name: 'Curl de muñeca (supino/prono)', type: 'fuerza', target_sets: 3, target_reps_min: 12, target_reps_max: 15, target_duration_minutes: null },
    { name: 'Crunch en polea (variante)', type: 'fuerza', target_sets: 3, target_reps_min: 12, target_reps_max: 15, target_duration_minutes: null },
    { name: 'Elíptica', type: 'cardio', target_sets: null, target_reps_min: null, target_reps_max: null, target_duration_minutes: 25 },
  ]},
  5: { focus: 'Pliometría + Hombro (ligero)', ejercicios: [
    { name: 'Saltos / Box jumps', type: 'pliometria', target_sets: 3, target_reps_min: 8, target_reps_max: 10, target_duration_minutes: null },
    { name: 'Press militar con mancuernas', type: 'fuerza', target_sets: 3, target_reps_min: 8, target_reps_max: 12, target_duration_minutes: null },
    { name: 'Elevaciones laterales', type: 'fuerza', target_sets: 3, target_reps_min: 12, target_reps_max: 15, target_duration_minutes: null },
  ]},
  6: { focus: 'Pecho + Bíceps (pesado)', ejercicios: [
    { name: 'Press inclinado', type: 'fuerza', target_sets: 3, target_reps_min: 8, target_reps_max: 10, target_duration_minutes: null },
    { name: 'Fly con mancuernas', type: 'fuerza', target_sets: 3, target_reps_min: 10, target_reps_max: 12, target_duration_minutes: null },
    { name: 'Fondos asistidos', type: 'fuerza', target_sets: 3, target_reps_min: 8, target_reps_max: 12, target_duration_minutes: null },
    { name: 'Curl de bíceps', type: 'fuerza', target_sets: 3, target_reps_min: 10, target_reps_max: 12, target_duration_minutes: null },
    { name: 'Curl martillo', type: 'fuerza', target_sets: 3, target_reps_min: 10, target_reps_max: 12, target_duration_minutes: null },
  ]},
  7: { focus: 'Correr (zona 2)', ejercicios: [
    { name: 'Carrera suave', type: 'cardio', target_sets: null, target_reps_min: null, target_reps_max: null, target_duration_minutes: 35 },
    { name: 'Curl de muñeca (ligero)', type: 'fuerza', target_sets: 2, target_reps_min: 15, target_reps_max: 20, target_duration_minutes: null },
  ]},
};

// Devuelve una etiqueta legible del objetivo: "3 series 6-10 reps" o "25 min".
function formatTarget(ej) {
  if (ej.target_duration_minutes) return `${ej.target_duration_minutes} min`;
  if (ej.target_sets) {
    const reps = ej.target_reps_min && ej.target_reps_max
      ? `${ej.target_reps_min}-${ej.target_reps_max} reps`
      : '';
    return `${ej.target_sets} series ${reps}`.trim();
  }
  return 'sin objetivo definido';
}

// Devuelve { dayOfWeek (1-7), dayName, focus, ejercicios, fromDatabase, routineDayId }
// para el día de la semana actual (o el indicado en jsDay, formato Date.getDay()).
async function getTodayRoutine(jsDay = new Date().getDay()) {
  const dayOfWeek = jsDayToDbDay(jsDay);

  try {
    const { data: routineDay, error: routineDayError } = await supabaseClient
      .from('routine_days')
      .select('id, focus, notes')
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();

    if (routineDayError) throw routineDayError;
    if (!routineDay) throw new Error('sin datos para este día');

    const { data: items, error: itemsError } = await supabaseClient
      .from('routine_day_exercises')
      .select(`
        target_sets, target_reps_min, target_reps_max, target_duration_minutes,
        order_index, notes,
        exercises ( id, name, muscle_group, type )
      `)
      .eq('routine_day_id', routineDay.id)
      .order('order_index', { ascending: true });

    if (itemsError) throw itemsError;

    return {
      dayOfWeek,
      dayName: DIAS_SEMANA[dayOfWeek],
      focus: routineDay.focus,
      ejercicios: (items || []).map((item) => ({
        id: item.exercises?.id ?? null,
        name: item.exercises?.name ?? '(ejercicio sin nombre)',
        type: item.exercises?.type ?? 'fuerza',
        target_sets: item.target_sets,
        target_reps_min: item.target_reps_min,
        target_reps_max: item.target_reps_max,
        target_duration_minutes: item.target_duration_minutes,
      })),
      fromDatabase: true,
      routineDayId: routineDay.id,
    };
  } catch (err) {
    const fallback = RUTINA_REFERENCIA[dayOfWeek];
    return {
      dayOfWeek,
      dayName: DIAS_SEMANA[dayOfWeek],
      focus: fallback.focus,
      ejercicios: fallback.ejercicios.map((e) => ({ id: null, ...e })),
      fromDatabase: false,
      routineDayId: null,
    };
  }
}
