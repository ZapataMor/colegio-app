-- =============================================================================
-- data.sql  -  Seeder de NOTAS por salon (actividades + notas_actividades)
-- =============================================================================
-- El seeder de Node (scripts/seed.js) llena la tabla `notas` (definitiva legacy),
-- pero la pantalla de Notas se alimenta de `actividades` y `notas_actividades`.
-- Este script genera, para cada salon, sus actividades y la nota de cada
-- estudiante activo, de modo que la matriz de notas se vea poblada.
--
-- Uso:
--   mysql -u root colegio_app < backend/database/data.sql
--   (o pegarlo en tu cliente SQL apuntando a la base `colegio_app`)
--
-- Requisitos previos: haber corrido `npm run seed` (cursos, estudiantes,
-- profesores, asignaturas, periodos y horarios deben existir).
--
-- Es idempotente: se puede ejecutar varias veces. Las actividades sembradas se
-- marcan con la descripcion '[seed-notas]' y se regeneran en cada corrida; al
-- borrarlas, sus notas se eliminan en cascada (FK ON DELETE CASCADE).
-- =============================================================================

-- 1) Limpiamos lo sembrado previamente por este script (no toca actividades
--    creadas a mano desde la app, que tienen otra descripcion).
DELETE FROM actividades WHERE descripcion = '[seed-notas]';

-- 2) Creamos las actividades de cada salon.
--    `clases` = combinaciones reales (curso, asignatura, profesor) tomadas de
--    los horarios activos, para que cada actividad quede asignada al profesor
--    que efectivamente dicta esa asignatura en ese curso.
--    `plan` = plantilla de actividades por periodo (los porcentajes suman 100).
INSERT INTO actividades
  (curso_id, asignatura_id, profesor_id, periodo_id, titulo, descripcion, porcentaje, fecha)
SELECT
  clases.curso_id,
  clases.asignatura_id,
  clases.profesor_id,
  per.id,
  plan.titulo,
  '[seed-notas]',
  plan.porcentaje,
  plan.fecha
FROM (
  SELECT DISTINCT h.curso_id, h.asignatura_id, h.profesor_id
  FROM horarios h
  WHERE h.estado = 'activo'
) AS clases
CROSS JOIN (
                    SELECT 'Periodo 1 - 2026' AS periodo, 'Taller 1'     AS titulo, 30.00 AS porcentaje, '2026-02-10' AS fecha
  UNION ALL SELECT 'Periodo 1 - 2026',                  'Evaluacion 1', 35.00,             '2026-02-24'
  UNION ALL SELECT 'Periodo 1 - 2026',                  'Proyecto 1',   35.00,             '2026-03-17'
  UNION ALL SELECT 'Periodo 2 - 2026',                  'Taller 2',     30.00,             '2026-04-21'
  UNION ALL SELECT 'Periodo 2 - 2026',                  'Evaluacion 2', 35.00,             '2026-05-12'
  UNION ALL SELECT 'Periodo 2 - 2026',                  'Proyecto 2',   35.00,             '2026-06-09'
) AS plan
INNER JOIN periodos_academicos per ON per.nombre = plan.periodo;

-- 3) Registramos la nota de cada estudiante activo en cada actividad sembrada.
--    La nota es deterministica (varia por estudiante y actividad) y queda en el
--    rango valido 2.5 - 5.0 (la tabla exige 1.00 - 5.00).
INSERT INTO notas_actividades (actividad_id, estudiante_id, nota, observacion)
SELECT
  a.id,
  e.id,
  ROUND(2.5 + (((e.id * 7) + (a.id * 13)) MOD 26) / 10.0, 1) AS nota,
  NULL
FROM actividades a
INNER JOIN estudiantes e
  ON e.curso_id = a.curso_id
 AND e.estado = 'activo'
WHERE a.descripcion = '[seed-notas]'
ON DUPLICATE KEY UPDATE
  nota = VALUES(nota),
  updated_at = CURRENT_TIMESTAMP;

-- 4) Resumen de lo sembrado.
SELECT
  (SELECT COUNT(*) FROM actividades       WHERE descripcion = '[seed-notas]') AS actividades_creadas,
  (SELECT COUNT(*) FROM notas_actividades na
     INNER JOIN actividades a ON a.id = na.actividad_id
     WHERE a.descripcion = '[seed-notas]')                                    AS notas_creadas;
