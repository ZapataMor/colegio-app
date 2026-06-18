const pool = require("../config/db");

const findAll = async ({ q = null, estado = null } = {}) => {
  const conditions = [];
  const params = [];

  if (estado) {
    conditions.push("pa.estado = ?");
    params.push(estado);
  }

  if (q) {
    conditions.push("pa.nombre LIKE ?");
    params.push(`%${q}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `SELECT
       pa.id,
       pa.nombre,
       pa.fecha_inicio,
       pa.fecha_fin,
       pa.estado,
       pa.created_at,
       COUNT(DISTINCT pas.id) AS asignaturas_count
     FROM periodos_academicos pa
     LEFT JOIN periodo_asignaturas pas ON pas.periodo_id = pa.id AND pas.estado = 'activo'
     ${where}
     GROUP BY pa.id, pa.nombre, pa.fecha_inicio, pa.fecha_fin, pa.estado, pa.created_at
     ORDER BY pa.fecha_inicio DESC`,
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

const findAsignaturas = async (periodoId) => {
  const [rows] = await pool.query(
    `SELECT
       pa.id,
       pa.periodo_id,
       pa.asignatura_id,
       pa.estado,
       pa.observacion,
       pa.created_at,
       a.nombre AS asignatura_nombre,
       a.descripcion AS asignatura_descripcion,
       ar.nombre AS area_nombre,
       COUNT(DISTINCT ac.id) AS actividades_count,
       COUNT(DISTINCT n.id) AS notas_count,
       COUNT(DISTINCT asi.id) AS asistencias_count
     FROM periodo_asignaturas pa
     INNER JOIN asignaturas a ON a.id = pa.asignatura_id
     LEFT JOIN areas ar ON ar.id = a.area_id
     LEFT JOIN actividades ac ON ac.periodo_id = pa.periodo_id AND ac.asignatura_id = pa.asignatura_id
     LEFT JOIN notas n ON n.periodo_id = pa.periodo_id AND n.asignatura_id = pa.asignatura_id
     LEFT JOIN periodos_academicos per ON per.id = pa.periodo_id
     LEFT JOIN asistencias asi
       ON asi.asignatura_id = pa.asignatura_id
      AND asi.fecha BETWEEN per.fecha_inicio AND per.fecha_fin
     WHERE pa.periodo_id = ?
     GROUP BY
       pa.id,
       pa.periodo_id,
       pa.asignatura_id,
       pa.estado,
       pa.observacion,
       pa.created_at,
       a.nombre,
       a.descripcion,
       ar.nombre
     ORDER BY a.nombre ASC`,
    [periodoId]
  );
  return rows;
};

const findAsignaturaById = async (id) => {
  const [rows] = await pool.query(
    `SELECT
       pa.id,
       pa.periodo_id,
       pa.asignatura_id,
       pa.estado,
       pa.observacion,
       a.nombre AS asignatura_nombre
     FROM periodo_asignaturas pa
     INNER JOIN asignaturas a ON a.id = pa.asignatura_id
     WHERE pa.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

const asignaturaExists = async (asignaturaId) => {
  const [rows] = await pool.query(
    `SELECT id FROM asignaturas WHERE id = ? AND estado = 'activo' LIMIT 1`,
    [asignaturaId]
  );
  return Boolean(rows[0]);
};

const getAsignaturaUsage = async ({ periodoId, asignaturaId }) => {
  const [[actividades], [notas], [periodoRows]] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) AS total FROM actividades WHERE periodo_id = ? AND asignatura_id = ?`,
      [periodoId, asignaturaId]
    ),
    pool.query(
      `SELECT COUNT(*) AS total FROM notas WHERE periodo_id = ? AND asignatura_id = ?`,
      [periodoId, asignaturaId]
    ),
    pool.query(
      `SELECT fecha_inicio, fecha_fin FROM periodos_academicos WHERE id = ? LIMIT 1`,
      [periodoId]
    ),
  ]);

  let asistenciasTotal = 0;
  const periodo = periodoRows[0];
  if (periodo) {
    const [asistencias] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM asistencias
       WHERE asignatura_id = ?
         AND fecha BETWEEN ? AND ?`,
      [asignaturaId, periodo.fecha_inicio, periodo.fecha_fin]
    );
    asistenciasTotal = Number(asistencias[0]?.total || 0);
  }

  return {
    actividades: Number(actividades[0]?.total || 0),
    notas: Number(notas[0]?.total || 0),
    asistencias: asistenciasTotal,
  };
};

const createAsignatura = async ({ periodoId, asignaturaId, estado = "activo", observacion = null }) => {
  const [result] = await pool.query(
    `INSERT INTO periodo_asignaturas (periodo_id, asignatura_id, estado, observacion)
     VALUES (?, ?, ?, ?)`,
    [periodoId, asignaturaId, estado, observacion]
  );
  return result.insertId;
};

const updateAsignatura = async (id, { asignaturaId, estado, observacion }) => {
  const fields = [];
  const params = [];

  if (asignaturaId !== undefined) { fields.push("asignatura_id = ?"); params.push(asignaturaId); }
  if (estado !== undefined) { fields.push("estado = ?"); params.push(estado); }
  if (observacion !== undefined) { fields.push("observacion = ?"); params.push(observacion); }

  if (!fields.length) return null;

  fields.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);

  const [result] = await pool.query(
    `UPDATE periodo_asignaturas SET ${fields.join(", ")} WHERE id = ?`,
    params
  );

  return result.affectedRows > 0;
};

const deleteAsignatura = async (id) => {
  const [result] = await pool.query(`DELETE FROM periodo_asignaturas WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

module.exports = {
  asignaturaExists,
  create,
  createAsignatura,
  deleteAsignatura,
  deletePeriodo,
  findAll,
  findAsignaturaById,
  findAsignaturas,
  findById,
  getAsignaturaUsage,
  update,
  updateAsignatura,
};
