-- Catálogo de anotadores oficiales (igual que árbitros) y su relación con cada juego.
CREATE TABLE IF NOT EXISTS anotadores_oficiales (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  nombres   VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  cedula    VARCHAR(20)  NULL,
  telefono  VARCHAR(30)  NULL,
  activo    TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS juego_anotadores_oficiales (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  juego_id    INT NOT NULL,
  anotador_id INT NOT NULL,
  rol         VARCHAR(40) NULL,
  KEY idx_jao_juego (juego_id),
  CONSTRAINT fk_jao_juego    FOREIGN KEY (juego_id)    REFERENCES juegos(id) ON DELETE CASCADE,
  CONSTRAINT fk_jao_anotador FOREIGN KEY (anotador_id) REFERENCES anotadores_oficiales(id)
);
