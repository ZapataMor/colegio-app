const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const estudianteRoutes = require("./routes/estudianteRoutes");
const profesorRoutes = require("./routes/profesorRoutes");
const rolRoutes = require("./routes/rolRoutes");
const matriculaRoutes = require("./routes/matriculaRoutes");
const personaRoutes = require("./routes/personaRoutes");
const salonRoutes = require("./routes/salonRoutes");
const gradoRoutes = require("./routes/gradoRoutes");
const cursoRoutes = require("./routes/cursoRoutes");
const horarioRoutes = require("./routes/horarioRoutes");
const asistenciaRoutes = require("./routes/asistenciaRoutes");
const comunicadoRoutes = require("./routes/comunicadoRoutes");
const boletinRoutes = require("./routes/boletinRoutes");
const periodoRoutes = require("./routes/periodoRoutes");
const notaRoutes = require("./routes/notaRoutes");
const asignaturaRoutes = require("./routes/asignaturaRoutes");
const meRoutes = require("./routes/meRoutes");
const errorHandler = require("./middlewares/errorHandler");
const { authenticate } = require("./middlewares/authMiddleware");
const pool = require("./config/db");
const env = require("./config/env");

const app = express();

app.use(cors());
app.use(express.json());

// Rutas públicas — no requieren token
app.get("/", (req, res) => {
  res.json({ message: "API Colegio App funcionando." });
});

app.get("/api/test-db", async (req, res, next) => {
  if (env.nodeEnv === "production") {
    return res.status(404).json({ ok: false, message: "Not found." });
  }
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS resultado");
    res.json({
      ok: true,
      mensaje: "Conexion a MySQL exitosa",
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
});

app.use("/", authRoutes);

// A partir de aquí todas las rutas /api/* requieren token JWT válido
app.use("/api", authenticate);

app.use("/", usuarioRoutes);
app.use("/", estudianteRoutes);
app.use("/", profesorRoutes);
app.use("/", rolRoutes);
app.use("/", matriculaRoutes);
app.use("/", personaRoutes);
app.use("/", salonRoutes);
app.use("/", gradoRoutes);
app.use("/", cursoRoutes);
app.use("/", horarioRoutes);
app.use("/", asistenciaRoutes);
app.use("/", comunicadoRoutes);
app.use("/", boletinRoutes);
app.use("/", periodoRoutes);
app.use("/", notaRoutes);
app.use("/", asignaturaRoutes);
app.use("/", meRoutes);

app.use(errorHandler);

module.exports = app;
