const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");
const { createToken } = require("../utils/jwt");

const login = async (req, res, next) => {
  try {
    const correo = req.body.correo?.trim().toLowerCase();
    const contrasena = req.body.contrasena?.trim();

    if (!correo || !contrasena) {
      return res.status(400).json({
        message: "Correo y contrasena son obligatorios.",
      });
    }

    // Busca el usuario y compara la contrasena enviada con el hash bcrypt guardado.
    const user = await userModel.findByCorreo(correo);
    const isPasswordValid = user
      ? await bcrypt.compare(contrasena, user.password_hash)
      : false;

    if (!user || user.estado !== "activo" || !isPasswordValid) {
      return res.status(401).json({
        message: "Credenciales incorrectas.",
      });
    }

    // El JWT permite que el frontend mantenga la sesion sin reenviar la contrasena.
    const token = createToken(user);

    return res.json({
      message: "Login exitoso.",
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        correo: user.correo,
        rol: user.rol,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  login,
};
