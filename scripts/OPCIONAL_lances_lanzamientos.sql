-- 1) Lanzamientos (T.L) en el pitcheo de estadísticas
ALTER TABLE est_pitcheo ADD COLUMN IF NOT EXISTS tl INT NOT NULL DEFAULT 0;

-- 2) Lances de fildeo: TL = O + A + E (recalcula lo ya cargado)
UPDATE est_fildeo SET tl = COALESCE(o,0) + COALESCE(a,0) + COALESCE(e,0);
