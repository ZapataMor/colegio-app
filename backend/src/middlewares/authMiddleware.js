const jwt = require("jsonwebtoken");
const env = require("../config/env");

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      ok: false,
      message: "Acceso no autorizado. Se requiere token de autenticacion.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        ok: false,
        message: "La sesion ha expirado. Por favor inicia sesion nuevamente.",
      });
    }
    return res.status(401).json({
      ok: false,
      message: "Token invalido.",
    });
  }
};

module.exports = { authenticate };
