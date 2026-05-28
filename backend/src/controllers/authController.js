const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");
const { createToken } = require("../utils/jwt");

const login = async (req, res, next) => {
  try {
    const usuario = req.body.usuario?.trim();
    const contrasena = req.body.contrasena?.trim();

    if (!usuario || !contrasena) {
      return res.status(400).json({
        message: "Usuario y contrasena son obligatorios.",
      });
    }

    // Busca el usuario y compara la contrasena enviada con el hash bcrypt guardado.
    const user = await userModel.findByUsuario(usuario);
    const isPasswordValid = user
      ? await bcrypt.compare(contrasena, user.contrasena)
      : false;

    if (!user || !isPasswordValid) {
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
        usuario: user.usuario,
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
