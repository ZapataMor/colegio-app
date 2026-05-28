const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || "cambia-este-secreto-en-produccion",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_DATABASE || "colegio_app",
    user: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
  },
};

module.exports = env;
