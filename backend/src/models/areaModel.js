const pool = require("../config/db");

const findAll = async ({ q = null, estado = null } = {}) => {
  const conditions = [];
  const params = [];

  if (estado) {
    conditions.push("ar.estado = ?");
    params.push(estado);
  }

  if (q) {
    conditions.push("ar.nombre LIKE ?");
    params.push(`%${q}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `SELECT
       ar.id,
       ar.nombre,
       ar.descripcion,
       ar.estado,
       ar.created_at,
       ar.updated_at,
       COUNT(a.id) AS asignaturas_count
     FROM areas ar
     LEFT JOIN asignaturas a ON a.area_id = ar.id
     ${where}
     GROUP BY ar.id
     ORDER BY ar.nombre ASC`,
    params
  );
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT id, nombre, descripcion, estado, created_at, updated_at
     FROM areas
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

const findByNombre = async (nombre, excludeId = null) => {
  const params = [nombre];
  let sql = `SELECT id FROM areas WHERE nombre = ?`;
  if (excludeId) {
    sql += ` AND id <> ?`;
    params.push(excludeId);
  }
  const [rows] = await pool.query(`${sql} LIMIT 1`, params);
  return rows[0] || null;
};

const create = async ({ nombre, descripcion = null, estado = "activo" }) => {
  const [result] = await pool.query(
    `INSERT INTO areas (nombre, descripcion, estado) VALUES (?, ?, ?)`,
    [nombre, descripcion, estado]
  );
  return result.insertId;
};

const update = async (id, data) => {
  const updates = [];
  const params = [];
  const fieldMap = {
    nombre: "nombre",
    descripcion: "descripcion",
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

  const [result] = await pool.query(
    `UPDATE areas SET ${updates.join(", ")} WHERE id = ?`,
    params
  );
  return result.affectedRows > 0;
};

const deleteArea = async (id) => {
  const [result] = await pool.query(`DELETE FROM areas WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

// El FK asignaturas.area_id es ON DELETE RESTRICT: no se puede borrar un area
// que tenga asignaturas asociadas.
const countReferences = async (id) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM asignaturas WHERE area_id = ?`,
    [id]
  );
  return Number(rows[0]?.total || 0);
};

module.exports = {
  findAll,
  findById,
  findByNombre,
  create,
  update,
  deleteArea,
  countReferences,
};
