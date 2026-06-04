const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");
const userModel = require("../src/models/userModel");
const estudianteModel = require("../src/models/estudianteModel");
const profesorModel = require("../src/models/profesorModel");

const usuarios = [
  {
    correo: "admin@colegio.com",
    contrasena: "Admin123*",
    rol: "administrador",
    nombre: "Admin",
    apellido: "Principal",
  },
  {
    correo: "docente1@colegio.com",
    contrasena: "Docente123*",
    rol: "profesor",
    nombre: "Juan",
    apellido: "García",
  },
  {
    correo: "docente2@colegio.com",
    contrasena: "Docente123*",
    rol: "profesor",
    nombre: "María",
    apellido: "López",
  },
  {
    correo: "estudiante1@colegio.com",
    contrasena: "Estudiante123*",
    rol: "estudiante",
    nombre: "Carlos",
    apellido: "Martínez",
  },
  {
    correo: "estudiante2@colegio.com",
    contrasena: "Estudiante123*",
    rol: "estudiante",
    nombre: "Laura",
    apellido: "Rodríguez",
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
    nombreAcudiente: "Roberto Gómez",
    telefonoAcudiente: "3009876543",
  },
  {
    nombres: "Sofía",
    apellidos: "Hernández",
    documento: "2222222222",
    genero: "femenino",
    nombreAcudiente: "Patricia Hernández",
    telefonoAcudiente: "3008765432",
  },
];

const seed = async () => {
  try {
    console.log("🌱 Iniciando seeding...\n");

    // Obtener roles
    const [roles] = await pool.query("SELECT id, nombre FROM roles");
    const roleByName = new Map(roles.map((role) => [role.nombre, role.id]));

    // Obtener cursos
    const [cursos] = await pool.query("SELECT id, nombre FROM cursos");
    if (cursos.length === 0) {
      throw new Error("No existen cursos. Por favor ejecuta primero el schema.sql");
    }
    const cursoId = cursos[0].id;

    // 1. Crear usuarios
    console.log("📝 Creando usuarios...");
    const usuariosCreados = {};

    for (const user of usuarios) {
      const rolId = roleByName.get(user.rol);

      if (!rolId) {
        console.warn(`  ⚠️  Rol ${user.rol} no encontrado`);
        continue;
      }

      const existingUser = await userModel.findByCorreo(user.correo);

      if (existingUser) {
        console.log(`  ✓ Usuario ${user.correo} ya existe`);
        usuariosCreados[user.correo] = existingUser.id;
        continue;
      }

      const hashedPassword = await bcrypt.hash(user.contrasena, 10);
      const userId = await userModel.createUser({
        rolId,
        nombre: user.nombre,
        apellido: user.apellido,
        correo: user.correo,
        passwordHash: hashedPassword,
      });

      usuariosCreados[user.correo] = userId;
      console.log(`  ✓ Usuario ${user.correo} creado (ID: ${userId})`);
    }

    // 2. Crear profesores
    console.log("\n👨‍🏫 Creando profesores...");

    // Primero, los profesores que tienen usuarios
    for (const user of usuarios) {
      if (roleByName.get(user.rol) === roleByName.get("profesor")) {
        const existingProfesor = await profesorModel.findByDocumento(`prof_${user.correo}`);

        if (!existingProfesor) {
          const profesorId = await profesorModel.create({
            usuarioId: usuariosCreados[user.correo],
            nombres: user.nombre,
            apellidos: user.apellido,
            documento: `prof_${user.correo}`,
            correo: user.correo,
            especialidad: "General",
          });

          console.log(`  ✓ Profesor ${user.nombre} ${user.apellido} creado (ID: ${profesorId})`);
        }
      }
    }

    // Después, profesores adicionales
    for (const profesor of profesoresExtra) {
      const existingProfesor = await profesorModel.findByDocumento(profesor.documento);

      if (existingProfesor) {
        console.log(`  ✓ Profesor con documento ${profesor.documento} ya existe`);
        continue;
      }

      const profesorId = await profesorModel.create(profesor);
      console.log(`  ✓ Profesor ${profesor.nombres} ${profesor.apellidos} creado (ID: ${profesorId})`);
    }

    // 3. Crear estudiantes
    console.log("\n🎓 Creando estudiantes...");

    // Primero, los estudiantes que tienen usuarios
    for (const user of usuarios) {
      if (roleByName.get(user.rol) === roleByName.get("estudiante")) {
        const existingEstudiante = await estudianteModel.findByDocumento(`est_${user.correo}`);

        if (!existingEstudiante) {
          const estudianteId = await estudianteModel.create({
            usuarioId: usuariosCreados[user.correo],
            cursoId,
            nombres: user.nombre,
            apellidos: user.apellido,
            documento: `est_${user.correo}`,
            genero: "no_especifica",
            nombreAcudiente: "Padre/Acudiente",
          });

          console.log(`  ✓ Estudiante ${user.nombre} ${user.apellido} creado (ID: ${estudianteId})`);
        }
      }
    }

    // Después, estudiantes adicionales
    for (const estudiante of estudiantesExtra) {
      const existingEstudiante = await estudianteModel.findByDocumento(estudiante.documento);

      if (existingEstudiante) {
        console.log(`  ✓ Estudiante con documento ${estudiante.documento} ya existe`);
        continue;
      }

      const estudianteId = await estudianteModel.create({
        cursoId,
        ...estudiante,
      });

      console.log(`  ✓ Estudiante ${estudiante.nombres} ${estudiante.apellidos} creado (ID: ${estudianteId})`);
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
