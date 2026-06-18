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

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const role = req.user?.rol;

    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({
        ok: false,
        message: "No tienes permisos para realizar esta accion.",
      });
    }

    return next();
  };
};

module.exports = { authenticate, authorizeRoles };
