const pool = require("../config/db");

const baseUserSelect = `SELECT
  u.id,
  u.persona_id,
  p.nombres AS nombre,
  p.apellidos AS apellido,
  p.nombres,
  p.apellidos,
  p.correo,
  p.telefono,
  p.documento,
  u.password_hash,
  u.estado,
  pr.rol_id,
  r.nombre AS rol,
  u.created_at,
  u.updated_at
FROM usuarios u
INNER JOIN personas p ON p.id = u.persona_id
LEFT JOIN persona_roles pr ON pr.persona_id = p.id AND pr.estado = 'activo'
LEFT JOIN roles r ON r.id = pr.rol_id`;

const findByCorreo = async (correo) => {
  const [rows] = await pool.query(
    `${baseUserSelect}
    WHERE p.correo = ?
    ORDER BY pr.id ASC
    LIMIT 1`,
    [correo]
  );

  return rows[0] || null;
};

const findById = async (id) => {
  const [rows] = await pool.query(
    `${baseUserSelect}
    WHERE u.id = ?
    ORDER BY pr.id ASC
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const findAll = async (estado = null) => {
  let query = baseUserSelect;
  const params = [];

  if (estado) {
    query += ` WHERE u.estado = ?`;
    params.push(estado);
  }

  query += ` ORDER BY p.apellidos, p.nombres ASC`;

  const [rows] = await pool.query(query, params);
  return rows;
};

const createUser = async ({ rolId, nombre, apellido, correo, passwordHash, telefono = null, documento = null }) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [personaResult] = await connection.query(
      `INSERT INTO personas (nombres, apellidos, documento, correo, telefono, estado)
      VALUES (?, ?, ?, ?, ?, 'activo')`,
      [nombre, apellido, documento || correo, correo, telefono]
    );

    const personaId = personaResult.insertId;

    const [userResult] = await connection.query(
      `INSERT INTO usuarios (persona_id, password_hash, estado)
      VALUES (?, ?, 'activo')`,
      [personaId, passwordHash]
    );

    await connection.query(
      `INSERT INTO persona_roles (persona_id, rol_id, estado)
      VALUES (?, ?, 'activo')`,
      [personaId, rolId]
    );

    await connection.commit();
    return userResult.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const updateUser = async (id, { nombre, apellido, telefono, estado }) => {
  const user = await findById(id);
  if (!user) return false;

  const personaUpdates = [];
  const personaParams = [];
  const userUpdates = [];
  const userParams = [];

  if (nombre !== undefined) {
    personaUpdates.push("nombres = ?");
    personaParams.push(nombre);
  }
  if (apellido !== undefined) {
    personaUpdates.push("apellidos = ?");
    personaParams.push(apellido);
  }
  if (telefono !== undefined) {
    personaUpdates.push("telefono = ?");
    personaParams.push(telefono);
  }
  if (estado !== undefined) {
    userUpdates.push("estado = ?");
    userParams.push(estado);
  }

  if (personaUpdates.length === 0 && userUpdates.length === 0) return null;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    if (personaUpdates.length > 0) {
      personaUpdates.push("updated_at = CURRENT_TIMESTAMP");
      personaParams.push(user.persona_id);
      await connection.query(
        `UPDATE personas SET ${personaUpdates.join(", ")} WHERE id = ?`,
        personaParams
      );
    }

    if (userUpdates.length > 0) {
      userUpdates.push("updated_at = CURRENT_TIMESTAMP");
      userParams.push(id);
      await connection.query(
        `UPDATE usuarios SET ${userUpdates.join(", ")} WHERE id = ?`,
        userParams
      );
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

const deleteUser = async (id) => {
  const [result] = await pool.query(`DELETE FROM usuarios WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

module.exports = {
  findByCorreo,
  findById,
  findAll,
  createUser,
  updateUser,
  deleteUser,
};
