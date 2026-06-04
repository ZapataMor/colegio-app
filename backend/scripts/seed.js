const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");
const userModel = require("../src/models/userModel");
const estudianteModel = require("../src/models/estudianteModel");
const profesorModel = require("../src/models/profesorModel");
const matriculaModel = require("../src/models/matriculaModel");

const usuarios = [
  {
    correo: "admin@colegio.com",
    contrasena: "Admin123*",
    rol: "administrador",
    nombre: "Admin",
    apellido: "Principal",
    documento: "900000001",
  },
  {
    correo: "docente1@colegio.com",
    contrasena: "Docente123*",
    rol: "profesor",
    nombre: "Juan",
    apellido: "García",
    documento: "800000001",
  },
  {
    correo: "docente2@colegio.com",
    contrasena: "Docente123*",
    rol: "profesor",
    nombre: "María",
    apellido: "López",
    documento: "800000002",
  },
  {
    correo: "estudiante1@colegio.com",
    contrasena: "Estudiante123*",
    rol: "estudiante",
    nombre: "Carlos",
    apellido: "Martínez",
    documento: "700000001",
  },
  {
    correo: "estudiante2@colegio.com",
    contrasena: "Estudiante123*",
    rol: "estudiante",
    nombre: "Laura",
    apellido: "Rodríguez",
    documento: "700000002",
  },
];

const profesoresExtra = [
  {
    nombres: "Pedro",
    apellidos: "Sánchez",
    documento: "1234567890",
    correo: "pedro@colegio.com",
    telefono: "3001234567",
    especialidad: "Matemáticas",
  },
  {
    nombres: "Ana",
    apellidos: "Fernández",
    documento: "0987654321",
    correo: "ana@colegio.com",
    telefono: "3002345678",
    especialidad: "Lenguaje",
  },
];

const estudiantesExtra = [
  {
    nombres: "Diego",
    apellidos: "Gómez",
    documento: "1111111111",
    genero: "masculino",
  },
  {
    nombres: "Sofía",
    apellidos: "Hernández",
    documento: "2222222222",
    genero: "femenino",
  },
];

const ensurePersona = async (user) => {
  const [rows] = await pool.query(`SELECT id FROM personas WHERE correo = ? LIMIT 1`, [user.correo]);
  if (rows[0]) return rows[0].id;

  const [result] = await pool.query(
    `INSERT INTO personas (nombres, apellidos, tipo_documento, documento, correo, estado)
    VALUES (?, ?, 'CC', ?, ?, 'activo')`,
    [user.nombre, user.apellido, user.documento, user.correo]
  );
  return result.insertId;
};

const seed = async () => {
  try {
    console.log("🌱 Iniciando seeding...\n");

    const [roles] = await pool.query("SELECT id, nombre FROM roles");
    const roleByName = new Map(roles.map((role) => [role.nombre, role.id]));

    const [cursos] = await pool.query("SELECT id, nombre FROM cursos");
    if (cursos.length === 0) {
      throw new Error("No existen cursos. Por favor ejecuta primero el schema.sql");
    }
    const cursoId = cursos[0].id;

    console.log("👨‍🏫 Creando profesores (personas)...");
    for (const user of usuarios.filter((u) => u.rol === "profesor")) {
      const exists = await profesorModel.findByDocumento(user.documento);
      if (!exists) {
        await profesorModel.create({
          nombres: user.nombre,
          apellidos: user.apellido,
          documento: user.documento,
          correo: user.correo,
          especialidad: "General",
        });
        console.log(`  ✓ Profesor ${user.nombre} ${user.apellido}`);
      }
    }

    for (const profesor of profesoresExtra) {
      const exists = await profesorModel.findByDocumento(profesor.documento);
      if (!exists) {
        await profesorModel.create(profesor);
        console.log(`  ✓ Profesor ${profesor.nombres} ${profesor.apellidos}`);
      }
    }

    console.log("\n🎓 Creando estudiantes (personas)...");
    for (const user of usuarios.filter((u) => u.rol === "estudiante")) {
      const exists = await estudianteModel.findByDocumento(user.documento);
      if (!exists) {
        await estudianteModel.create({
          cursoId,
          nombres: user.nombre,
          apellidos: user.apellido,
          documento: user.documento,
          correo: user.correo,
          genero: "no_especifica",
        });
        console.log(`  ✓ Estudiante ${user.nombre} ${user.apellido}`);
      }
    }

    for (const estudiante of estudiantesExtra) {
      const exists = await estudianteModel.findByDocumento(estudiante.documento);
      if (!exists) {
        await estudianteModel.create({ cursoId, ...estudiante });
        console.log(`  ✓ Estudiante ${estudiante.nombres} ${estudiante.apellidos}`);
      }
    }

    console.log("\n📝 Creando accesos de usuario...");
    for (const user of usuarios) {
      const rolId = roleByName.get(user.rol);
      if (!rolId) continue;

      const existingUser = await userModel.findByCorreo(user.correo);
      if (existingUser) {
        console.log(`  ✓ Acceso ${user.correo} ya existe`);
        continue;
      }

      let personaId = null;

      if (user.rol === "administrador") {
        personaId = await ensurePersona(user);
      } else if (user.rol === "profesor") {
        const prof = await profesorModel.findByDocumento(user.documento);
        personaId = prof?.persona_id;
      } else if (user.rol === "estudiante") {
        const est = await estudianteModel.findByDocumento(user.documento);
        personaId = est?.persona_id;
      }

      if (!personaId) {
        console.warn(`  ⚠️  No se encontró persona para ${user.correo}`);
        continue;
      }

      const passwordHash = await bcrypt.hash(user.contrasena, 10);
      const userId = await userModel.createUserFromPersona({
        personaId,
        rolId,
        passwordHash,
      });
      console.log(`  ✓ Acceso ${user.correo} creado (usuario ID: ${userId})`);
    }

    console.log("\n📋 Creando matrículas...");
    const anioActual = new Date().getFullYear();
    const [todosEstudiantes] = await pool.query(
      "SELECT id, curso_id FROM estudiantes WHERE estado = 'activo' LIMIT 10"
    );

    for (const est of todosEstudiantes) {
      const existente = await matriculaModel.findByEstudianteAnio(est.id, anioActual);
      if (existente) continue;

      await matriculaModel.create({
        estudianteId: est.id,
        cursoId: est.curso_id,
        anio: anioActual,
      });
    }

    console.log("\n✅ Seeding completado!\n");
    console.log("Credenciales de prueba:");
    console.log("  Admin: admin@colegio.com / Admin123*");
    console.log("  Profesor: docente1@colegio.com / Docente123*");
    console.log("  Estudiante: estudiante1@colegio.com / Estudiante123*");
    console.log();

    await pool.end();
  } catch (error) {
    console.error("❌ Error en seeding:", error.message);
    await pool.end();
    process.exit(1);
  }
};

seed();
