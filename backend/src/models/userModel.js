const pool = require("../config/db");

const findByCorreo = async (correo) => {
  const [rows] = await pool.query(
    `SELECT
      u.id,
      u.nombre,
      u.apellido,
      u.correo,
      u.password_hash,
      u.estado,
      r.nombre AS rol
    FROM usuarios u
    INNER JOIN roles r ON r.id = u.rol_id
    WHERE u.correo = ?
    LIMIT 1`,
    [correo]
  );

  return rows[0] || null;
};

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT
      u.id,
      u.nombre,
      u.apellido,
      u.correo,
      u.telefono,
      u.estado,
      u.rol_id,
      r.nombre AS rol
    FROM usuarios u
    INNER JOIN roles r ON r.id = u.rol_id
    WHERE u.id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const findAll = async (estado = null) => {
  let query = `SELECT
    u.id,
    u.nombre,
    u.apellido,
    u.correo,
    u.telefono,
    u.estado,
    u.rol_id,
    r.nombre AS rol,
    u.created_at,
    u.updated_at
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.rol_id`;

  const params = [];

  if (estado) {
    query += ` WHERE u.estado = ?`;
    params.push(estado);
  }

  query += ` ORDER BY u.apellido, u.nombre ASC`;

  const [rows] = await pool.query(query, params);
  return rows;
};

const createUser = async ({ rolId, nombre, apellido, correo, passwordHash, telefono = null }) => {
  const [result] = await pool.query(
    `INSERT INTO usuarios
      (rol_id, nombre, apellido, correo, password_hash, telefono, estado)
    VALUES (?, ?, ?, ?, ?, ?, 'activo')`,
    [rolId, nombre, apellido, correo, passwordHash, telefono]
  );

  return result.insertId;
};

const updateUser = async (id, { nombre, apellido, telefono, estado }) => {
  const updates = [];
  const params = [];

  if (nombre !== undefined) {
    updates.push("nombre = ?");
    params.push(nombre);
  }
  if (apellido !== undefined) {
    updates.push("apellido = ?");
    params.push(apellido);
  }
  if (telefono !== undefined) {
    updates.push("telefono = ?");
    params.push(telefono);
  }
  if (estado !== undefined) {
    updates.push("estado = ?");
    params.push(estado);
  }

  if (updates.length === 0) return null;

  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);

  const query = `UPDATE usuarios SET ${updates.join(", ")} WHERE id = ?`;
  const [result] = await pool.query(query, params);

  return result.affectedRows > 0;
};

const deleteUser = async (id) => {
  const [result] = await pool.query(
    `DELETE FROM usuarios WHERE id = ?`,
    [id]
  );

  return result.affectedRows > 0;
};

module.exports = {
  findByCorreo,
  findById,
  findAll,
  createUser,
  updateUser,
  deleteUser,
};
