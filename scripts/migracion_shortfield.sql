-- Shortfield (SF): permite el código 'SF' en la posición del fildeo.
-- Muestra el tipo actual de la columna (informativo):
SHOW COLUMNS FROM est_fildeo LIKE 'posicion';
SHOW COLUMNS FROM bateo_juego LIKE 'posicion';

-- Amplía est_fildeo.posicion a texto de hasta 10 caracteres. No cambia ni borra los valores existentes.
-- Si ya era texto, no pasa nada. Si falla por NULLs existentes, avísame el error y no se cambia nada.
ALTER TABLE est_fildeo MODIFY posicion VARCHAR(10) NOT NULL;
