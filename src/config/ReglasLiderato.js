// Reglamento de Competencias 2025–2029 (FEVEBEISBOL) — Cap. XXI
// Mínimos para optar a los lideratos y criterios de desempate.
// Los mínimos se multiplican por el número de juegos realizados por el EQUIPO.
//
// ► Para ajustar un valor ("se puede modificar") se edita aquí y se reinicia el backend.

// Ofensiva (bateo y slugging): apariciones legales (AL) por juego del equipo
const BATEO_AL_POR_JUEGO = { 5: 1.5, 6: 2.0, 7: 2.5 };

// Pitcheo (average de ganados/perdidos y efectividad): innings lanzados por juego del equipo
// OJO: el reglamento solo define 6 y 7 entradas; para 5 se usa lo mismo que 6.
const PITCHEO_IL_POR_JUEGO = { 5: 1.0, 6: 1.0, 7: 1.3 };

// Defensiva: innings jugados a la defensiva por juego del equipo
const DEFENSA_IJ_POR_JUEGO = { receptor: 3.0, otras: 4.0 };

function alPorJuego(numInnings) {
  const n = Number(numInnings) || 7;
  return BATEO_AL_POR_JUEGO[n] ?? Math.max(0.5 * (n - 2), 0);
}

function ilPorJuego(numInnings) {
  const n = Number(numInnings) || 7;
  return PITCHEO_IL_POR_JUEGO[n] ?? (n <= 6 ? 1.0 : 1.3);
}

function ijPorJuego(posicion) {
  return posicion === 'C' ? DEFENSA_IJ_POR_JUEGO.receptor : DEFENSA_IJ_POR_JUEGO.otras;
}

// Convierte una lista de criterios [[fn, 'desc'|'asc'], ...] en un comparador.
// Cada criterio se evalúa solo si los anteriores empatan (cadena de desempate).
function comparador(criterios) {
  return (a, b) => {
    for (const [fn, dir] of criterios) {
      const x = Math.round((Number(fn(a)) || 0) * 1e6) / 1e6;
      const y = Math.round((Number(fn(b)) || 0) * 1e6) / 1e6;
      if (x === y) continue;
      const d = x < y ? -1 : 1;
      return dir === 'desc' ? -d : d;
    }
    return 0;
  };
}

module.exports = {
  BATEO_AL_POR_JUEGO, PITCHEO_IL_POR_JUEGO, DEFENSA_IJ_POR_JUEGO,
  alPorJuego, ilPorJuego, ijPorJuego, comparador,
};