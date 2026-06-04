const pool = require("../config/db");

const baseSelect = `SELECT
  p.id,
  p.nombres,
  p.apellidos,
  p.tipo_documento,
  p.documento,
  p.fecha_nacimiento,
  p.genero,
  p.telefono,
  p.correo,
  p.direccion,
  p.estado,
  p.created_at,
  p.updated_at,
  u.id AS usuario_id,
  (SELECT GROUP_CONCAT(DISTINCT r.nombre ORDER BY r.nombre SEPARATOR ', ')
   FROM persona_roles pr
   INNER JOIN roles r ON r.id = pr.rol_id
   WHERE pr.persona_id = p.id AND pr.estado = 'activo') AS roles,
  (SELECT id FROM estudiantes WHERE persona_id = p.id LIMIT 1) AS estudiante_id,
  (SELECT id FROM profesores WHERE persona_id = p.id LIMIT 1) AS profesor_id,
  (SELECT id FROM acudientes WHERE persona_id = p.id LIMIT 1) AS acudiente_id`;

const findById = async (id) => {
  const [rows] = await pool.query(`${baseSelect} FROM personas p LEFT JOIN usuarios u ON u.persona_id = p.id WHERE p.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
};

const findAll = async (estado = null) => {
  let query = `${baseSelect} FROM personas p LEFT JOIN usuarios u ON u.persona_id = p.id`;
  const params = [];

  if (estado) {
    query += ` WHERE p.estado = ?`;
    params.push(estado);
  }

  query += ` ORDER BY p.apellidos, p.nombres ASC`;

  const [rows] = await pool.query(query, params);
  return rows;
};

const findDisponiblesParaUsuario = async (rolNombre) => {
  let profileJoin = "";
  const params = [];

  switch (rolNombre) {
    case "profesor":
      profileJoin = "INNER JOIN profesores prf ON prf.persona_id = p.id AND prf.estado = 'activo'";
      break;
    case "estudiante":
      profileJoin = "INNER JOIN estudiantes est ON est.persona_id = p.id AND est.estado = 'activo'";
      break;
    case "acudiente":
      profileJoin = "INNER JOIN acudientes acu ON acu.persona_id = p.id AND acu.estado = 'activo'";
      break;
    case "administrador":
      profileJoin = "";
      break;
    default:
      return [];
  }

  const query = `SELECT
    p.id,
    p.nombres,
    p.apellidos,
    p.tipo_documento,
    p.documento,
    p.correo,
    p.telefono,
    p.estado
  FROM personas p
  ${profileJoin}
  LEFT JOIN usuarios u ON u.persona_id = p.id
  WHERE u.id IS NULL AND p.estado = 'activo' AND p.correo IS NOT NULL
  ORDER BY p.apellidos, p.nombres ASC`;

  const [rows] = await pool.query(query, params);
  return rows;
};

const findByCorreo = async (correo) => {
  const [rows] = await pool.query(`SELECT id FROM personas WHERE correo = ? LIMIT 1`, [correo]);
  return rows[0] || null;
};

const findByDocumento = async (documento) => {
  const [rows] = await pool.query(`SELECT id FROM personas WHERE documento = ? LIMIT 1`, [documento]);
  return rows[0] || null;
};

const hasProfileForRole = async (personaId, rolNombre) => {
  const tables = {
    profesor: "profesores",
    estudiante: "estudiantes",
    acudiente: "acudientes",
  };

  if (rolNombre === "administrador") return true;

  const table = tables[rolNombre];
  if (!table) return false;

  const [rows] = await pool.query(`SELECT id FROM ${table} WHERE persona_id = ? LIMIT 1`, [personaId]);
  return !!rows[0];
};

module.exports = {
  findById,
  findAll,
  findDisponiblesParaUsuario,
  findByCorreo,
  findByDocumento,
  hasProfileForRole,
};
