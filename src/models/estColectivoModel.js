const pool = require('../config/db');

// Redondea a 3 decimales, devolviendo 0 si el divisor es 0 (evita división por cero).
function ratio(num, den, factor = 1000) {
  const n = Number(num) || 0;
  const d = Number(den) || 0;
  if (!d) return 0;
  return Math.round((n / d) * factor * 1000) / 1000;
}

// ── Bateo colectivo ─────────────────────────────────────────────────
// Suma las líneas de est_bateo de todos los jugadores del equipo
// (acumulado de todos los juegos de la temporada en los que ese
// equipo_inscrito_id tiene datos cargados).
async function obtenerBateoColectivo(equipo_inscrito_id) {
  const [rows] = await pool.execute(
    `SELECT
        COUNT(DISTINCT eb.juego_id) AS j,
        SUM(eb.vb)  AS vb,  SUM(eb.ca) AS ca,  SUM(eb.hc) AS hc,  SUM(eb.bb) AS bb,
        SUM(eb.sh)  AS sh,  SUM(eb.sf) AS sf,  SUM(eb.gp) AS gp,  SUM(eb.in_) AS in_,
        SUM(eb.al)  AS al,  SUM(eb.h2) AS h2,  SUM(eb.h3) AS h3,  SUM(eb.hr) AS hr,
        SUM(eb.ba)  AS ba,  SUM(eb.ci) AS ci,  SUM(eb.br) AS br,  SUM(eb.or_) AS or_,
        SUM(eb.so)  AS so
     FROM est_bateo eb
     JOIN roster r ON r.id = eb.roster_id
     WHERE r.equipo_inscrito_id = ?`,
    [equipo_inscrito_id]
  );
  const t = rows[0] || {};
  return {
    j: t.j || 0,
    vb: t.vb || 0, ca: t.ca || 0, hc: t.hc || 0, bb: t.bb || 0,
    sh: t.sh || 0, sf: t.sf || 0, gp: t.gp || 0, in_: t.in_ || 0,
    al: t.al || 0, h2: t.h2 || 0, h3: t.h3 || 0, hr: t.hr || 0,
    ba: t.ba || 0, ci: t.ci || 0, br: t.br || 0, or_: t.or_ || 0, so: t.so || 0,
    // AVE. principal (promedio de bateo): HC / VB
    promedio_bateo: ratio(t.hc, t.vb),
    // OPS. del excel: (HC + BB) / AL
    ops: ratio((t.hc || 0) + (t.bb || 0), t.al),
    // AVE. bajo SLUGGING: BA / VB
    promedio_slugging: ratio(t.ba, t.vb),
  };
}

// ── Pitcheo colectivo ───────────────────────────────────────────────
async function obtenerPitcheoColectivo(equipo_inscrito_id) {
  const [rows] = await pool.execute(
    `SELECT
        COUNT(DISTINCT ep.juego_id) AS j,
        SUM(ep.g) AS g, SUM(ep.p) AS p, SUM(ep.s) AS s, SUM(ep.e) AS e,
        SUM(ep.i) AS i, SUM(ep.r) AS r, SUM(ep.c) AS c, SUM(ep.b) AS b,
        SUM(ep.vb) AS vb, SUM(ep.hp) AS hp, SUM(ep.h2) AS h2, SUM(ep.h3) AS h3, SUM(ep.hr) AS hr,
        SUM(ep.il) AS il, SUM(ep.cp) AS cp, SUM(ep.cl) AS cl,
        SUM(ep.so) AS so, SUM(ep.bb) AS bb, SUM(ep.bi) AS bi,
        SUM(ep.sh) AS sh, SUM(ep.sf) AS sf, SUM(ep.gp) AS gp,
        SUM(ep.wp) AS wp, SUM(ep.bk) AS bk, SUM(ep.li) AS li
     FROM est_pitcheo ep
     JOIN roster r ON r.id = ep.roster_id
     WHERE r.equipo_inscrito_id = ?`,
    [equipo_inscrito_id]
  );
  const t = rows[0] || {};
  return {
    j: t.j || 0,
    g: t.g || 0, p: t.p || 0, s: t.s || 0, e: t.e || 0,
    i: t.i || 0, r: t.r || 0, c: t.c || 0, b: t.b || 0,
    vb: t.vb || 0, hp: t.hp || 0, h2: t.h2 || 0, h3: t.h3 || 0, hr: t.hr || 0,
    il: t.il || 0, cp: t.cp || 0, cl: t.cl || 0,
    so: t.so || 0, bb: t.bb || 0, bi: t.bi || 0,
    sh: t.sh || 0, sf: t.sf || 0, gp: t.gp || 0,
    wp: t.wp || 0, bk: t.bk || 0, li: t.li || 0,
    // AVE. (bateo permitido): HP / VB
    promedio_bateo_permitido: ratio(t.hp, t.vb),
    // EFEC. (efectividad): CL x 7 / IJ (7 entradas por juego)
    efectividad: ratio((t.cl || 0) * 7, t.il, 1),
  };
}

// ── Fildeo colectivo ────────────────────────────────────────────────
// Total defensivo del equipo, sumando todas las posiciones/jugadores.
async function obtenerFildeoColectivo(equipo_inscrito_id) {
  const [rows] = await pool.execute(
    `SELECT
        SUM(ef.ij) AS ij, SUM(ef.o) AS o, SUM(ef.a) AS a, SUM(ef.e) AS e,
        SUM(ef.tl) AS tl, SUM(ef.dp) AS dp, SUM(ef.di) AS di,
        SUM(ef.pb) AS pb, SUM(ef.ir) AS ir, SUM(ef.or_) AS or_
     FROM est_fildeo ef
     JOIN roster r ON r.id = ef.roster_id
     WHERE r.equipo_inscrito_id = ?`,
    [equipo_inscrito_id]
  );
  const t = rows[0] || {};
  return {
    ij: t.ij || 0, o: t.o || 0, a: t.a || 0, e: t.e || 0,
    tl: t.tl || 0, dp: t.dp || 0, di: t.di || 0,
    pb: t.pb || 0, ir: t.ir || 0, or_: t.or_ || 0,
    // AVE. (fielding %): (O + A) / (O + A + E)
    promedio_fildeo: ratio((t.o || 0) + (t.a || 0), (t.o || 0) + (t.a || 0) + (t.e || 0)),
  };
}

async function obtenerColectivo(equipo_inscrito_id) {
  const [bateo, pitcheo, fildeo] = await Promise.all([
    obtenerBateoColectivo(equipo_inscrito_id),
    obtenerPitcheoColectivo(equipo_inscrito_id),
    obtenerFildeoColectivo(equipo_inscrito_id),
  ]);
  return { bateo, pitcheo, fildeo };
}

// ── Colectivo de TODOS los equipos de una categoría (para la vista pública) ──
async function obtenerBateoColectivoPorCategoria(temporada_categoria_id) {
  const [rows] = await pool.execute(
    `SELECT ei.id AS equipo_inscrito_id, eq.nombre AS equipo, eq.logo_url AS logo_url,
        COUNT(DISTINCT eb.juego_id) AS j,
        SUM(eb.vb)  AS vb,  SUM(eb.ca) AS ca,  SUM(eb.hc) AS hc,  SUM(eb.bb) AS bb,
        SUM(eb.sh)  AS sh,  SUM(eb.sf) AS sf,  SUM(eb.gp) AS gp,  SUM(eb.in_) AS in_,
        SUM(eb.al)  AS al,  SUM(eb.h2) AS h2,  SUM(eb.h3) AS h3,  SUM(eb.hr) AS hr,
        SUM(eb.ba)  AS ba,  SUM(eb.ci) AS ci,  SUM(eb.br) AS br,  SUM(eb.or_) AS or_,
        SUM(eb.so)  AS so
     FROM equipos_inscritos ei
     JOIN equipos eq ON eq.id = ei.equipo_id
     LEFT JOIN roster r ON r.equipo_inscrito_id = ei.id
     LEFT JOIN est_bateo eb ON eb.roster_id = r.id
     WHERE ei.temporada_categoria_id = ?
     GROUP BY ei.id, eq.nombre
     ORDER BY eq.nombre`,
    [temporada_categoria_id]
  );
  return rows.map((t) => ({
    equipo_inscrito_id: t.equipo_inscrito_id, equipo: t.equipo, logo_url: t.logo_url, j: t.j || 0,
    vb: t.vb || 0, ca: t.ca || 0, hc: t.hc || 0, bb: t.bb || 0,
    sh: t.sh || 0, sf: t.sf || 0, gp: t.gp || 0, in_: t.in_ || 0,
    al: t.al || 0, h2: t.h2 || 0, h3: t.h3 || 0, hr: t.hr || 0,
    ba: t.ba || 0, ci: t.ci || 0, br: t.br || 0, or_: t.or_ || 0, so: t.so || 0,
    promedio_bateo: ratio(t.hc, t.vb),
    ops: ratio((t.hc || 0) + (t.bb || 0), t.al),
    promedio_slugging: ratio(t.ba, t.vb),
  }));
}

async function obtenerPitcheoColectivoPorCategoria(temporada_categoria_id) {
  const [rows] = await pool.execute(
    `SELECT ei.id AS equipo_inscrito_id, eq.nombre AS equipo, eq.logo_url AS logo_url,
        COUNT(DISTINCT ep.juego_id) AS j,
        SUM(ep.g) AS g, SUM(ep.p) AS p, SUM(ep.s) AS s, SUM(ep.e) AS e,
        SUM(ep.i) AS i, SUM(ep.r) AS r, SUM(ep.c) AS c, SUM(ep.b) AS b,
        SUM(ep.vb) AS vb, SUM(ep.hp) AS hp, SUM(ep.h2) AS h2, SUM(ep.h3) AS h3, SUM(ep.hr) AS hr,
        SUM(ep.il) AS il, SUM(ep.cp) AS cp, SUM(ep.cl) AS cl,
        SUM(ep.so) AS so, SUM(ep.bb) AS bb, SUM(ep.bi) AS bi,
        SUM(ep.sh) AS sh, SUM(ep.sf) AS sf, SUM(ep.gp) AS gp,
        SUM(ep.wp) AS wp, SUM(ep.bk) AS bk, SUM(ep.li) AS li
     FROM equipos_inscritos ei
     JOIN equipos eq ON eq.id = ei.equipo_id
     LEFT JOIN roster r ON r.equipo_inscrito_id = ei.id
     LEFT JOIN est_pitcheo ep ON ep.roster_id = r.id
     WHERE ei.temporada_categoria_id = ?
     GROUP BY ei.id, eq.nombre
     ORDER BY eq.nombre`,
    [temporada_categoria_id]
  );
  return rows.map((t) => ({
    equipo_inscrito_id: t.equipo_inscrito_id, equipo: t.equipo, logo_url: t.logo_url, j: t.j || 0,
    g: t.g || 0, p: t.p || 0, s: t.s || 0, e: t.e || 0,
    i: t.i || 0, r: t.r || 0, c: t.c || 0, b: t.b || 0,
    vb: t.vb || 0, hp: t.hp || 0, h2: t.h2 || 0, h3: t.h3 || 0, hr: t.hr || 0,
    il: t.il || 0, cp: t.cp || 0, cl: t.cl || 0,
    so: t.so || 0, bb: t.bb || 0, bi: t.bi || 0,
    sh: t.sh || 0, sf: t.sf || 0, gp: t.gp || 0,
    wp: t.wp || 0, bk: t.bk || 0, li: t.li || 0,
    promedio_bateo_permitido: ratio(t.hp, t.vb),
    efectividad: ratio((t.cl || 0) * 7, t.il, 1),
  }));
}

async function obtenerFildeoColectivoPorCategoria(temporada_categoria_id) {
  const [rows] = await pool.execute(
    `SELECT ei.id AS equipo_inscrito_id, eq.nombre AS equipo, eq.logo_url AS logo_url,
        SUM(ef.ij) AS ij, SUM(ef.o) AS o, SUM(ef.a) AS a, SUM(ef.e) AS e,
        SUM(ef.tl) AS tl, SUM(ef.dp) AS dp, SUM(ef.di) AS di,
        SUM(ef.pb) AS pb, SUM(ef.ir) AS ir, SUM(ef.or_) AS or_
     FROM equipos_inscritos ei
     JOIN equipos eq ON eq.id = ei.equipo_id
     LEFT JOIN roster r ON r.equipo_inscrito_id = ei.id
     LEFT JOIN est_fildeo ef ON ef.roster_id = r.id
     WHERE ei.temporada_categoria_id = ?
     GROUP BY ei.id, eq.nombre
     ORDER BY eq.nombre`,
    [temporada_categoria_id]
  );
  return rows.map((t) => ({
    equipo_inscrito_id: t.equipo_inscrito_id, equipo: t.equipo, logo_url: t.logo_url,
    ij: t.ij || 0, o: t.o || 0, a: t.a || 0, e: t.e || 0,
    tl: t.tl || 0, dp: t.dp || 0, di: t.di || 0,
    pb: t.pb || 0, ir: t.ir || 0, or_: t.or_ || 0,
    promedio_fildeo: ratio((t.o || 0) + (t.a || 0), (t.o || 0) + (t.a || 0) + (t.e || 0)),
  }));
}

async function obtenerColectivoPorCategoria(temporada_categoria_id) {
  const [bateo, pitcheo, fildeo] = await Promise.all([
    obtenerBateoColectivoPorCategoria(temporada_categoria_id),
    obtenerPitcheoColectivoPorCategoria(temporada_categoria_id),
    obtenerFildeoColectivoPorCategoria(temporada_categoria_id),
  ]);
  return { bateo, pitcheo, fildeo };
}

module.exports = {
  obtenerBateoColectivo, obtenerPitcheoColectivo, obtenerFildeoColectivo, obtenerColectivo,
  obtenerBateoColectivoPorCategoria, obtenerPitcheoColectivoPorCategoria, obtenerFildeoColectivoPorCategoria,
  obtenerColectivoPorCategoria,
};