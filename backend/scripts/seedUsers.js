const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");

const users = [
  {
    correo: "admin@colegio.com",
    contrasena: "Admin123*",
    rol: "administrador",
    nombres: "Admin",
    apellidos: "Principal",
    documento: "900000001",
  },
  {
    correo: "diana.martinez@colegio.com",
    contrasena: "Docente123*",
    rol: "profesor",
    nombres: "Diana Carolina",
    apellidos: "Martinez Rojas",
    documento: "810000001",
    telefono: "3001000001",
    profesor: {
      especialidad: "Matematicas",
      titulo: "Licenciada en Matematicas",
    },
  },
  {
    correo: "claudia.gomez@colegio.com",
    contrasena: "Docente123*",
    rol: "profesor",
    nombres: "Claudia Patricia",
    apellidos: "Gomez Herrera",
    documento: "810000003",
    telefono: "3001000003",
    profesor: {
      especialidad: "Espanol",
      titulo: "Licenciada en Lengua Castellana",
    },
  },
];

const fetchOne = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params);
  return rows[0] || null;
};

const ensurePersona = async (user) => {
  const current = await fetchOne(
    `SELECT id FROM personas WHERE documento = ? OR correo = ? LIMIT 1`,
    [user.documento, user.correo]
  );

  if (current) {
    await pool.query(
      `UPDATE personas
       SET nombres = ?, apellidos = ?, tipo_documento = ?, documento = ?, telefono = ?,
           correo = ?, estado = 'activo', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        user.nombres,
        user.apellidos,
        user.rol === "estudiante" ? "TI" : "CC",
        user.documento,
        user.telefono || null,
        user.correo,
        current.id,
      ]
    );
    return current.id;
  }

  const [result] = await pool.query(
    `INSERT INTO personas
      (nombres, apellidos, tipo_documento, documento, telefono, correo, estado)
     VALUES (?, ?, ?, ?, ?, ?, 'activo')`,
    [
      user.nombres,
      user.apellidos,
      user.rol === "estudiante" ? "TI" : "CC",
      user.documento,
      user.telefono || null,
      user.correo,
    ]
  );

  return result.insertId;
};

const ensurePersonaRole = async (personaId, rolId) => {
  await pool.query(
    `INSERT INTO persona_roles (persona_id, rol_id, estado)
     VALUES (?, ?, 'activo')
     ON DUPLICATE KEY UPDATE estado = 'activo', updated_at = CURRENT_TIMESTAMP`,
    [personaId, rolId]
  );
};

const ensureProfesor = async (personaId, profesor) => {
  if (!profesor) return;

  await pool.query(
    `INSERT INTO profesores (persona_id, especialidad, titulo, estado)
     VALUES (?, ?, ?, 'activo')
     ON DUPLICATE KEY UPDATE especialidad = VALUES(especialidad), titulo = VALUES(titulo),
       estado = 'activo', updated_at = CURRENT_TIMESTAMP`,
    [personaId, profesor.especialidad, profesor.titulo]
  );
};

const ensureUsuario = async (personaId, passwordHash) => {
  const current = await fetchOne(`SELECT id FROM usuarios WHERE persona_id = ? LIMIT 1`, [
    personaId,
  ]);

  if (current) {
    await pool.query(
      `UPDATE usuarios
       SET password_hash = ?, estado = 'activo', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [passwordHash, current.id]
    );
    return current.id;
  }

  const [result] = await pool.query(
    `INSERT INTO usuarios (persona_id, password_hash, estado)
     VALUES (?, ?, 'activo')`,
    [personaId, passwordHash]
  );
  return result.insertId;
};

const seedUsers = async () => {
  const [roles] = await pool.query("SELECT id, nombre FROM roles");
  const roleByName = new Map(roles.map((role) => [role.nombre, role.id]));

  for (const user of users) {
    const rolId = roleByName.get(user.rol);

    if (!rolId) {
      throw new Error(`No existe el rol ${user.rol}. Ejecuta primero backend/database/schema.sql.`);
    }

    const personaId = await ensurePersona(user);
    await ensurePersonaRole(personaId, rolId);
    await ensureProfesor(personaId, user.profesor);

    const passwordHash = await bcrypt.hash(user.contrasena, 10);
    await ensureUsuario(personaId, passwordHash);

    console.log(`Usuario ${user.correo} listo.`);
  }
};

seedUsers()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
