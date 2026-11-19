-- UNIR CATEGORIAS "GRUPO A" + "GRUPO B" EN UNA SOLA (temporada 8)
-- Juvenil AA: se mueven los equipos, juegos y fases de tc 18 (Grupo B) a tc 17 (Grupo A); los equipos conservan su grupo A/B.
-- Infantil A, Infantil AA y Juvenil A: el "Grupo B" esta vacio; se elimina y se renombra la categoria que queda.
-- Todo es DML dentro de una transaccion y los DELETE solo actuan si la categoria quedo vacia.

START TRANSACTION;

SELECT 'ANTES' AS momento;
SELECT tc.id AS tc_id, c.id AS categoria_id, c.nombre,
       (SELECT COUNT(*) FROM equipos_inscritos ei WHERE ei.temporada_categoria_id = tc.id) AS equipos,
       (SELECT GROUP_CONCAT(DISTINCT ei.grupo) FROM equipos_inscritos ei WHERE ei.temporada_categoria_id = tc.id) AS grupos,
       (SELECT COUNT(*) FROM juegos j WHERE j.temporada_categoria_id = tc.id) AS juegos,
       (SELECT COUNT(*) FROM fase_equipos f WHERE f.temporada_categoria_id = tc.id) AS fase_equipos
FROM temporada_categoria tc JOIN categorias c ON c.id = tc.categoria_id
ORDER BY c.orden_visual, c.id;

-- 1) JUVENIL AA  (tc 17 <- tc 18)
UPDATE equipos_inscritos SET temporada_categoria_id = 17 WHERE temporada_categoria_id = 18;
UPDATE juegos            SET temporada_categoria_id = 17 WHERE temporada_categoria_id = 18;
UPDATE fase_equipos      SET temporada_categoria_id = 17 WHERE temporada_categoria_id = 18;
UPDATE categorias        SET nombre = 'Juvenil AA' WHERE id = 17;
DELETE FROM temporada_categoria
 WHERE id = 18
   AND NOT EXISTS (SELECT 1 FROM equipos_inscritos WHERE temporada_categoria_id = 18)
   AND NOT EXISTS (SELECT 1 FROM juegos WHERE temporada_categoria_id = 18)
   AND NOT EXISTS (SELECT 1 FROM fase_equipos WHERE temporada_categoria_id = 18)
   AND NOT EXISTS (SELECT 1 FROM torneos WHERE temporada_categoria_id = 18);
DELETE FROM categorias WHERE id = 18 AND NOT EXISTS (SELECT 1 FROM temporada_categoria WHERE categoria_id = 18);

-- 2) INFANTIL A  (queda tc 9 / categoria 7; se elimina el Grupo B vacio tc 13 / categoria 13)
UPDATE categorias SET nombre = 'Infantil A' WHERE id = 7;
DELETE FROM temporada_categoria
 WHERE id = 13
   AND NOT EXISTS (SELECT 1 FROM equipos_inscritos WHERE temporada_categoria_id = 13)
   AND NOT EXISTS (SELECT 1 FROM juegos WHERE temporada_categoria_id = 13)
   AND NOT EXISTS (SELECT 1 FROM fase_equipos WHERE temporada_categoria_id = 13)
   AND NOT EXISTS (SELECT 1 FROM torneos WHERE temporada_categoria_id = 13);
DELETE FROM categorias WHERE id = 13 AND NOT EXISTS (SELECT 1 FROM temporada_categoria WHERE categoria_id = 13);

-- 3) INFANTIL AA (queda tc 10 / categoria 8; se elimina el Grupo B vacio tc 14 / categoria 14)
UPDATE categorias SET nombre = 'Infantil AA' WHERE id = 8;
DELETE FROM temporada_categoria
 WHERE id = 14
   AND NOT EXISTS (SELECT 1 FROM equipos_inscritos WHERE temporada_categoria_id = 14)
   AND NOT EXISTS (SELECT 1 FROM juegos WHERE temporada_categoria_id = 14)
   AND NOT EXISTS (SELECT 1 FROM fase_equipos WHERE temporada_categoria_id = 14)
   AND NOT EXISTS (SELECT 1 FROM torneos WHERE temporada_categoria_id = 14);
DELETE FROM categorias WHERE id = 14 AND NOT EXISTS (SELECT 1 FROM temporada_categoria WHERE categoria_id = 14);

-- 4) JUVENIL A   (queda tc 15 / categoria 15; se elimina el Grupo B vacio tc 16 / categoria 16)
UPDATE categorias SET nombre = 'Juvenil A' WHERE id = 15;
DELETE FROM temporada_categoria
 WHERE id = 16
   AND NOT EXISTS (SELECT 1 FROM equipos_inscritos WHERE temporada_categoria_id = 16)
   AND NOT EXISTS (SELECT 1 FROM juegos WHERE temporada_categoria_id = 16)
   AND NOT EXISTS (SELECT 1 FROM fase_equipos WHERE temporada_categoria_id = 16)
   AND NOT EXISTS (SELECT 1 FROM torneos WHERE temporada_categoria_id = 16);
DELETE FROM categorias WHERE id = 16 AND NOT EXISTS (SELECT 1 FROM temporada_categoria WHERE categoria_id = 16);

SELECT 'DESPUES (dentro de la transaccion)' AS momento;
SELECT tc.id AS tc_id, c.id AS categoria_id, c.nombre,
       (SELECT COUNT(*) FROM equipos_inscritos ei WHERE ei.temporada_categoria_id = tc.id) AS equipos,
       (SELECT GROUP_CONCAT(DISTINCT ei.grupo) FROM equipos_inscritos ei WHERE ei.temporada_categoria_id = tc.id) AS grupos,
       (SELECT COUNT(*) FROM juegos j WHERE j.temporada_categoria_id = tc.id) AS juegos,
       (SELECT COUNT(*) FROM fase_equipos f WHERE f.temporada_categoria_id = tc.id) AS fase_equipos
FROM temporada_categoria tc JOIN categorias c ON c.id = tc.categoria_id
ORDER BY c.orden_visual, c.id;
SELECT 'Equipos de Juvenil AA por grupo' AS detalle, grupo, COUNT(*) AS equipos
FROM equipos_inscritos WHERE temporada_categoria_id = 17 GROUP BY grupo;

-- SIMULACION: deshace todo, no cambia nada.
ROLLBACK;
SELECT 'SIMULACION TERMINADA: se hizo ROLLBACK, la base no cambio' AS resultado;
