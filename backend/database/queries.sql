
/* ============================================================
   CONSULTAS SELECT DE PRUEBA OPCIONALES
   ============================================================ */

-- Ver roles registrados
SELECT * FROM roles;

-- Ver cursos activos
SELECT id, nombre, nivel, jornada, estado
FROM cursos
WHERE estado = 'activo';

-- Ver asignaturas activas
SELECT id, nombre, descripcion
FROM asignaturas
WHERE estado = 'activo';

-- Ver salones disponibles
SELECT id, nombre, ubicacion, capacidad, estado
FROM salones;

-- Ver periodos académicos
SELECT id, nombre, fecha_inicio, fecha_fin, estado
FROM periodos_academicos;

-- Consulta base para estudiantes con curso
SELECT 
  e.id,
  e.nombres,
  e.apellidos,
  e.documento,
  c.nombre AS curso,
  c.nivel,
  e.estado
FROM estudiantes e
INNER JOIN cursos c ON c.id = e.curso_id;

-- Consulta base para horarios completos
SELECT
  h.id,
  c.nombre AS curso,
  a.nombre AS asignatura,
  CONCAT(p.nombres, ' ', p.apellidos) AS profesor,
  s.nombre AS salon,
  h.dia_semana,
  h.hora_inicio,
  h.hora_fin
FROM horarios h
INNER JOIN cursos c ON c.id = h.curso_id
INNER JOIN asignaturas a ON a.id = h.asignatura_id
INNER JOIN profesores p ON p.id = h.profesor_id
INNER JOIN salones s ON s.id = h.salon_id;

-- Consulta base para notas por estudiante
SELECT
  e.id AS estudiante_id,
  CONCAT(e.nombres, ' ', e.apellidos) AS estudiante,
  c.nombre AS curso,
  a.nombre AS asignatura,
  pa.nombre AS periodo,
  n.nota,
  n.observacion,
  n.fecha_registro
FROM notas n
INNER JOIN estudiantes e ON e.id = n.estudiante_id
INNER JOIN cursos c ON c.id = n.curso_id
INNER JOIN asignaturas a ON a.id = n.asignatura_id
INNER JOIN periodos_academicos pa ON pa.id = n.periodo_id;

-- Consulta base para asistencias por fecha
SELECT
  asi.fecha,
  CONCAT(e.nombres, ' ', e.apellidos) AS estudiante,
  c.nombre AS curso,
  a.nombre AS asignatura,
  asi.estado_asistencia,
  asi.observacion
FROM asistencias asi
INNER JOIN estudiantes e ON e.id = asi.estudiante_id
INNER JOIN cursos c ON c.id = asi.curso_id
INNER JOIN asignaturas a ON a.id = asi.asignatura_id
ORDER BY asi.fecha DESC;