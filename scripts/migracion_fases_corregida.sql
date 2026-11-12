-- LOTE 8: FASES DEL TORNEO (eliminatoria, concentrado, semifinal, final)
-- Ejecutar con:  mysql -u ligabeisbol -p ligabeisbol < migracion_fases.sql
-- No toca la vista vw_tabla_posiciones anterior; crea una nueva por fase.

-- 1) Cada juego pertenece a una fase (los existentes quedan como 'eliminatoria').
ALTER TABLE juegos ADD COLUMN IF NOT EXISTS fase VARCHAR(20) NOT NULL DEFAULT 'eliminatoria';

-- 2) Qué equipos juegan cada fase (y en qué grupo). La eliminatoria NO se llena:
--    usa los equipos inscritos y su grupo de siempre.
CREATE TABLE IF NOT EXISTS fase_equipos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  temporada_categoria_id INT NOT NULL,
  fase VARCHAR(20) NOT NULL,
  equipo_inscrito_id INT NOT NULL,
  grupo VARCHAR(10) NULL,
  UNIQUE KEY uq_fase_equipo (temporada_categoria_id, fase, equipo_inscrito_id),
  KEY ix_fase_equipo_ei (equipo_inscrito_id)
);

-- (Los textos de la vista se fuerzan a utf8mb4_unicode_ci para evitar error 1271 "Illegal mix of collations".)
-- 3) Tabla de posiciones por fase (mismas fórmulas que vw_tabla_posiciones,
--    pero contando solo los juegos de cada fase: cada fase arranca en cero).
CREATE OR REPLACE VIEW vw_tabla_posiciones_fase AS
SELECT
  base.equipo_inscrito_id, base.temporada_categoria_id, base.fase, base.grupo,
  base.equipo, base.logo_url,
  base.jj, base.jg, base.jp, base.je,
  ROUND((base.jg / NULLIF(base.jj,0)) * 1000, 0) AS ave,
  (base.jg * 3) + base.je AS ptos,
  ROUND((base.jg / NULLIF(base.jj,0)) * 100, 0) AS rend,
  base.carreras_anotadas, innings.ijo,
  ROUND(base.carreras_anotadas / NULLIF(innings.ijo,0), 2) AS media1,
  base.carreras_permitidas, innings.ijd,
  ROUND(base.carreras_permitidas / NULLIF(innings.ijd,0), 2) AS media2,
  ROUND((base.carreras_anotadas / NULLIF(innings.ijo,0)) - (base.carreras_permitidas / NULLIF(innings.ijd,0)), 2) AS bce,
  (base.carreras_anotadas - base.carreras_permitidas) AS dc
FROM (
  SELECT
    fe.equipo_inscrito_id, fe.temporada_categoria_id, fe.fase, fe.grupo,
    e.nombre AS equipo, e.logo_url AS logo_url,
    COUNT(j.id) AS jj,
    SUM(CASE WHEN
          (j.estado = 'jugado' AND j.equipo_local_id = fe.equipo_inscrito_id AND j.carreras_local > j.carreras_visitante)
       OR (j.estado = 'jugado' AND j.equipo_visitante_id = fe.equipo_inscrito_id AND j.carreras_visitante > j.carreras_local)
       OR (j.estado IN ('ganado_forfeit','ganado_mesa','ganado_retiro') AND j.equipo_ganador_id = fe.equipo_inscrito_id)
       THEN 1 ELSE 0 END) AS jg,
    SUM(CASE WHEN
          (j.estado = 'jugado' AND j.equipo_local_id = fe.equipo_inscrito_id AND j.carreras_local < j.carreras_visitante)
       OR (j.estado = 'jugado' AND j.equipo_visitante_id = fe.equipo_inscrito_id AND j.carreras_visitante < j.carreras_local)
       OR (j.estado IN ('ganado_forfeit','ganado_mesa','ganado_retiro') AND j.equipo_ganador_id <> fe.equipo_inscrito_id)
       THEN 1 ELSE 0 END) AS jp,
    SUM(CASE WHEN j.estado = 'jugado' AND j.carreras_local = j.carreras_visitante THEN 1 ELSE 0 END) AS je,
    SUM(CASE WHEN j.equipo_local_id = fe.equipo_inscrito_id THEN COALESCE(j.carreras_local,0) ELSE COALESCE(j.carreras_visitante,0) END) AS carreras_anotadas,
    SUM(CASE WHEN j.equipo_local_id = fe.equipo_inscrito_id THEN COALESCE(j.carreras_visitante,0) ELSE COALESCE(j.carreras_local,0) END) AS carreras_permitidas
  FROM (
    SELECT ei.id AS equipo_inscrito_id, ei.temporada_categoria_id AS temporada_categoria_id,
           CONVERT('eliminatoria' USING utf8mb4) COLLATE utf8mb4_unicode_ci AS fase, CONVERT(ei.grupo USING utf8mb4) COLLATE utf8mb4_unicode_ci AS grupo
    FROM equipos_inscritos ei
    UNION ALL
    SELECT f.equipo_inscrito_id, f.temporada_categoria_id, CONVERT(f.fase USING utf8mb4) COLLATE utf8mb4_unicode_ci, CONVERT(f.grupo USING utf8mb4) COLLATE utf8mb4_unicode_ci
    FROM fase_equipos f
  ) fe
  JOIN equipos_inscritos ei2 ON ei2.id = fe.equipo_inscrito_id
  JOIN equipos e ON e.id = ei2.equipo_id
  LEFT JOIN juegos j
    ON (j.equipo_local_id = fe.equipo_inscrito_id OR j.equipo_visitante_id = fe.equipo_inscrito_id)
   AND CONVERT(j.fase USING utf8mb4) COLLATE utf8mb4_unicode_ci = fe.fase
   AND j.estado IN ('jugado','ganado_forfeit','ganado_mesa','ganado_retiro')
   AND j.resultado_aprobado = 1
  GROUP BY fe.equipo_inscrito_id, fe.temporada_categoria_id, fe.fase, fe.grupo, e.nombre, e.logo_url
) base
LEFT JOIN (
  SELECT ie.equipo_inscrito_id, ie.fase,
         SUM(COALESCE(ie.id_m, propio.il_total, 0)) AS ijd,
         SUM(COALESCE(ie.io_m, rival.il_total, 0)) AS ijo
  FROM (
    SELECT j.id AS juego_id, CONVERT(j.fase USING utf8mb4) COLLATE utf8mb4_unicode_ci AS fase, j.equipo_local_id AS equipo_inscrito_id,
           j.io_local AS io_m, j.id_local AS id_m
    FROM juegos j WHERE j.estado = 'jugado' AND j.resultado_aprobado = 1
    UNION ALL
    SELECT j.id, CONVERT(j.fase USING utf8mb4) COLLATE utf8mb4_unicode_ci, j.equipo_visitante_id, j.io_visitante, j.id_visitante
    FROM juegos j WHERE j.estado = 'jugado' AND j.resultado_aprobado = 1
  ) ie
  LEFT JOIN (
    SELECT ep.juego_id, r.equipo_inscrito_id, SUM(ep.il) AS il_total
    FROM est_pitcheo ep JOIN roster r ON r.id = ep.roster_id
    WHERE ep.aprobado = 1 GROUP BY ep.juego_id, r.equipo_inscrito_id
  ) propio ON propio.juego_id = ie.juego_id AND propio.equipo_inscrito_id = ie.equipo_inscrito_id
  LEFT JOIN (
    SELECT ep.juego_id, r.equipo_inscrito_id, SUM(ep.il) AS il_total
    FROM est_pitcheo ep JOIN roster r ON r.id = ep.roster_id
    WHERE ep.aprobado = 1 GROUP BY ep.juego_id, r.equipo_inscrito_id
  ) rival ON rival.juego_id = ie.juego_id AND rival.equipo_inscrito_id <> ie.equipo_inscrito_id
  GROUP BY ie.equipo_inscrito_id, ie.fase
) innings ON innings.equipo_inscrito_id = base.equipo_inscrito_id AND innings.fase = base.fase;
