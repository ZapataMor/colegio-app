const pool = require("../config/db");

const findAll = async (estado = null) => {
  let query = `SELECT id, nombre, ubicacion, capacidad, estado, created_at, updated_at FROM salones`;
  const params = [];

  if (estado) {
    query += ` WHERE estado = ?`;
    params.push(estado);
  }

  query += ` ORDER BY nombre ASC`;

  const [rows] = await pool.query(query, params);
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT id, nombre, ubicacion, capacidad, estado, created_at, updated_at
     FROM salones
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const create = async ({ nombre, ubicacion = null, capacidad = 0, estado = "activo" }) => {
  const [result] = await pool.query(
    `INSERT INTO salones (nombre, ubicacion, capacidad, estado)
     VALUES (?, ?, ?, ?)`,
    [nombre, ubicacion, capacidad, estado]
  );

  return result.insertId;
};

const update = async (id, data) => {
  const updates = [];
  const params = [];
  const fieldMap = {
    nombre: "nombre",
    ubicacion: "ubicacion",
    capacidad: "capacidad",
    estado: "estado",
  };

  for (const [key, field] of Object.entries(fieldMap)) {
    if (data[key] !== undefined) {
      updates.push(`${field} = ?`);
      params.push(data[key]);
    }
  }

  if (updates.length === 0) return false;

  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);

  const [result] = await pool.query(`UPDATE salones SET ${updates.join(", ")} WHERE id = ?`, params);
  return result.affectedRows > 0;
};

const deleteSalon = async (id) => {
  const [result] = await pool.query(`DELETE FROM salones WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

module.exports = {
  create,
  deleteSalon,
  findAll,
  findById,
  update,
};
