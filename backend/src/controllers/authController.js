const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");
const { createToken } = require("../utils/jwt");

const welcomeByRole = {
  administrador: "Bienvenido al panel de administración. Tienes acceso a todos los módulos del sistema.",
  profesor: "Bienvenido docente. Pronto podrás consultar tus clases, notas y asistencias desde aquí.",
  estudiante: "Bienvenido estudiante. Pronto podrás ver tu información académica desde esta app.",
  acudiente: "Bienvenido acudiente. Pronto podrás seguir el progreso de tus acudidos desde aquí.",
};

const login = async (req, res, next) => {
  try {
    const correo = req.body.correo?.trim().toLowerCase();
    const contrasena = req.body.contrasena?.trim();

    if (!correo || !contrasena) {
      return res.status(400).json({
        message: "Correo y contrasena son obligatorios.",
      });
    }

    const user = await userModel.findByCorreo(correo);
    const isPasswordValid = user ? await bcrypt.compare(contrasena, user.password_hash) : false;

    if (!user || user.estado !== "activo" || !isPasswordValid) {
      return res.status(401).json({
        message: "Credenciales incorrectas.",
      });
    }

    const roles = await userModel.getRolesForPersona(user.persona_id);
    const rolPrincipal = roles[0]?.nombre || user.rol || null;

    if (!rolPrincipal) {
      return res.status(403).json({
        message: "El usuario no tiene un rol activo asignado.",
      });
    }

    const token = createToken({ ...user, rol: rolPrincipal });

    return res.json({
      message: "Login exitoso.",
      token,
      welcomeMessage: welcomeByRole[rolPrincipal] || "Bienvenido a Colegio App.",
      user: {
        id: user.id,
        personaId: user.persona_id,
        nombre: user.nombre,
        apellido: user.apellido,
        correo: user.correo,
        rol: rolPrincipal,
        roles: roles.map((r) => r.nombre),
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  login,
};
