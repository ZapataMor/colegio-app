const pool = require("../config/db");

const ESTADOS_CURSO = ["activo", "inactivo"];

const normalizeNomenclature = (value) => String(value || "").trim().toUpperCase();

const buildFullName = (grade, nomenclature) => {
  const base = grade.numeric_level || grade.nombre;
  return `${String(base).trim()}${normalizeNomenclature(nomenclature)}`;
};

const baseSelect = `
  SELECT
    c.id,
    c.grade_id,
    c.nomenclature,
    COALESCE(c.full_name, c.nombre) AS full_name,
    COALESCE(c.full_name, c.nombre) AS nombre,
    c.nivel,
    c.jornada,
    c.max_students,
    c.estado,
    c.created_at,
    c.updated_at,
    g.nombre AS grado_nombre,
    g.numeric_level,
    g.education_level,
    COUNT(DISTINCT CASE WHEN e.estado = 'activo' THEN e.id END) AS estudiantes_actuales,
    GREATEST(COALESCE(c.max_students, 0) - COUNT(DISTINCT CASE WHEN e.estado = 'activo' THEN e.id END), 0) AS cupos_disponibles
  FROM cursos c
  LEFT JOIN grados g ON g.id = c.grade_id
  LEFT JOIN estudiantes e ON e.curso_id = c.id
`;

const findAll = async ({ gradeId = null, estado = null } = {}) => {
  const params = [];
  const conditions = [];

  if (gradeId) {
    conditions.push("c.grade_id = ?");
    params.push(gradeId);
  }

  if (estado) {
    conditions.push("c.estado = ?");
    params.push(estado);
  }

  let query = baseSelect;
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += `
    GROUP BY c.id
    ORDER BY COALESCE(g.numeric_level, 999), COALESCE(c.full_name, c.nombre) ASC
  `;

  const [rows] = await pool.query(query, params);
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.query(
    `${baseSelect}
     WHERE c.id = ?
     GROUP BY c.id
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const findStudents = async (courseId) => {
  const [rows] = await pool.query(
    `SELECT
       e.id,
       e.persona_id,
       e.codigo_estudiante,
       e.estado,
       e.created_at AS fecha_asignacion,
       p.nombres,
       p.apellidos,
       p.documento,
       p.correo
     FROM estudiantes e
     INNER JOIN personas p ON p.id = e.persona_id
     WHERE e.curso_id = ?
     ORDER BY p.apellidos ASC, p.nombres ASC`,
    [courseId]
  );

  return rows;
};

const findDuplicateNomenclature = async (gradeId, nomenclature, excludeId = null) => {
  const params = [gradeId, normalizeNomenclature(nomenclature)];
  let query = "SELECT id FROM cursos WHERE grade_id = ? AND UPPER(nomenclature) = ?";

  if (excludeId) {
    query += " AND id <> ?";
    params.push(excludeId);
  }

  query += " LIMIT 1";

  const [rows] = await pool.query(query, params);
  return rows[0] || null;
};

const findDuplicateFullName = async (fullName, excludeId = null) => {
  const params = [fullName.trim()];
  let query = "SELECT id FROM cursos WHERE LOWER(COALESCE(full_name, nombre)) = LOWER(?)";

  if (excludeId) {
    query += " AND id <> ?";
    params.push(excludeId);
  }

  query += " LIMIT 1";

  const [rows] = await pool.query(query, params);
  return rows[0] || null;
};

const create = async ({ grade, nomenclature, maxStudents, estado = "activo" }) => {
  const cleanNomenclature = normalizeNomenclature(nomenclature);
  const fullName = buildFullName(grade, cleanNomenclature);
  const nivel = grade.education_level || "Sin nivel";

  const [result] = await pool.query(
    `INSERT INTO cursos (grade_id, nomenclature, full_name, nombre, nivel, max_students, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [grade.id, cleanNomenclature, fullName, fullName, nivel, maxStudents, estado]
  );

  return result.insertId;
};

const update = async (id, { grade, nomenclature, maxStudents, estado }) => {
  const current = await findById(id);
  if (!current) return false;

  const cleanNomenclature =
    nomenclature !== undefined ? normalizeNomenclature(nomenclature) : current.nomenclature;
  const targetGrade = grade || {
    id: current.grade_id,
    nombre: current.grado_nombre,
    numeric_level: current.numeric_level,
    education_level: current.education_level,
  };
  const fullName = buildFullName(targetGrade, cleanNomenclature);
  const updates = [
    "grade_id = ?",
    "nomenclature = ?",
    "full_name = ?",
    "nombre = ?",
    "nivel = ?",
  ];
  const params = [
    targetGrade.id,
    cleanNomenclature,
    fullName,
    fullName,
    targetGrade.education_level || current.nivel || "Sin nivel",
  ];

  if (maxStudents !== undefined) {
    updates.push("max_students = ?");
    params.push(maxStudents);
  }

  if (estado !== undefined) {
    updates.push("estado = ?");
    params.push(estado);
  }

  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);

  const [result] = await pool.query(`UPDATE cursos SET ${updates.join(", ")} WHERE id = ?`, params);
  return result.affectedRows > 0;
};

const countStudents = async (courseId, onlyActive = false) => {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total FROM estudiantes WHERE curso_id = ?${onlyActive ? " AND estado = 'activo'" : ""}`,
    [courseId]
  );

  return Number(rows[0]?.total || 0);
};

const deleteCourse = async (id) => {
  const [result] = await pool.query("DELETE FROM cursos WHERE id = ?", [id]);
  return result.affectedRows > 0;
};

module.exports = {
  ESTADOS_CURSO,
  buildFullName,
  countStudents,
  create,
  deleteCourse,
  findAll,
  findById,
  findDuplicateFullName,
  findDuplicateNomenclature,
  findStudents,
  normalizeNomenclature,
  update,
};
