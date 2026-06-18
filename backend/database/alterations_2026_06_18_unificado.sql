/* ============================================================
   MIGRACION UNIFICADA - 2026-06-18
   Ejecutar UNA SOLA VEZ sobre una base de datos existente.

   Reune en un solo archivo:
     1. Ajustes administrativos de grados y cursos.
     2. Creacion de tablas de actividades y notas por actividad.
     3. Eliminacion de las notas definitivas antiguas (tabla notas),
        que ya no se usan: ahora la definitiva sale del promedio de
        las notas de actividades registradas por cada profesor.
     4. Carga de 5 actividades por asignatura en cada curso
        (segun los horarios activos) y sus notas de ejemplo.

   Es re-ejecutable: omite columnas/indices/constraints existentes
   y no duplica actividades ni notas ya cargadas.
   ============================================================ */

USE colegio_app;

/* ------------------------------------------------------------
   1. AJUSTES DE GRADOS Y CURSOS
   ------------------------------------------------------------ */

CREATE TABLE IF NOT EXISTS grados (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  numeric_level TINYINT UNSIGNED NULL UNIQUE,
  education_level VARCHAR(80),
  status ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_grados_status (status),
  INDEX idx_grados_numeric_level (numeric_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO grados (nombre, numeric_level, education_level) VALUES
('Primero', 1, 'Basica primaria'),
('Segundo', 2, 'Basica primaria'),
('Tercero', 3, 'Basica primaria'),
('Cuarto', 4, 'Basica primaria'),
('Quinto', 5, 'Basica primaria'),
('Sexto', 6, 'Basica secundaria'),
('Septimo', 7, 'Basica secundaria'),
('Octavo', 8, 'Basica secundaria'),
('Noveno', 9, 'Basica secundaria'),
('Decimo', 10, 'Media academica'),
('Once', 11, 'Media academica');

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cursos' AND COLUMN_NAME = 'grade_id') = 0,
  'ALTER TABLE cursos ADD COLUMN grade_id INT UNSIGNED NULL AFTER id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cursos' AND COLUMN_NAME = 'nomenclature') = 0,
  'ALTER TABLE cursos ADD COLUMN nomenclature VARCHAR(20) NULL AFTER grade_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cursos' AND COLUMN_NAME = 'full_name') = 0,
  'ALTER TABLE cursos ADD COLUMN full_name VARCHAR(60) NULL AFTER nomenclature',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cursos' AND COLUMN_NAME = 'max_students') = 0,
  'ALTER TABLE cursos ADD COLUMN max_students INT UNSIGNED NOT NULL DEFAULT 35 AFTER nivel',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE cursos c
INNER JOIN grados g
  ON g.numeric_level = CAST(REGEXP_SUBSTR(c.nombre, '^[0-9]+') AS UNSIGNED)
SET
  c.grade_id = COALESCE(c.grade_id, g.id),
  c.nomenclature = COALESCE(NULLIF(c.nomenclature, ''), UPPER(REGEXP_REPLACE(c.nombre, '^[0-9]+', ''))),
  c.full_name = COALESCE(NULLIF(c.full_name, ''), c.nombre),
  c.max_students = COALESCE(NULLIF(c.max_students, 0), 35),
  c.nivel = COALESCE(NULLIF(c.nivel, ''), g.education_level)
WHERE c.id IN (
  SELECT id
  FROM (
    SELECT c2.id
    FROM cursos c2
    INNER JOIN grados g2
      ON g2.numeric_level = CAST(REGEXP_SUBSTR(c2.nombre, '^[0-9]+') AS UNSIGNED)
    WHERE c2.grade_id IS NULL
       OR c2.nomenclature IS NULL
       OR c2.nomenclature = ''
       OR c2.full_name IS NULL
       OR c2.full_name = ''
       OR c2.max_students IS NULL
       OR c2.max_students = 0
  ) cursos_pendientes
);

-- Si esta consulta devuelve filas, asigna grade_id/nomenclature/full_name manualmente antes de continuar.
SELECT id, nombre, grade_id, nomenclature, full_name
FROM cursos
WHERE grade_id IS NULL
   OR nomenclature IS NULL
   OR nomenclature = ''
   OR full_name IS NULL
   OR full_name = '';

ALTER TABLE cursos
  MODIFY grade_id INT UNSIGNED NOT NULL,
  MODIFY nomenclature VARCHAR(20) NOT NULL,
  MODIFY full_name VARCHAR(60) NOT NULL,
  MODIFY max_students INT UNSIGNED NOT NULL DEFAULT 35;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'cursos' AND CONSTRAINT_NAME = 'fk_cursos_grados') = 0,
  'ALTER TABLE cursos ADD CONSTRAINT fk_cursos_grados FOREIGN KEY (grade_id) REFERENCES grados(id) ON UPDATE CASCADE ON DELETE RESTRICT',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cursos' AND INDEX_NAME = 'uq_cursos_grado_nomenclature') = 0,
  'ALTER TABLE cursos ADD UNIQUE KEY uq_cursos_grado_nomenclature (grade_id, nomenclature)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cursos' AND INDEX_NAME = 'uq_cursos_full_name') = 0,
  'ALTER TABLE cursos ADD UNIQUE KEY uq_cursos_full_name (full_name)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cursos' AND INDEX_NAME = 'idx_cursos_grade_id') = 0,
  'ALTER TABLE cursos ADD INDEX idx_cursos_grade_id (grade_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'cursos' AND CONSTRAINT_NAME = 'chk_cursos_max_students') = 0,
  'ALTER TABLE cursos ADD CONSTRAINT chk_cursos_max_students CHECK (max_students > 0)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

/* ------------------------------------------------------------
   2. TABLAS DE ACTIVIDADES Y NOTAS POR ACTIVIDAD
   ------------------------------------------------------------ */

CREATE TABLE IF NOT EXISTS actividades (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  curso_id INT UNSIGNED NOT NULL,
  asignatura_id INT UNSIGNED NOT NULL,
  profesor_id INT UNSIGNED NOT NULL,
  periodo_id INT UNSIGNED NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT,
  porcentaje DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  fecha DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_actividades_cursos FOREIGN KEY (curso_id) REFERENCES cursos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_actividades_asignaturas FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_actividades_profesores FOREIGN KEY (profesor_id) REFERENCES profesores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_actividades_periodos FOREIGN KEY (periodo_id) REFERENCES periodos_academicos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_actividades_porcentaje CHECK (porcentaje >= 0.00 AND porcentaje <= 100.00),
  INDEX idx_actividades_curso_id (curso_id),
  INDEX idx_actividades_asignatura_id (asignatura_id),
  INDEX idx_actividades_profesor_id (profesor_id),
  INDEX idx_actividades_periodo_id (periodo_id),
  INDEX idx_actividades_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notas_actividades (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actividad_id INT UNSIGNED NOT NULL,
  estudiante_id INT UNSIGNED NOT NULL,
  nota DECIMAL(3,2) NOT NULL,
  observacion TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notas_act_actividades FOREIGN KEY (actividad_id) REFERENCES actividades(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_notas_act_estudiantes FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_notas_act_rango CHECK (nota >= 1.00 AND nota <= 5.00),
  UNIQUE KEY uq_nota_actividad_estudiante (actividad_id, estudiante_id),
  INDEX idx_notas_act_actividad_id (actividad_id),
  INDEX idx_notas_act_estudiante_id (estudiante_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Si notas_actividades ya existia con el rango 0.00-5.00, alinear el CHECK al nuevo rango (1.00-5.00).
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'notas_actividades' AND CONSTRAINT_NAME = 'chk_notas_act_rango') > 0,
  'ALTER TABLE notas_actividades DROP CHECK chk_notas_act_rango',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE notas_actividades
  ADD CONSTRAINT chk_notas_act_rango CHECK (nota >= 1.00 AND nota <= 5.00);

/* ------------------------------------------------------------
   3. ELIMINAR NOTAS DEFINITIVAS ANTIGUAS
   La definitiva ahora se calcula como promedio de notas_actividades.
   ------------------------------------------------------------ */

-- TRUNCATE evita el "safe update mode" de Workbench (no requiere WHERE).
TRUNCATE TABLE notas;

/* ------------------------------------------------------------
   4. CARGA DE ACTIVIDADES Y NOTAS DE EJEMPLO
   5 actividades por cada asignatura de cada curso, tomando el
   profesor asignado en el horario activo y el periodo academico
   activo (Periodo 2 - 2026).

   Requiere que existan horarios activos. Si tu base aun no tiene
   horarios cargados, ejecuta primero el script de asignaciones
   (backend/scripts/ensureTeacherAssignments.js).
   ------------------------------------------------------------ */

INSERT INTO actividades (curso_id, asignatura_id, profesor_id, periodo_id, titulo, descripcion, porcentaje, fecha)
SELECT
  h.curso_id,
  h.asignatura_id,
  h.profesor_id,
  pa.id,
  plantilla.titulo,
  plantilla.descripcion,
  plantilla.porcentaje,
  plantilla.fecha
FROM (
  SELECT curso_id, asignatura_id, MIN(profesor_id) AS profesor_id
  FROM horarios
  WHERE estado = 'activo'
  GROUP BY curso_id, asignatura_id
) h
CROSS JOIN (
  SELECT 'Actividad 1 - Taller'           AS titulo, 'Taller diagnostico del periodo.'        AS descripcion, 20.00 AS porcentaje, '2026-04-10' AS fecha UNION ALL
  SELECT 'Actividad 2 - Quiz',                 'Quiz de seguimiento.',                            20.00,           '2026-04-24' UNION ALL
  SELECT 'Actividad 3 - Exposicion',           'Exposicion en clase.',                            20.00,           '2026-05-08' UNION ALL
  SELECT 'Actividad 4 - Trabajo en grupo',     'Trabajo colaborativo.',                           20.00,           '2026-05-22' UNION ALL
  SELECT 'Actividad 5 - Evaluacion final',     'Evaluacion final del periodo.',                   20.00,           '2026-06-05'
) plantilla
CROSS JOIN (
  SELECT id FROM periodos_academicos WHERE nombre = 'Periodo 2 - 2026' LIMIT 1
) pa
WHERE NOT EXISTS (
  SELECT 1
  FROM actividades ax
  WHERE ax.curso_id = h.curso_id
    AND ax.asignatura_id = h.asignatura_id
    AND ax.periodo_id = pa.id
    AND ax.titulo = plantilla.titulo
);

-- Nota de cada estudiante en cada actividad de su curso (1.0 - 5.0).
INSERT INTO notas_actividades (actividad_id, estudiante_id, nota, observacion)
SELECT
  ac.id,
  e.id,
  ROUND(3 + (RAND() * 2), 1),
  NULL
FROM actividades ac
INNER JOIN estudiantes e
  ON e.curso_id = ac.curso_id AND e.estado = 'activo'
WHERE NOT EXISTS (
  SELECT 1
  FROM notas_actividades nx
  WHERE nx.actividad_id = ac.id
    AND nx.estudiante_id = e.id
);

/* ------------------------------------------------------------
   6. CARGA DE ASISTENCIAS DE EJEMPLO
   Marca asistencia para TODOS los estudiantes en TODAS las
   asignaturas que reciben (segun los horarios activos), en los
   dias reales de clase de cada asignatura durante TODOS los
   dias habiles (lunes a viernes) del periodo activo
   (Periodo 2 - 2026: 06/04/2026 a 12/06/2026).

   ~85% presente y ~15% ausente, de forma aleatoria.
   INSERT IGNORE evita duplicar la marca ya existente
   (clave unica estudiante_id + asignatura_id + fecha).
   ------------------------------------------------------------ */

INSERT IGNORE INTO asistencias
  (estudiante_id, curso_id, asignatura_id, profesor_id, fecha, estado_asistencia, observacion)
SELECT
  e.id,
  h.curso_id,
  h.asignatura_id,
  h.profesor_id,
  d.fecha,
  IF(RAND() < 0.85, 'presente', 'ausente'),
  NULL
FROM horarios h
INNER JOIN estudiantes e
  ON e.curso_id = h.curso_id AND e.estado = 'activo'
INNER JOIN (
  SELECT '2026-04-06' AS fecha, 'lunes'     AS dia UNION ALL
  SELECT '2026-04-07', 'martes'     UNION ALL
  SELECT '2026-04-08', 'miercoles'  UNION ALL
  SELECT '2026-04-09', 'jueves'     UNION ALL
  SELECT '2026-04-10', 'viernes'    UNION ALL
  SELECT '2026-04-13', 'lunes'      UNION ALL
  SELECT '2026-04-14', 'martes'     UNION ALL
  SELECT '2026-04-15', 'miercoles'  UNION ALL
  SELECT '2026-04-16', 'jueves'     UNION ALL
  SELECT '2026-04-17', 'viernes'    UNION ALL
  SELECT '2026-04-20', 'lunes'      UNION ALL
  SELECT '2026-04-21', 'martes'     UNION ALL
  SELECT '2026-04-22', 'miercoles'  UNION ALL
  SELECT '2026-04-23', 'jueves'     UNION ALL
  SELECT '2026-04-24', 'viernes'    UNION ALL
  SELECT '2026-04-27', 'lunes'      UNION ALL
  SELECT '2026-04-28', 'martes'     UNION ALL
  SELECT '2026-04-29', 'miercoles'  UNION ALL
  SELECT '2026-04-30', 'jueves'     UNION ALL
  SELECT '2026-05-01', 'viernes'    UNION ALL
  SELECT '2026-05-04', 'lunes'      UNION ALL
  SELECT '2026-05-05', 'martes'     UNION ALL
  SELECT '2026-05-06', 'miercoles'  UNION ALL
  SELECT '2026-05-07', 'jueves'     UNION ALL
  SELECT '2026-05-08', 'viernes'    UNION ALL
  SELECT '2026-05-11', 'lunes'      UNION ALL
  SELECT '2026-05-12', 'martes'     UNION ALL
  SELECT '2026-05-13', 'miercoles'  UNION ALL
  SELECT '2026-05-14', 'jueves'     UNION ALL
  SELECT '2026-05-15', 'viernes'    UNION ALL
  SELECT '2026-05-18', 'lunes'      UNION ALL
  SELECT '2026-05-19', 'martes'     UNION ALL
  SELECT '2026-05-20', 'miercoles'  UNION ALL
  SELECT '2026-05-21', 'jueves'     UNION ALL
  SELECT '2026-05-22', 'viernes'    UNION ALL
  SELECT '2026-05-25', 'lunes'      UNION ALL
  SELECT '2026-05-26', 'martes'     UNION ALL
  SELECT '2026-05-27', 'miercoles'  UNION ALL
  SELECT '2026-05-28', 'jueves'     UNION ALL
  SELECT '2026-05-29', 'viernes'    UNION ALL
  SELECT '2026-06-01', 'lunes'      UNION ALL
  SELECT '2026-06-02', 'martes'     UNION ALL
  SELECT '2026-06-03', 'miercoles'  UNION ALL
  SELECT '2026-06-04', 'jueves'     UNION ALL
  SELECT '2026-06-05', 'viernes'    UNION ALL
  SELECT '2026-06-08', 'lunes'      UNION ALL
  SELECT '2026-06-09', 'martes'     UNION ALL
  SELECT '2026-06-10', 'miercoles'  UNION ALL
  SELECT '2026-06-11', 'jueves'     UNION ALL
  SELECT '2026-06-12', 'viernes'
) d ON d.dia = h.dia_semana
WHERE h.estado = 'activo';
