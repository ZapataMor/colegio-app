const pool = require("../config/db");

const baseSelect = `SELECT
  h.id,
  h.curso_id,
  h.profesor_id,
  h.asignatura_id,
  h.salon_id,
  h.dia_semana,
  h.hora_inicio,
  h.hora_fin,
  h.estado,
  h.created_at,
  h.updated_at,
  c.nombre AS curso_nombre,
  c.nivel AS curso_nivel,
  a.nombre AS asignatura_nombre,
  s.nombre AS salon_nombre,
  s.ubicacion AS salon_ubicacion,
  p.id AS profesor_persona_id,
  p.nombres AS profesor_nombres,
  p.apellidos AS profesor_apellidos
FROM horarios h
INNER JOIN cursos c ON c.id = h.curso_id
INNER JOIN asignaturas a ON a.id = h.asignatura_id
INNER JOIN salones s ON s.id = h.salon_id
INNER JOIN profesores pr ON pr.id = h.profesor_id
INNER JOIN personas p ON p.id = pr.persona_id`;

const findAll = async ({
  cursoId = null,
  profesorId = null,
  profesorPersonaId = null,
  dia = null,
  estado = null,
  q = null,
  limit = null,
} = {}) => {
  let query = baseSelect;
  const conditions = [];
  const params = [];

  if (cursoId) {
    conditions.push("h.curso_id = ?");
    params.push(cursoId);
  }

  if (profesorId) {
    conditions.push("h.profesor_id = ?");
    params.push(profesorId);
  }

  if (profesorPersonaId) {
    conditions.push("pr.persona_id = ?");
    params.push(profesorPersonaId);
  }

  if (dia) {
    conditions.push("h.dia_semana = ?");
    params.push(dia);
  }

  if (estado) {
    conditions.push("h.estado = ?");
    params.push(estado);
  }

  if (q) {
    const term = `%${q}%`;
    conditions.push(`(
      c.nombre LIKE ? OR
      a.nombre LIKE ? OR
      s.nombre LIKE ? OR
      CONCAT(p.nombres, ' ', p.apellidos) LIKE ?
    )`);
    params.push(term, term, term, term);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += ` ORDER BY FIELD(h.dia_semana, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'), h.hora_inicio ASC`;

  if (limit) {
    query += ` LIMIT ?`;
    params.push(Number(limit));
  }

  const [rows] = await pool.query(query, params);
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.query(`${baseSelect} WHERE h.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO horarios
      (curso_id, profesor_id, asignatura_id, salon_id, dia_semana, hora_inicio, hora_fin, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.cursoId,
      data.profesorId,
      data.asignaturaId,
      data.salonId,
      data.diaSemana,
      data.horaInicio,
      data.horaFin,
      data.estado || "activo",
    ]
  );

  return result.insertId;
};

const update = async (id, data) => {
  const fieldMap = {
    cursoId: "curso_id",
    profesorId: "profesor_id",
    asignaturaId: "asignatura_id",
    salonId: "salon_id",
    diaSemana: "dia_semana",
    horaInicio: "hora_inicio",
    horaFin: "hora_fin",
    estado: "estado",
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
    `UPDATE horarios SET ${updates.join(", ")} WHERE id = ?`,
    params
  );

  return result.affectedRows > 0;
};

const deleteHorario = async (id) => {
  const [result] = await pool.query(`DELETE FROM horarios WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

const getCatalog = async () => {
  const [cursos] = await pool.query(
    `SELECT id, nombre, nivel, jornada FROM cursos WHERE estado = 'activo' ORDER BY nombre ASC`
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
  const [salones] = await pool.query(
    `SELECT id, nombre, ubicacion FROM salones WHERE estado = 'activo' ORDER BY nombre ASC`
  );

  return { cursos, profesores, asignaturas, salones };
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  deleteHorario,
  getCatalog,
};
