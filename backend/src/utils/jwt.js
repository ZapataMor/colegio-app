const jwt = require("jsonwebtoken");
const env = require("../config/env");

const createToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      usuario: user.usuario,
      rol: user.rol,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

module.exports = {
  createToken,
};
