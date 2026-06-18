const pool = require("../config/db");

const SELECT_BASE = `
  SELECT
    a.id,
    a.area_id,
    a.nombre,
    a.descripcion,
    a.estado,
    a.created_at,
    a.updated_at,
    ar.nombre AS area_nombre
  FROM asignaturas a
  INNER JOIN areas ar ON ar.id = a.area_id
`;

const findAll = async ({ q = null, estado = null, areaId = null } = {}) => {
  const conditions = [];
  const params = [];

  if (estado) {
    conditions.push("a.estado = ?");
    params.push(estado);
  }

  if (areaId) {
    conditions.push("a.area_id = ?");
    params.push(areaId);
  }

  if (q) {
    conditions.push("(a.nombre LIKE ? OR ar.nombre LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `${SELECT_BASE} ${where} ORDER BY ar.nombre ASC, a.nombre ASC`,
    params
  );
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.query(`${SELECT_BASE} WHERE a.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
};

const findByNombre = async (nombre, excludeId = null) => {
  const params = [nombre];
  let sql = `SELECT id FROM asignaturas WHERE nombre = ?`;
  if (excludeId) {
    sql += ` AND id <> ?`;
    params.push(excludeId);
  }
  const [rows] = await pool.query(`${sql} LIMIT 1`, params);
  return rows[0] || null;
};

const create = async ({ areaId, nombre, descripcion = null, estado = "activo" }) => {
  const [result] = await pool.query(
    `INSERT INTO asignaturas (area_id, nombre, descripcion, estado)
     VALUES (?, ?, ?, ?)`,
    [areaId, nombre, descripcion, estado]
  );
  return result.insertId;
};

const update = async (id, data) => {
  const updates = [];
  const params = [];
  const fieldMap = {
    areaId: "area_id",
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
    `UPDATE asignaturas SET ${updates.join(", ")} WHERE id = ?`,
    params
  );
  return result.affectedRows > 0;
};

const deleteAsignatura = async (id) => {
  const [result] = await pool.query(`DELETE FROM asignaturas WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

// Cuenta cuantos registros academicos dependen de la asignatura para evitar
// borrarla cuando esta en uso (los FK son ON DELETE RESTRICT).
const countReferences = async (id) => {
  const [rows] = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM horarios WHERE asignatura_id = ?) AS horarios,
      (SELECT COUNT(*) FROM notas WHERE asignatura_id = ?) AS notas,
      (SELECT COUNT(*) FROM actividades WHERE asignatura_id = ?) AS actividades,
      (SELECT COUNT(*) FROM asistencias WHERE asignatura_id = ?) AS asistencias,
      (SELECT COUNT(*) FROM periodo_asignaturas WHERE asignatura_id = ?) AS periodos,
      (SELECT COUNT(*) FROM profesor_asignatura WHERE asignatura_id = ?) AS profesores`,
    [id, id, id, id, id, id]
  );
  const r = rows[0] || {};
  return Object.values(r).reduce((sum, value) => sum + Number(value || 0), 0);
};

const listAreas = async () => {
  const [rows] = await pool.query(
    `SELECT id, nombre, estado FROM areas WHERE estado = 'activo' ORDER BY nombre ASC`
  );
  return rows;
};

const areaExists = async (areaId) => {
  const [rows] = await pool.query(
    `SELECT id FROM areas WHERE id = ? LIMIT 1`,
    [areaId]
  );
  return Boolean(rows[0]);
};

module.exports = {
  findAll,
  findById,
  findByNombre,
  create,
  update,
  deleteAsignatura,
  countReferences,
  listAreas,
  areaExists,
};
