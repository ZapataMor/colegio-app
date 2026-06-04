const pool = require("../config/db");

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT
      e.id,
      e.usuario_id,
      e.curso_id,
      e.nombres,
      e.apellidos,
      e.documento,
      e.fecha_nacimiento,
      e.genero,
      e.direccion,
      e.telefono_acudiente,
      e.nombre_acudiente,
      e.estado,
      c.nombre AS curso_nombre,
      c.nivel,
      c.jornada,
      e.created_at,
      e.updated_at
    FROM estudiantes e
    LEFT JOIN cursos c ON c.id = e.curso_id
    WHERE e.id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const findAll = async (estado = null, cursoId = null) => {
  let query = `SELECT
    e.id,
    e.usuario_id,
    e.curso_id,
    e.nombres,
    e.apellidos,
    e.documento,
    e.fecha_nacimiento,
    e.genero,
    e.direccion,
    e.telefono_acudiente,
    e.nombre_acudiente,
    e.estado,
    c.nombre AS curso_nombre,
    c.nivel,
    c.jornada,
    e.created_at,
    e.updated_at
  FROM estudiantes e
  LEFT JOIN cursos c ON c.id = e.curso_id`;

  const params = [];
  const conditions = [];

  if (estado) {
    conditions.push("e.estado = ?");
    params.push(estado);
  }

  if (cursoId) {
    conditions.push("e.curso_id = ?");
    params.push(cursoId);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += ` ORDER BY e.apellidos, e.nombres ASC`;

  const [rows] = await pool.query(query, params);
  return rows;
};

const findByDocumento = async (documento) => {
  const [rows] = await pool.query(
    `SELECT
      e.id,
      e.usuario_id,
      e.curso_id,
      e.nombres,
      e.apellidos,
      e.documento,
      e.estado,
      c.nombre AS curso_nombre
    FROM estudiantes e
    LEFT JOIN cursos c ON c.id = e.curso_id
    WHERE e.documento = ?
    LIMIT 1`,
    [documento]
  );

  return rows[0] || null;
};

const create = async (estudianteData) => {
  const {
    usuarioId = null,
    cursoId,
    nombres,
    apellidos,
    documento,
    fechaNacimiento = null,
    genero = null,
    direccion = null,
    telefonoAcudiente = null,
    nombreAcudiente = null,
  } = estudianteData;

  const [result] = await pool.query(
    `INSERT INTO estudiantes
      (usuario_id, curso_id, nombres, apellidos, documento, fecha_nacimiento, genero, direccion, telefono_acudiente, nombre_acudiente, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo')`,
    [usuarioId, cursoId, nombres, apellidos, documento, fechaNacimiento, genero, direccion, telefonoAcudiente, nombreAcudiente]
  );

  return result.insertId;
};

const update = async (id, estudianteData) => {
  const updates = [];
  const params = [];

  const fieldMap = {
    usuarioId: "usuario_id",
    cursoId: "curso_id",
    nombres: "nombres",
    apellidos: "apellidos",
    documento: "documento",
    fechaNacimiento: "fecha_nacimiento",
    genero: "genero",
    direccion: "direccion",
    telefonoAcudiente: "telefono_acudiente",
    nombreAcudiente: "nombre_acudiente",
    estado: "estado",
  };

  for (const [key, dbField] of Object.entries(fieldMap)) {
    if (estudianteData[key] !== undefined) {
      updates.push(`${dbField} = ?`);
      params.push(estudianteData[key]);
    }
  }

  if (updates.length === 0) return null;

  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);

  const query = `UPDATE estudiantes SET ${updates.join(", ")} WHERE id = ?`;
  const [result] = await pool.query(query, params);

  return result.affectedRows > 0;
};

const deleteEstudiante = async (id) => {
  const [result] = await pool.query(
    `DELETE FROM estudiantes WHERE id = ?`,
    [id]
  );

  return result.affectedRows > 0;
};

module.exports = {
  findById,
  findAll,
  findByDocumento,
  create,
  update,
  deleteEstudiante,
};
