const pool = require("../config/db");

const baseSelect = `SELECT
  a.id,
  a.estudiante_id,
  a.curso_id,
  a.asignatura_id,
  a.profesor_id,
  a.fecha,
  a.estado_asistencia,
  a.observacion,
  a.created_at,
  a.updated_at,
  c.nombre AS curso_nombre,
  s.nombre AS asignatura_nombre,
  CONCAT(pp.nombres, ' ', pp.apellidos) AS profesor_nombre,
  pe.id AS estudiante_persona_id,
  pe.nombres AS estudiante_nombres,
  pe.apellidos AS estudiante_apellidos,
  pe.documento AS estudiante_documento,
  pp.id AS profesor_persona_id
FROM asistencias a
INNER JOIN cursos c ON c.id = a.curso_id
INNER JOIN asignaturas s ON s.id = a.asignatura_id
INNER JOIN profesores pr ON pr.id = a.profesor_id
INNER JOIN personas pp ON pp.id = pr.persona_id
INNER JOIN estudiantes e ON e.id = a.estudiante_id
INNER JOIN personas pe ON pe.id = e.persona_id`;

const findAll = async ({
  cursoId = null,
  fecha = null,
  estudianteId = null,
  profesorId = null,
  profesorPersonaId = null,
} = {}) => {
  let query = baseSelect;
  const conditions = [];
  const params = [];

  if (cursoId) {
    conditions.push("a.curso_id = ?");
    params.push(cursoId);
  }

  if (fecha) {
    conditions.push("a.fecha = ?");
    params.push(fecha);
  }

  if (estudianteId) {
    conditions.push("a.estudiante_id = ?");
    params.push(estudianteId);
  }

  if (profesorId) {
    conditions.push("a.profesor_id = ?");
    params.push(profesorId);
  }

  if (profesorPersonaId) {
    conditions.push("pr.persona_id = ?");
    params.push(profesorPersonaId);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += ` ORDER BY a.fecha DESC, pe.apellidos ASC, pe.nombres ASC`;

  const [rows] = await pool.query(query, params);
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.query(`${baseSelect} WHERE a.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO asistencias
      (estudiante_id, curso_id, asignatura_id, profesor_id, fecha, estado_asistencia, observacion)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.estudianteId,
      data.cursoId,
      data.asignaturaId,
      data.profesorId,
      data.fecha,
      data.estadoAsistencia,
      data.observacion || null,
    ]
  );

  return result.insertId;
};

const update = async (id, data) => {
  const fieldMap = {
    estudianteId: "estudiante_id",
    cursoId: "curso_id",
    asignaturaId: "asignatura_id",
    profesorId: "profesor_id",
    fecha: "fecha",
    estadoAsistencia: "estado_asistencia",
    observacion: "observacion",
  };

  const updates = [];
  const params = [];

  for (const [key, dbField] of Object.entries(fieldMap)) {
    if (data[key] !== undefined) {
      updates.push(`${dbField} = ?`);
      params.push(data[key]);
    }
  }

  if (updates.length === 0) return null;

  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);

  const [result] = await pool.query(
    `UPDATE asistencias SET ${updates.join(", ")} WHERE id = ?`,
    params
  );

  return result.affectedRows > 0;
};

const deleteAsistencia = async (id) => {
  const [result] = await pool.query(`DELETE FROM asistencias WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

const getResumen = async ({ cursoId = null, fecha = null, profesorPersonaId = null } = {}) => {
  let query = `SELECT
    a.estado_asistencia,
    COUNT(*) AS total
  FROM asistencias a
  INNER JOIN profesores pr ON pr.id = a.profesor_id`;
  const conditions = [];
  const params = [];

  if (cursoId) {
    conditions.push("a.curso_id = ?");
    params.push(cursoId);
  }

  if (fecha) {
    conditions.push("a.fecha = ?");
    params.push(fecha);
  }

  if (profesorPersonaId) {
    conditions.push("pr.persona_id = ?");
    params.push(profesorPersonaId);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += ` GROUP BY a.estado_asistencia`;

  const [rows] = await pool.query(query, params);
  return rows;
};

const getCatalog = async () => {
  const [cursos] = await pool.query(
    `SELECT id, nombre, nivel FROM cursos WHERE estado = 'activo' ORDER BY nombre ASC`
  );
  const [estudiantes] = await pool.query(
    `SELECT e.id, e.curso_id, CONCAT(p.nombres, ' ', p.apellidos) AS nombre
    FROM estudiantes e
    INNER JOIN personas p ON p.id = e.persona_id
    WHERE e.estado = 'activo'
    ORDER BY p.apellidos, p.nombres ASC`
  );
  const [profesores] = await pool.query(
    `SELECT pr.id, CONCAT(p.nombres, ' ', p.apellidos) AS nombre
    FROM profesores pr
    INNER JOIN personas p ON p.id = pr.persona_id
    WHERE pr.estado = 'activo'
    ORDER BY p.apellidos, p.nombres ASC`
  );
  const [asignaturas] = await pool.query(
    `SELECT id, nombre FROM asignaturas WHERE estado = 'activo' ORDER BY nombre ASC`
  );

  return { cursos, estudiantes, profesores, asignaturas };
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  deleteAsistencia,
  getResumen,
  getCatalog,
};
