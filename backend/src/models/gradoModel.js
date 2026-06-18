const pool = require("../config/db");

const ESTADOS_GRADO = ["activo", "inactivo"];

const selectWithStats = `
  SELECT
    g.id,
    g.nombre,
    g.numeric_level,
    g.education_level,
    g.status,
    g.created_at,
    g.updated_at,
    COUNT(DISTINCT c.id) AS cursos_count,
    COUNT(DISTINCT CASE WHEN e.estado = 'activo' THEN e.id END) AS total_estudiantes
  FROM grados g
  LEFT JOIN cursos c ON c.grade_id = g.id
  LEFT JOIN estudiantes e ON e.curso_id = c.id
`;

const findAll = async ({ status = null } = {}) => {
  const params = [];
  let query = selectWithStats;

  if (status) {
    query += " WHERE g.status = ?";
    params.push(status);
  }

  query += `
    GROUP BY g.id
    ORDER BY COALESCE(g.numeric_level, 999), g.nombre ASC
  `;

  const [rows] = await pool.query(query, params);
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.query(
    `${selectWithStats}
     WHERE g.id = ?
     GROUP BY g.id
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const findByName = async (nombre, excludeId = null) => {
  const params = [nombre.trim()];
  let query = "SELECT id FROM grados WHERE LOWER(nombre) = LOWER(?)";

  if (excludeId) {
    query += " AND id <> ?";
    params.push(excludeId);
  }

  query += " LIMIT 1";

  const [rows] = await pool.query(query, params);
  return rows[0] || null;
};

const findByNumericLevel = async (numericLevel, excludeId = null) => {
  if (!numericLevel) return null;

  const params = [numericLevel];
  let query = "SELECT id FROM grados WHERE numeric_level = ?";

  if (excludeId) {
    query += " AND id <> ?";
    params.push(excludeId);
  }

  query += " LIMIT 1";

  const [rows] = await pool.query(query, params);
  return rows[0] || null;
};

const create = async ({ nombre, numericLevel = null, educationLevel = null, status = "activo" }) => {
  const [result] = await pool.query(
    `INSERT INTO grados (nombre, numeric_level, education_level, status)
     VALUES (?, ?, ?, ?)`,
    [nombre, numericLevel, educationLevel, status]
  );

  return result.insertId;
};

const update = async (id, data) => {
  const updates = [];
  const params = [];
  const fieldMap = {
    nombre: "nombre",
    numericLevel: "numeric_level",
    educationLevel: "education_level",
    status: "status",
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

  const [result] = await pool.query(`UPDATE grados SET ${updates.join(", ")} WHERE id = ?`, params);
  return result.affectedRows > 0;
};

const countActiveCourses = async (gradeId) => {
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS total FROM cursos WHERE grade_id = ? AND estado = 'activo'",
    [gradeId]
  );
  return Number(rows[0]?.total || 0);
};

const deleteGrade = async (id) => {
  const [result] = await pool.query("DELETE FROM grados WHERE id = ?", [id]);
  return result.affectedRows > 0;
};

module.exports = {
  ESTADOS_GRADO,
  countActiveCourses,
  create,
  deleteGrade,
  findAll,
  findById,
  findByName,
  findByNumericLevel,
  update,
};
