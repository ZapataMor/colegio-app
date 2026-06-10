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
    apellido: "Garcia",
    documento: "800000001",
  },
  {
    correo: "docente2@colegio.com",
    contrasena: "Docente123*",
    rol: "profesor",
    nombre: "Maria",
    apellido: "Lopez",
    documento: "800000002",
  },
  {
    correo: "estudiante1@colegio.com",
    contrasena: "Estudiante123*",
    rol: "estudiante",
    nombre: "Carlos",
    apellido: "Martinez",
    documento: "700000001",
  },
  {
    correo: "estudiante2@colegio.com",
    contrasena: "Estudiante123*",
    rol: "estudiante",
    nombre: "Laura",
    apellido: "Rodriguez",
    documento: "700000002",
  },
];

const profesoresExtra = [
  {
    nombres: "Pedro",
    apellidos: "Sanchez",
    documento: "1234567890",
    correo: "pedro@colegio.com",
    telefono: "3001234567",
    especialidad: "Matematicas",
  },
  {
    nombres: "Ana",
    apellidos: "Fernandez",
    documento: "0987654321",
    correo: "ana@colegio.com",
    telefono: "3002345678",
    especialidad: "Lenguaje",
  },
];

const estudiantesExtra = [
  {
    nombres: "Diego",
    apellidos: "Gomez",
    documento: "1111111111",
    genero: "masculino",
  },
  {
    nombres: "Sofia",
    apellidos: "Hernandez",
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

const seedAcademicData = async () => {
  const [periodos] = await pool.query(
    `SELECT id, fecha_inicio, fecha_fin
    FROM periodos_academicos
    ORDER BY (estado = 'activo') DESC, fecha_inicio DESC
    LIMIT 1`
  );
  const periodo = periodos[0];
  if (!periodo) return;

  const [profesores] = await pool.query(
    `SELECT id FROM profesores WHERE estado = 'activo' ORDER BY id ASC LIMIT 3`
  );
  const [asignaturas] = await pool.query(
    `SELECT id FROM asignaturas WHERE estado = 'activo' ORDER BY id ASC LIMIT 4`
  );
  const [estudiantes] = await pool.query(
    `SELECT id, curso_id FROM estudiantes WHERE estado = 'activo' ORDER BY id ASC LIMIT 4`
  );

  if (profesores.length === 0 || asignaturas.length === 0 || estudiantes.length === 0) return;

  for (const estudiante of estudiantes) {
    for (let index = 0; index < asignaturas.length; index += 1) {
      const asignatura = asignaturas[index];
      const profesor = profesores[index % profesores.length];
      const nota = Number((3 + ((estudiante.id + index) % 20) / 10).toFixed(2));

      await pool.query(
        `INSERT INTO notas
          (estudiante_id, curso_id, asignatura_id, profesor_id, periodo_id, nota, observacion, fecha_registro)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())
        ON DUPLICATE KEY UPDATE
          nota = VALUES(nota),
          observacion = VALUES(observacion),
          updated_at = CURRENT_TIMESTAMP`,
        [
          estudiante.id,
          estudiante.curso_id,
          asignatura.id,
          profesor.id,
          periodo.id,
          nota,
          nota < 3 ? "Requiere plan de apoyo y acompanamiento." : "Buen avance durante el periodo.",
        ]
      );
    }

    const attendanceDays = ["2026-04-10", "2026-04-17", "2026-05-08", "2026-05-22"];
    for (let index = 0; index < attendanceDays.length; index += 1) {
      const fecha = attendanceDays[index];
      if (fecha < periodo.fecha_inicio || fecha > periodo.fecha_fin) continue;

      const estado =
        index === 1 && estudiante.id % 2 === 0
          ? "ausente"
          : index === 2
            ? "tardanza"
            : "presente";

      await pool.query(
        `INSERT INTO asistencias
          (estudiante_id, curso_id, asignatura_id, profesor_id, fecha, estado_asistencia, observacion)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          estado_asistencia = VALUES(estado_asistencia),
          observacion = VALUES(observacion),
          updated_at = CURRENT_TIMESTAMP`,
        [
          estudiante.id,
          estudiante.curso_id,
          asignaturas[index % asignaturas.length].id,
          profesores[index % profesores.length].id,
          fecha,
          estado,
          estado === "ausente" ? "Ausencia registrada en seed de prueba." : null,
        ]
      );
    }
  }
};

const seed = async () => {
  try {
    console.log("Iniciando seeding...\n");

    const [roles] = await pool.query("SELECT id, nombre FROM roles");
    const roleByName = new Map(roles.map((role) => [role.nombre, role.id]));

    const [cursos] = await pool.query("SELECT id, nombre FROM cursos");
    if (cursos.length === 0) {
      throw new Error("No existen cursos. Ejecuta primero el schema.sql");
    }
    const cursoId = cursos[0].id;

    console.log("Creando profesores...");
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
        console.log(`  Profesor ${user.nombre} ${user.apellido}`);
      }
    }

    for (const profesor of profesoresExtra) {
      const exists = await profesorModel.findByDocumento(profesor.documento);
      if (!exists) {
        await profesorModel.create(profesor);
        console.log(`  Profesor ${profesor.nombres} ${profesor.apellidos}`);
      }
    }

    console.log("\nCreando estudiantes...");
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
        console.log(`  Estudiante ${user.nombre} ${user.apellido}`);
      }
    }

    for (const estudiante of estudiantesExtra) {
      const exists = await estudianteModel.findByDocumento(estudiante.documento);
      if (!exists) {
        await estudianteModel.create({ cursoId, ...estudiante });
        console.log(`  Estudiante ${estudiante.nombres} ${estudiante.apellidos}`);
      }
    }

    console.log("\nCreando accesos...");
    for (const user of usuarios) {
      const rolId = roleByName.get(user.rol);
      if (!rolId) continue;

      const existingUser = await userModel.findByCorreo(user.correo);
      if (existingUser) {
        console.log(`  Acceso ${user.correo} ya existe`);
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
        console.warn(`  No se encontro persona para ${user.correo}`);
        continue;
      }

      const passwordHash = await bcrypt.hash(user.contrasena, 10);
      const userId = await userModel.createUserFromPersona({
        personaId,
        rolId,
        passwordHash,
      });
      console.log(`  Acceso ${user.correo} creado (usuario ID: ${userId})`);
    }

    console.log("\nCreando matriculas...");
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

    console.log("\nCreando datos academicos base...");
    await seedAcademicData();

    console.log("\nSeeding completado.\n");
    console.log("Credenciales de prueba:");
    console.log("  Admin: admin@colegio.com / Admin123*");
    console.log("  Profesor: docente1@colegio.com / Docente123*");
    console.log("  Estudiante: estudiante1@colegio.com / Estudiante123*");
    console.log();

    await pool.end();
  } catch (error) {
    console.error("Error en seeding:", error.message);
    await pool.end();
    process.exit(1);
  }
};

seed();
