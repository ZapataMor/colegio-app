const pool = require("../config/db");

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT
      p.id,
      p.usuario_id,
      p.nombres,
      p.apellidos,
      p.documento,
      p.correo,
      p.telefono,
      p.especialidad,
      p.estado,
      p.created_at,
      p.updated_at
    FROM profesores p
    WHERE p.id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const findAll = async (estado = null) => {
  let query = `SELECT
    p.id,
    p.usuario_id,
    p.nombres,
    p.apellidos,
    p.documento,
    p.correo,
    p.telefono,
    p.especialidad,
    p.estado,
    p.created_at,
    p.updated_at
  FROM profesores p`;

  const params = [];

  if (estado) {
    query += ` WHERE p.estado = ?`;
    params.push(estado);
  }

  query += ` ORDER BY p.apellidos, p.nombres ASC`;

  const [rows] = await pool.query(query, params);
  return rows;
};

const findByDocumento = async (documento) => {
  const [rows] = await pool.query(
    `SELECT
      p.id,
      p.usuario_id,
      p.nombres,
      p.apellidos,
      p.documento,
      p.estado
    FROM profesores p
    WHERE p.documento = ?
    LIMIT 1`,
    [documento]
  );

  return rows[0] || null;
};

const findByCorreo = async (correo) => {
  const [rows] = await pool.query(
    `SELECT
      p.id,
      p.usuario_id,
      p.nombres,
      p.apellidos,
      p.correo,
      p.estado
    FROM profesores p
    WHERE p.correo = ?
    LIMIT 1`,
    [correo]
  );

  return rows[0] || null;
};

const create = async (profesorData) => {
  const {
    usuarioId = null,
    nombres,
    apellidos,
    documento,
    correo = null,
    telefono = null,
    especialidad = null,
  } = profesorData;

  const [result] = await pool.query(
    `INSERT INTO profesores
      (usuario_id, nombres, apellidos, documento, correo, telefono, especialidad, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'activo')`,
    [usuarioId, nombres, apellidos, documento, correo, telefono, especialidad]
  );

  return result.insertId;
};

const update = async (id, profesorData) => {
  const updates = [];
  const params = [];

  const fieldMap = {
    usuarioId: "usuario_id",
    nombres: "nombres",
    apellidos: "apellidos",
    documento: "documento",
    correo: "correo",
    telefono: "telefono",
    especialidad: "especialidad",
    estado: "estado",
  };

  for (const [key, dbField] of Object.entries(fieldMap)) {
    if (profesorData[key] !== undefined) {
      updates.push(`${dbField} = ?`);
      params.push(profesorData[key]);
    }
  }

  if (updates.length === 0) return null;

  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);

  const query = `UPDATE profesores SET ${updates.join(", ")} WHERE id = ?`;
  const [result] = await pool.query(query, params);

  return result.affectedRows > 0;
};

const deleteProfesor = async (id) => {
  const [result] = await pool.query(
    `DELETE FROM profesores WHERE id = ?`,
    [id]
  );

  return result.affectedRows > 0;
};

module.exports = {
  findById,
  findAll,
  findByDocumento,
  findByCorreo,
  create,
  update,
  deleteProfesor,
};
