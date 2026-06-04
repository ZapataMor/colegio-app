const pool = require("../config/db");

const findByCorreo = async (correo) => {
  const [rows] = await pool.query(
    `SELECT
      u.id,
<<<<<<< HEAD
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
=======
      u.correo AS usuario,
      u.password_hash AS contrasena,
      CASE
        WHEN r.nombre = 'administrador' THEN 'admin'
        WHEN r.nombre = 'profesor' THEN 'docente'
        ELSE r.nombre
      END AS rol
    FROM usuarios u
    INNER JOIN roles r ON r.id = u.rol_id
    WHERE u.correo = ? AND u.estado = 'activo'
    LIMIT 1`,
    [usuario]
>>>>>>> 71c9502167fbb1f8f1c350ecdeadd61c29c191b5
  );

  return rows[0] || null;
};

<<<<<<< HEAD
const createUser = async ({ rolId, nombre, apellido, correo, passwordHash, telefono = null }) => {
  const [result] = await pool.query(
    `INSERT INTO usuarios
      (rol_id, nombre, apellido, correo, password_hash, telefono, estado)
    VALUES (?, ?, ?, ?, ?, ?, 'activo')`,
    [rolId, nombre, apellido, correo, passwordHash, telefono]
=======
const createUser = async ({ usuario, contrasena, rol }) => {
  const roleName = rol === "admin" ? "administrador" : "profesor";
  const [roles] = await pool.query("SELECT id FROM roles WHERE nombre = ? LIMIT 1", [
    roleName,
  ]);

  if (!roles[0]) {
    throw new Error(`No existe el rol ${roleName}.`);
  }

  const [result] = await pool.query(
    `INSERT INTO usuarios
      (rol_id, nombre, apellido, correo, password_hash, estado)
    VALUES (?, ?, ?, ?, ?, 'activo')`,
    [roles[0].id, usuario, "Prueba", usuario, contrasena]
>>>>>>> 71c9502167fbb1f8f1c350ecdeadd61c29c191b5
  );

  return result.insertId;
};

module.exports = {
  findByCorreo,
  createUser,
};
