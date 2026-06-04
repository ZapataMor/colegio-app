const pool = require("../config/db");

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT
      m.id,
      m.estudiante_id,
      m.curso_id,
      m.anio,
      m.estado,
      m.created_at,
      m.updated_at,
      e.nombres AS estudiante_nombres,
      e.apellidos AS estudiante_apellidos,
      e.documento AS estudiante_documento,
      c.nombre AS curso_nombre,
      c.nivel AS curso_nivel,
      c.jornada AS curso_jornada
    FROM matriculas m
    INNER JOIN estudiantes e ON e.id = m.estudiante_id
    INNER JOIN cursos c ON c.id = m.curso_id
    WHERE m.id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const findAll = async (estado = null, anio = null, cursoId = null) => {
  let query = `SELECT
    m.id,
    m.estudiante_id,
    m.curso_id,
    m.anio,
    m.estado,
    m.created_at,
    m.updated_at,
    e.nombres AS estudiante_nombres,
    e.apellidos AS estudiante_apellidos,
    e.documento AS estudiante_documento,
    c.nombre AS curso_nombre,
    c.nivel AS curso_nivel,
    c.jornada AS curso_jornada
  FROM matriculas m
  INNER JOIN estudiantes e ON e.id = m.estudiante_id
  INNER JOIN cursos c ON c.id = m.curso_id`;

  const params = [];
  const conditions = [];

  if (estado) {
    conditions.push("m.estado = ?");
    params.push(estado);
  }

  if (anio) {
    conditions.push("m.anio = ?");
    params.push(anio);
  }

  if (cursoId) {
    conditions.push("m.curso_id = ?");
    params.push(cursoId);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += ` ORDER BY m.anio DESC, e.apellidos ASC, e.nombres ASC`;

  const [rows] = await pool.query(query, params);
  return rows;
};

const findByEstudianteAnio = async (estudianteId, anio, excludeId = null) => {
  let query = `SELECT id FROM matriculas WHERE estudiante_id = ? AND anio = ?`;
  const params = [estudianteId, anio];

  if (excludeId) {
    query += ` AND id != ?`;
    params.push(excludeId);
  }

  query += ` LIMIT 1`;

  const [rows] = await pool.query(query, params);
  return rows[0] || null;
};

const create = async ({ estudianteId, cursoId, anio, estado = "activa" }) => {
  const [result] = await pool.query(
    `INSERT INTO matriculas (estudiante_id, curso_id, anio, estado)
    VALUES (?, ?, ?, ?)`,
    [estudianteId, cursoId, anio, estado]
  );

  return result.insertId;
};

const update = async (id, data) => {
  const updates = [];
  const params = [];

  const fieldMap = {
    estudianteId: "estudiante_id",
    cursoId: "curso_id",
    anio: "anio",
    estado: "estado",
  };

  for (const [key, dbField] of Object.entries(fieldMap)) {
    if (data[key] !== undefined) {
      updates.push(`${dbField} = ?`);
      params.push(data[key]);
    }
  }

  if (updates.length === 0) return null;

  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);

  const query = `UPDATE matriculas SET ${updates.join(", ")} WHERE id = ?`;
  const [result] = await pool.query(query, params);

  return result.affectedRows > 0;
};

const deleteMatricula = async (id) => {
  const [result] = await pool.query(`DELETE FROM matriculas WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

module.exports = {
  findById,
  findAll,
  findByEstudianteAnio,
  create,
  update,
  deleteMatricula,
};
