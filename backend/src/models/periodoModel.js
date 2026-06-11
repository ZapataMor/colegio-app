const pool = require("../config/db");

const findAll = async ({ q = null, estado = null } = {}) => {
  const conditions = [];
  const params = [];

  if (estado) {
    conditions.push("estado = ?");
    params.push(estado);
  }

  if (q) {
    conditions.push("nombre LIKE ?");
    params.push(`%${q}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `SELECT id, nombre, fecha_inicio, fecha_fin, estado, created_at
     FROM periodos_academicos
     ${where}
     ORDER BY fecha_inicio DESC`,
    params
  );

  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT id, nombre, fecha_inicio, fecha_fin, estado FROM periodos_academicos WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

const create = async ({ nombre, fechaInicio, fechaFin, estado = "activo" }) => {
  const [result] = await pool.query(
    `INSERT INTO periodos_academicos (nombre, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, ?)`,
    [nombre.trim(), fechaInicio, fechaFin, estado]
  );
  return result.insertId;
};

const update = async (id, { nombre, fechaInicio, fechaFin, estado }) => {
  const fields = [];
  const params = [];

  if (nombre !== undefined) { fields.push("nombre = ?"); params.push(nombre.trim()); }
  if (fechaInicio !== undefined) { fields.push("fecha_inicio = ?"); params.push(fechaInicio); }
  if (fechaFin !== undefined) { fields.push("fecha_fin = ?"); params.push(fechaFin); }
  if (estado !== undefined) { fields.push("estado = ?"); params.push(estado); }

  if (!fields.length) return null;

  fields.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);

  const [result] = await pool.query(
    `UPDATE periodos_academicos SET ${fields.join(", ")} WHERE id = ?`,
    params
  );

  return result.affectedRows > 0;
};

const deletePeriodo = async (id) => {
  const [result] = await pool.query(`DELETE FROM periodos_academicos WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, create, update, deletePeriodo };
