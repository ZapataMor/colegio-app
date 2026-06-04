const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");
const userModel = require("../src/models/userModel");

const users = [
  {
    correo: "admin@colegio.com",
    contrasena: "Admin123*",
    rol: "administrador",
    nombre: "Admin",
    apellido: "Principal",
  },
  {
    correo: "docente@colegio.com",
    contrasena: "Docente123*",
    rol: "profesor",
    nombre: "Docente",
    apellido: "Demo",
  },
];

const seedUsers = async () => {
  const [roles] = await pool.query("SELECT id, nombre FROM roles");
  const roleByName = new Map(roles.map((role) => [role.nombre, role.id]));

  for (const user of users) {
    const rolId = roleByName.get(user.rol);

    if (!rolId) {
      throw new Error(`No existe el rol ${user.rol}. Ejecuta primero el script SQL base.`);
    }

    const existingUser = await userModel.findByCorreo(user.correo);

    if (existingUser) {
      console.log(`Usuario ${user.correo} ya existe.`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(user.contrasena, 10);
    await userModel.createUser({
      rolId,
      nombre: user.nombre,
      apellido: user.apellido,
      correo: user.correo,
      passwordHash: hashedPassword,
    });

    console.log(`Usuario ${user.correo} creado.`);
  }

  await pool.end();
};

seedUsers().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
