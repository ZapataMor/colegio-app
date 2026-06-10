const pool = require("../config/db");

const baseSelect = `SELECT
  c.id,
  c.titulo,
  c.resumen,
  c.contenido,
  c.prioridad,
  c.audiencia,
  c.curso_id,
  c.publicado_por_persona_id,
  c.fecha_publicacion,
  c.fecha_expiracion,
  c.estado,
  c.created_at,
  c.updated_at,
  cu.nombre AS curso_nombre,
  CONCAT(p.nombres, ' ', p.apellidos) AS publicado_por_nombre
FROM comunicados c
LEFT JOIN cursos cu ON cu.id = c.curso_id
LEFT JOIN personas p ON p.id = c.publicado_por_persona_id`;

const findAll = async ({
  audiencia = null,
  cursoId = null,
  estado = null,
  q = null,
  prioridad = null,
  limit = 50,
} = {}) => {
  let query = baseSelect;
  const conditions = [];
  const params = [];

  if (audiencia) {
    conditions.push("(c.audiencia = ? OR c.audiencia = 'todos')");
    params.push(audiencia);
  }

  if (cursoId) {
    conditions.push("(c.curso_id IS NULL OR c.curso_id = ?)");
    params.push(cursoId);
  }

  if (estado) {
    conditions.push("c.estado = ?");
    params.push(estado);
  }

  if (prioridad) {
    conditions.push("c.prioridad = ?");
    params.push(prioridad);
  }

  if (q) {
    const term = `%${q}%`;
    conditions.push(`(
      c.titulo LIKE ? OR
      c.resumen LIKE ? OR
      c.contenido LIKE ?
    )`);
    params.push(term, term, term);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += ` ORDER BY
    FIELD(c.prioridad, 'urgente', 'alta', 'media', 'baja'),
    c.fecha_publicacion DESC
    LIMIT ?`;
  params.push(Number(limit) || 50);

  const [rows] = await pool.query(query, params);
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.query(`${baseSelect} WHERE c.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
};

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO comunicados
      (titulo, resumen, contenido, prioridad, audiencia, curso_id, publicado_por_persona_id, fecha_publicacion, fecha_expiracion, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.titulo,
      data.resumen || null,
      data.contenido,
      data.prioridad || "media",
      data.audiencia || "todos",
      data.cursoId || null,
      data.publicadoPorPersonaId || null,
      data.fechaPublicacion || new Date(),
      data.fechaExpiracion || null,
      data.estado || "publicado",
    ]
  );

  return result.insertId;
};

const update = async (id, data) => {
  const fieldMap = {
    titulo: "titulo",
    resumen: "resumen",
    contenido: "contenido",
    prioridad: "prioridad",
    audiencia: "audiencia",
    cursoId: "curso_id",
    publicadoPorPersonaId: "publicado_por_persona_id",
    fechaPublicacion: "fecha_publicacion",
    fechaExpiracion: "fecha_expiracion",
    estado: "estado",
  };

  const updates = [];
  const params = [];

  for (const [key, dbField] of Object.entries(fieldMap)) {
    if (data[key] !== undefined) {
      updates.push(`${dbField} = ?`);
      params.push(data[key]);
    }
  }

  if (updates.length === 0) return null;

  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);

  const [result] = await pool.query(
    `UPDATE comunicados SET ${updates.join(", ")} WHERE id = ?`,
    params
  );

  return result.affectedRows > 0;
};

const deleteComunicado = async (id) => {
  const [result] = await pool.query(`DELETE FROM comunicados WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

const getCatalog = async () => {
  const [cursos] = await pool.query(
    `SELECT id, nombre, nivel FROM cursos WHERE estado = 'activo' ORDER BY nombre ASC`
  );
  return { cursos };
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  deleteComunicado,
  getCatalog,
};
