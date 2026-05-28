const pool = require("../config/db");

const findByUsuario = async (usuario) => {
  const [rows] = await pool.query(
    "SELECT id, usuario, contrasena, rol FROM usuarios WHERE usuario = ? LIMIT 1",
    [usuario]
  );

  return rows[0] || null;
};

const createUser = async ({ usuario, contrasena, rol }) => {
  const [result] = await pool.query(
    "INSERT INTO usuarios (usuario, contrasena, rol) VALUES (?, ?, ?)",
    [usuario, contrasena, rol]
  );

  return result.insertId;
};

module.exports = {
  findByUsuario,
  createUser,
};
