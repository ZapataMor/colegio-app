USE colegio_app;

CREATE TABLE IF NOT EXISTS comunicados (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(140) NOT NULL,
  resumen VARCHAR(220),
  contenido TEXT NOT NULL,
  prioridad ENUM('baja','media','alta','urgente') NOT NULL DEFAULT 'media',
  audiencia ENUM('todos','administrador','profesor','estudiante','acudiente') NOT NULL DEFAULT 'todos',
  curso_id INT UNSIGNED NULL,
  publicado_por_persona_id INT UNSIGNED NULL,
  fecha_publicacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_expiracion DATETIME NULL,
  estado ENUM('borrador','publicado','archivado') NOT NULL DEFAULT 'publicado',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_comunicados_curso FOREIGN KEY (curso_id) REFERENCES cursos(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_comunicados_persona FOREIGN KEY (publicado_por_persona_id) REFERENCES personas(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_comunicados_audiencia (audiencia),
  INDEX idx_comunicados_curso (curso_id),
  INDEX idx_comunicados_estado (estado),
  INDEX idx_comunicados_fecha_publicacion (fecha_publicacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO comunicados
  (titulo, resumen, contenido, prioridad, audiencia, curso_id, fecha_publicacion, estado)
SELECT
  'Semana de bienestar',
  'Cronograma con actividades institucionales para toda la comunidad.',
  'Durante esta semana tendremos jornadas deportivas, encuentro con familias y orientacion de proyecto de vida por niveles.',
  'alta',
  'todos',
  NULL,
  NOW(),
  'publicado'
WHERE NOT EXISTS (
  SELECT 1 FROM comunicados WHERE titulo = 'Semana de bienestar'
);
