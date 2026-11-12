-- Categorías que NO llevan parte defensiva (innings, outs, asistencias, errores).
-- Este script SOLO agrega la columna (todas quedan en 1 = llevan defensiva) y te muestra las categorías.
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS lleva_defensiva TINYINT(1) NOT NULL DEFAULT 1;

-- Mira qué categorías son de iniciación:
SELECT id, nombre, lleva_defensiva FROM categorias WHERE nombre LIKE '%niciaci%';

-- Luego, SOLO si el resultado de arriba es correcto, ejecuta a mano (cambia los ids por los que salieron):
--   UPDATE categorias SET lleva_defensiva = 0 WHERE id IN (1, 2);
