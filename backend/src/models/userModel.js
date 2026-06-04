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
  p.tipo_documento,
  u.password_hash,
  u.estado,
  u.created_at,
  u.updated_at,
  (SELECT GROUP_CONCAT(DISTINCT r.nombre ORDER BY r.nombre SEPARATOR ', ')
   FROM persona_roles pr
   INNER JOIN roles r ON r.id = pr.rol_id
   WHERE pr.persona_id = p.id AND pr.estado = 'activo') AS roles,
  (SELECT r.nombre
   FROM persona_roles pr
   INNER JOIN roles r ON r.id = pr.rol_id
   WHERE pr.persona_id = p.id AND pr.estado = 'activo'
   ORDER BY pr.id ASC
   LIMIT 1) AS rol,
  (SELECT pr.rol_id
   FROM persona_roles pr
   WHERE pr.persona_id = p.id AND pr.estado = 'activo'
   ORDER BY pr.id ASC
   LIMIT 1) AS rol_id
FROM usuarios u
INNER JOIN personas p ON p.id = u.persona_id`;

const findByCorreo = async (correo) => {
  const [rows] = await pool.query(
    `${baseUserSelect}
    WHERE p.correo = ?
    LIMIT 1`,
    [correo]
  );

  return rows[0] || null;
};

const findById = async (id) => {
  const [rows] = await pool.query(`${baseUserSelect} WHERE u.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
};

const findByPersonaId = async (personaId) => {
  const [rows] = await pool.query(`${baseUserSelect} WHERE u.persona_id = ? LIMIT 1`, [personaId]);
  return rows[0] || null;
};

const findAll = async ({ estado = null, rol = null, q = null } = {}) => {
  let query = baseUserSelect;
  const params = [];
  const conditions = [];

  if (estado) {
    conditions.push("u.estado = ?");
    params.push(estado);
  }

  if (rol) {
    conditions.push(`EXISTS (
      SELECT 1 FROM persona_roles pr
      INNER JOIN roles r ON r.id = pr.rol_id
      WHERE pr.persona_id = p.id AND r.nombre = ? AND pr.estado = 'activo'
    )`);
    params.push(rol);
  }

  if (q) {
    const term = `%${q}%`;
    conditions.push(`(
      p.nombres LIKE ? OR p.apellidos LIKE ? OR p.correo LIKE ? OR p.documento LIKE ?
    )`);
    params.push(term, term, term, term);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += ` ORDER BY p.apellidos, p.nombres ASC`;

  const [rows] = await pool.query(query, params);
  return rows;
};

const getRolesForPersona = async (personaId) => {
  const [rows] = await pool.query(
    `SELECT r.id, r.nombre
    FROM persona_roles pr
    INNER JOIN roles r ON r.id = pr.rol_id
    WHERE pr.persona_id = ? AND pr.estado = 'activo'
    ORDER BY pr.id ASC`,
    [personaId]
  );
  return rows;
};

const createUserFromPersona = async ({ personaId, rolId, passwordHash }) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [personas] = await connection.query(
      `SELECT id, correo, estado FROM personas WHERE id = ? LIMIT 1`,
      [personaId]
    );

    if (!personas[0]) {
      throw Object.assign(new Error("Persona no encontrada."), { statusCode: 404 });
    }

    if (personas[0].estado !== "activo") {
      throw Object.assign(new Error("La persona no está activa."), { statusCode: 400 });
    }

    if (!personas[0].correo) {
      throw Object.assign(new Error("La persona debe tener correo para crear acceso."), {
        statusCode: 400,
      });
    }

    const [existingUser] = await connection.query(
      `SELECT id FROM usuarios WHERE persona_id = ? LIMIT 1`,
      [personaId]
    );

    if (existingUser[0]) {
      throw Object.assign(new Error("Esta persona ya tiene un usuario de acceso."), {
        statusCode: 409,
      });
    }

    const [roles] = await connection.query(`SELECT nombre FROM roles WHERE id = ? LIMIT 1`, [rolId]);

    if (!roles[0]) {
      throw Object.assign(new Error("Rol no encontrado."), { statusCode: 400 });
    }

    const [userResult] = await connection.query(
      `INSERT INTO usuarios (persona_id, password_hash, estado) VALUES (?, ?, 'activo')`,
      [personaId, passwordHash]
    );

    await connection.query(
      `INSERT INTO persona_roles (persona_id, rol_id, estado)
      VALUES (?, ?, 'activo')
      ON DUPLICATE KEY UPDATE estado = 'activo', updated_at = CURRENT_TIMESTAMP`,
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

const updateUser = async (
  id,
  {
    nombres,
    apellidos,
    correo,
    telefono,
    documento,
    tipoDocumento,
    estado,
    rolId,
    passwordHash,
  }
) => {
  const user = await findById(id);
  if (!user) return false;

  const personaUpdates = [];
  const personaParams = [];
  const userUpdates = [];
  const userParams = [];

  if (nombres !== undefined) {
    personaUpdates.push("nombres = ?");
    personaParams.push(nombres);
  }
  if (apellidos !== undefined) {
    personaUpdates.push("apellidos = ?");
    personaParams.push(apellidos);
  }
  if (correo !== undefined) {
    personaUpdates.push("correo = ?");
    personaParams.push(correo);
  }
  if (telefono !== undefined) {
    personaUpdates.push("telefono = ?");
    personaParams.push(telefono);
  }
  if (documento !== undefined) {
    personaUpdates.push("documento = ?");
    personaParams.push(documento);
  }
  if (tipoDocumento !== undefined) {
    personaUpdates.push("tipo_documento = ?");
    personaParams.push(tipoDocumento);
  }
  if (estado !== undefined) {
    userUpdates.push("estado = ?");
    userParams.push(estado);
  }
  if (passwordHash !== undefined) {
    userUpdates.push("password_hash = ?");
    userParams.push(passwordHash);
  }

  if (
    personaUpdates.length === 0 &&
    userUpdates.length === 0 &&
    rolId === undefined
  ) {
    return null;
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    if (correo !== undefined) {
      const [dup] = await connection.query(
        `SELECT id FROM personas WHERE correo = ? AND id != ? LIMIT 1`,
        [correo, user.persona_id]
      );
      if (dup[0]) {
        throw Object.assign(new Error("El correo ya está en uso por otra persona."), {
          statusCode: 409,
        });
      }
    }

    if (documento !== undefined) {
      const [dup] = await connection.query(
        `SELECT id FROM personas WHERE documento = ? AND id != ? LIMIT 1`,
        [documento, user.persona_id]
      );
      if (dup[0]) {
        throw Object.assign(new Error("El documento ya está registrado."), { statusCode: 409 });
      }
    }

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
      await connection.query(`UPDATE usuarios SET ${userUpdates.join(", ")} WHERE id = ?`, userParams);
    }

    if (rolId !== undefined) {
      await connection.query(
        `INSERT INTO persona_roles (persona_id, rol_id, estado)
        VALUES (?, ?, 'activo')
        ON DUPLICATE KEY UPDATE estado = 'activo', updated_at = CURRENT_TIMESTAMP`,
        [user.persona_id, rolId]
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
  findByPersonaId,
  findAll,
  getRolesForPersona,
  createUserFromPersona,
  updateUser,
  deleteUser,
};
