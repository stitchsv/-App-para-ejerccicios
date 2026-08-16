// Acceso a "qué toca hoy" según la plantilla de rutina.
// Intenta leer de Supabase (routine_days + routine_day_exercises + exercises).
// Si esas tablas todavía no existen o no tienen datos, usa RUTINA_REFERENCIA
// como semilla local para poder trabajar en el frontend antes de tener el
// backend completo (ver contexto-proyecto-app-entrenamiento.md).
//
// Asume el siguiente esquema (a confirmar al crear las migraciones):
//   routine_days(id, user_id, day_of_week int 0-6 [0=domingo, igual que Date.getDay()], nombre, enfoque)
//   routine_day_exercises(id, routine_day_id, exercise_id, series_objetivo, orden)
//   exercises(id, user_id, nombre, grupo_muscular, tipo)

const RUTINA_REFERENCIA = {
  0: { nombre: 'Domingo', enfoque: 'Correr (zona 2)', ejercicios: [
    { nombre: 'Carrera suave', series_objetivo: null },
    { nombre: 'Curl de muñeca ligero (opcional)', series_objetivo: 2 },
  ]},
  1: { nombre: 'Lunes', enfoque: 'Espalda + Tríceps (pesado)', ejercicios: [
    { nombre: 'Remo con barra', series_objetivo: 3 },
    { nombre: 'Dominadas asistidas', series_objetivo: 3 },
    { nombre: 'Remo unilateral', series_objetivo: 3 },
    { nombre: 'Extensión de tríceps en polea', series_objetivo: 3 },
  ]},
  2: { nombre: 'Martes', enfoque: 'Antebrazo + Abdomen + Cardio (suave)', ejercicios: [
    { nombre: 'Curl inverso (polea)', series_objetivo: 3 },
    { nombre: 'Curl de antebrazo', series_objetivo: 3 },
    { nombre: 'Crunch en polea', series_objetivo: 3 },
    { nombre: 'Elíptica', series_objetivo: null },
  ]},
  3: { nombre: 'Miércoles', enfoque: 'Pierna (pesado, fijo)', ejercicios: [
    { nombre: 'Sentadilla', series_objetivo: 3 },
    { nombre: 'Peso muerto rumano', series_objetivo: 3 },
    { nombre: 'Prensa', series_objetivo: 3 },
    { nombre: 'Curl femoral', series_objetivo: 3 },
    { nombre: 'Gemelos de pie', series_objetivo: 3 },
  ]},
  4: { nombre: 'Jueves', enfoque: 'Antebrazo + Abdomen + Cardio (suave)', ejercicios: [
    { nombre: 'Curl de muñeca (supino/prono)', series_objetivo: 3 },
    { nombre: 'Crunch en polea (variante)', series_objetivo: 3 },
    { nombre: 'Elíptica', series_objetivo: null },
  ]},
  5: { nombre: 'Viernes', enfoque: 'Pliometría + Hombro (ligero)', ejercicios: [
    { nombre: 'Saltos / Box jumps', series_objetivo: 3 },
    { nombre: 'Press militar con mancuernas', series_objetivo: 3 },
    { nombre: 'Elevaciones laterales', series_objetivo: 3 },
  ]},
  6: { nombre: 'Sábado', enfoque: 'Pecho + Bíceps (pesado)', ejercicios: [
    { nombre: 'Press inclinado', series_objetivo: 3 },
    { nombre: 'Fly con mancuernas', series_objetivo: 3 },
    { nombre: 'Fondos asistidos', series_objetivo: 3 },
    { nombre: 'Curl de bíceps', series_objetivo: 3 },
    { nombre: 'Curl martillo', series_objetivo: 3 },
  ]},
};

// Devuelve { dayOfWeek, nombre, enfoque, ejercicios, fromDatabase, routineDayId }
// para el día de la semana actual (o el indicado en dayOfWeek).
async function getTodayRoutine(dayOfWeek = new Date().getDay()) {
  try {
    const { data: routineDay, error: routineDayError } = await supabaseClient
      .from('routine_days')
      .select('id, nombre, enfoque')
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();

    if (routineDayError || !routineDay) throw routineDayError || new Error('sin datos');

    const { data: items, error: itemsError } = await supabaseClient
      .from('routine_day_exercises')
      .select('series_objetivo, orden, exercises ( id, nombre )')
      .eq('routine_day_id', routineDay.id)
      .order('orden', { ascending: true });

    if (itemsError) throw itemsError;

    return {
      dayOfWeek,
      nombre: routineDay.nombre,
      enfoque: routineDay.enfoque,
      ejercicios: (items || []).map((item) => ({
        id: item.exercises?.id ?? null,
        nombre: item.exercises?.nombre ?? '(ejercicio sin nombre)',
        series_objetivo: item.series_objetivo,
      })),
      fromDatabase: true,
      routineDayId: routineDay.id,
    };
  } catch (err) {
    const fallback = RUTINA_REFERENCIA[dayOfWeek];
    return {
      dayOfWeek,
      nombre: fallback.nombre,
      enfoque: fallback.enfoque,
      ejercicios: fallback.ejercicios.map((e) => ({ id: null, ...e })),
      fromDatabase: false,
      routineDayId: null,
    };
  }
}
