const pool = require("../config/db");

const baseSelect = `SELECT
  pr.id,
  u.id AS usuario_id,
  pr.persona_id,
  p.nombres,
  p.apellidos,
  p.documento,
  p.correo,
  p.telefono,
  pr.especialidad,
  pr.titulo,
  pr.estado,
  pr.created_at,
  pr.updated_at
FROM profesores pr
INNER JOIN personas p ON p.id = pr.persona_id
LEFT JOIN usuarios u ON u.persona_id = p.id`;

const findById = async (id) => {
  const [rows] = await pool.query(`${baseSelect} WHERE pr.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
};

const findByPersonaId = async (personaId) => {
  const [rows] = await pool.query(`${baseSelect} WHERE pr.persona_id = ? AND pr.estado = 'activo' LIMIT 1`, [personaId]);
  return rows[0] || null;
};

const findAll = async ({ estado = null, q = null, limit = null } = {}) => {
  let query = baseSelect;
  const params = [];
  const conditions = [];

  if (estado) {
    conditions.push("pr.estado = ?");
    params.push(estado);
  }

  if (q) {
    const term = `%${q}%`;
    conditions.push(`(
      p.nombres LIKE ? OR
      p.apellidos LIKE ? OR
      p.documento LIKE ? OR
      p.correo LIKE ? OR
      pr.especialidad LIKE ? OR
      CONCAT(p.nombres, ' ', p.apellidos) LIKE ?
    )`);
    params.push(term, term, term, term, term, term);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += ` ORDER BY p.apellidos, p.nombres ASC`;

  if (limit) {
    query += ` LIMIT ?`;
    params.push(Number(limit));
  }

  const [rows] = await pool.query(query, params);
  return rows;
};

const findByDocumento = async (documento) => {
  const [rows] = await pool.query(
    `${baseSelect} WHERE p.documento = ? LIMIT 1`,
    [documento]
  );

  return rows[0] || null;
};

const findByCorreo = async (correo) => {
  const [rows] = await pool.query(
    `${baseSelect} WHERE p.correo = ? LIMIT 1`,
    [correo]
  );

  return rows[0] || null;
};

const ensureRole = async (connection, personaId, roleName) => {
  const [roles] = await connection.query(`SELECT id FROM roles WHERE nombre = ? LIMIT 1`, [roleName]);
  if (!roles[0]) return;

  await connection.query(
    `INSERT IGNORE INTO persona_roles (persona_id, rol_id, estado)
    VALUES (?, ?, 'activo')`,
    [personaId, roles[0].id]
  );
};

const create = async (profesorData) => {
  const {
    usuarioId = null,
    nombres,
    apellidos,
    documento,
    correo = null,
    telefono = null,
    especialidad = null,
    titulo = null,
  } = profesorData;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let personaId = null;
    if (usuarioId) {
      const [users] = await connection.query(`SELECT persona_id FROM usuarios WHERE id = ? LIMIT 1`, [usuarioId]);
      personaId = users[0]?.persona_id || null;
    }

    if (!personaId) {
      const [personaResult] = await connection.query(
        `INSERT INTO personas (nombres, apellidos, documento, correo, telefono, estado)
        VALUES (?, ?, ?, ?, ?, 'activo')`,
        [nombres, apellidos, documento, correo, telefono]
      );
      personaId = personaResult.insertId;
    } else {
      await connection.query(
        `UPDATE personas
        SET nombres = ?, apellidos = ?, documento = ?, correo = ?, telefono = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [nombres, apellidos, documento, correo, telefono, personaId]
      );
    }

    const [result] = await connection.query(
      `INSERT INTO profesores (persona_id, especialidad, titulo, estado)
      VALUES (?, ?, ?, 'activo')`,
      [personaId, especialidad, titulo]
    );

    await ensureRole(connection, personaId, "profesor");
    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const update = async (id, profesorData) => {
  const current = await findById(id);
  if (!current) return false;

  const personaUpdates = [];
  const personaParams = [];
  const profesorUpdates = [];
  const profesorParams = [];

  const personaFieldMap = {
    nombres: "nombres",
    apellidos: "apellidos",
    documento: "documento",
    correo: "correo",
    telefono: "telefono",
  };

  for (const [key, dbField] of Object.entries(personaFieldMap)) {
    if (profesorData[key] !== undefined) {
      personaUpdates.push(`${dbField} = ?`);
      personaParams.push(profesorData[key]);
    }
  }

  if (profesorData.especialidad !== undefined) {
    profesorUpdates.push("especialidad = ?");
    profesorParams.push(profesorData.especialidad);
  }

  if (profesorData.titulo !== undefined) {
    profesorUpdates.push("titulo = ?");
    profesorParams.push(profesorData.titulo);
  }

  if (profesorData.estado !== undefined) {
    profesorUpdates.push("estado = ?");
    profesorParams.push(profesorData.estado);
  }

  if (personaUpdates.length === 0 && profesorUpdates.length === 0) return null;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    if (personaUpdates.length > 0) {
      personaUpdates.push("updated_at = CURRENT_TIMESTAMP");
      personaParams.push(current.persona_id);
      await connection.query(`UPDATE personas SET ${personaUpdates.join(", ")} WHERE id = ?`, personaParams);
    }

    if (profesorUpdates.length > 0) {
      profesorUpdates.push("updated_at = CURRENT_TIMESTAMP");
      profesorParams.push(id);
      await connection.query(`UPDATE profesores SET ${profesorUpdates.join(", ")} WHERE id = ?`, profesorParams);
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const deleteProfesor = async (id) => {
  const [result] = await pool.query(`DELETE FROM profesores WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

module.exports = {
  findById,
  findByPersonaId,
  findAll,
  findByDocumento,
  findByCorreo,
  create,
  update,
  deleteProfesor,
};
