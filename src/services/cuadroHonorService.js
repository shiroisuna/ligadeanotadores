const lideresModel = require('../models/lideresModel');

// Mismas estadísticas que se veían en "Publicaciones.xls" / Cuadro de Honor
const STATS_BATEO_HONOR = [
  'promedio_bateo', 'carreras_impulsadas', 'carreras_anotadas', 'bases_robadas',
  'slugging', 'hits', 'dobles', 'triples', 'jonrones',
];
const STATS_PITCHEO_HONOR = ['efectividad', 'ganados', 'ponches'];

async function obtener(temporada_categoria_id) {
  if (!temporada_categoria_id) {
    const err = new Error('temporada_categoria_id es requerido');
    err.status = 400;
    throw err;
  }

  const bateoEntries = await Promise.all(
    STATS_BATEO_HONOR.map(async (stat) => {
      const [lider] = await lideresModel.lideresBateo(temporada_categoria_id, stat, null, 1);
      return [stat, lider || null];
    })
  );

  const pitcheoEntries = await Promise.all(
    STATS_PITCHEO_HONOR.map(async (stat) => {
      const [lider] = await lideresModel.lideresPitcheo(temporada_categoria_id, stat, 1);
      return [stat, lider || null];
    })
  );

  return {
    bateo: Object.fromEntries(bateoEntries),
    pitcheo: Object.fromEntries(pitcheoEntries),
  };
}

module.exports = { obtener };
