const pool = require("../config/db");

const baseSelect = `SELECT
  e.id,
  u.id AS usuario_id,
  e.persona_id,
  e.curso_id,
  p.nombres,
  p.apellidos,
  p.documento,
  p.fecha_nacimiento,
  p.genero,
  p.direccion,
  p.telefono AS telefono_acudiente,
  NULL AS nombre_acudiente,
  e.codigo_estudiante,
  e.estado,
  c.nombre AS curso_nombre,
  c.nivel,
  c.jornada,
  e.created_at,
  e.updated_at
FROM estudiantes e
INNER JOIN personas p ON p.id = e.persona_id
LEFT JOIN usuarios u ON u.persona_id = p.id
LEFT JOIN cursos c ON c.id = e.curso_id`;

const findById = async (id) => {
  const [rows] = await pool.query(`${baseSelect} WHERE e.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
};

const findAll = async (estado = null, cursoId = null) => {
  let query = baseSelect;
  const params = [];
  const conditions = [];

  if (estado) {
    conditions.push("e.estado = ?");
    params.push(estado);
  }

  if (cursoId) {
    conditions.push("e.curso_id = ?");
    params.push(cursoId);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += ` ORDER BY p.apellidos, p.nombres ASC`;

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

const ensureRole = async (connection, personaId, roleName) => {
  const [roles] = await connection.query(`SELECT id FROM roles WHERE nombre = ? LIMIT 1`, [roleName]);
  if (!roles[0]) return;

  await connection.query(
    `INSERT IGNORE INTO persona_roles (persona_id, rol_id, estado)
    VALUES (?, ?, 'activo')`,
    [personaId, roles[0].id]
  );
};

const create = async (estudianteData) => {
  const {
    usuarioId = null,
    cursoId,
    nombres,
    apellidos,
    documento,
    correo = null,
    fechaNacimiento = null,
    genero = null,
    direccion = null,
    telefonoAcudiente = null,
  } = estudianteData;

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
        `INSERT INTO personas
          (nombres, apellidos, documento, correo, fecha_nacimiento, genero, direccion, telefono, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'activo')`,
        [nombres, apellidos, documento, correo, fechaNacimiento, genero, direccion, telefonoAcudiente]
      );
      personaId = personaResult.insertId;
    } else {
      await connection.query(
        `UPDATE personas
        SET nombres = ?, apellidos = ?, documento = ?, correo = ?, fecha_nacimiento = ?, genero = ?, direccion = ?, telefono = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [nombres, apellidos, documento, correo, fechaNacimiento, genero, direccion, telefonoAcudiente, personaId]
      );
    }

    const [result] = await connection.query(
      `INSERT INTO estudiantes (persona_id, curso_id, estado)
      VALUES (?, ?, 'activo')`,
      [personaId, cursoId]
    );

    await ensureRole(connection, personaId, "estudiante");
    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const update = async (id, estudianteData) => {
  const current = await findById(id);
  if (!current) return false;

  const personaUpdates = [];
  const personaParams = [];
  const estudianteUpdates = [];
  const estudianteParams = [];

  const personaFieldMap = {
    nombres: "nombres",
    apellidos: "apellidos",
    documento: "documento",
    fechaNacimiento: "fecha_nacimiento",
    genero: "genero",
    direccion: "direccion",
    telefonoAcudiente: "telefono",
  };

  for (const [key, dbField] of Object.entries(personaFieldMap)) {
    if (estudianteData[key] !== undefined) {
      personaUpdates.push(`${dbField} = ?`);
      personaParams.push(estudianteData[key]);
    }
  }

  if (estudianteData.cursoId !== undefined) {
    estudianteUpdates.push("curso_id = ?");
    estudianteParams.push(estudianteData.cursoId);
  }

  if (estudianteData.estado !== undefined) {
    estudianteUpdates.push("estado = ?");
    estudianteParams.push(estudianteData.estado);
  }

  if (personaUpdates.length === 0 && estudianteUpdates.length === 0) return null;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    if (personaUpdates.length > 0) {
      personaUpdates.push("updated_at = CURRENT_TIMESTAMP");
      personaParams.push(current.persona_id);
      await connection.query(`UPDATE personas SET ${personaUpdates.join(", ")} WHERE id = ?`, personaParams);
    }

    if (estudianteUpdates.length > 0) {
      estudianteUpdates.push("updated_at = CURRENT_TIMESTAMP");
      estudianteParams.push(id);
      await connection.query(`UPDATE estudiantes SET ${estudianteUpdates.join(", ")} WHERE id = ?`, estudianteParams);
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

const deleteEstudiante = async (id) => {
  const [result] = await pool.query(`DELETE FROM estudiantes WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

module.exports = {
  findById,
  findAll,
  findByDocumento,
  create,
  update,
  deleteEstudiante,
};
