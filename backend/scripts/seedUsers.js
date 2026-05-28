const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");
const userModel = require("../src/models/userModel");

const users = [
  { usuario: "admin", contrasena: "Admin123*", rol: "admin" },
  { usuario: "docente", contrasena: "Docente123*", rol: "docente" },
];

const seedUsers = async () => {
  for (const user of users) {
    const existingUser = await userModel.findByUsuario(user.usuario);

    if (existingUser) {
      console.log(`Usuario ${user.usuario} ya existe.`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(user.contrasena, 10);
    await userModel.createUser({
      usuario: user.usuario,
      contrasena: hashedPassword,
      rol: user.rol,
    });

    console.log(`Usuario ${user.usuario} creado.`);
  }

  await pool.end();
};

seedUsers().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
