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

const createUser = async ({ rolId, nombre, apellido, correo, passwordHash, telefono = null }) => {
  const [result] = await pool.query(
    `INSERT INTO usuarios
      (rol_id, nombre, apellido, correo, password_hash, telefono, estado)
    VALUES (?, ?, ?, ?, ?, ?, 'activo')`,
    [rolId, nombre, apellido, correo, passwordHash, telefono]
  );

  return result.insertId;
};

module.exports = {
  findByCorreo,
  createUser,
};
