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
const horarioRoutes = require("./routes/horarioRoutes");
const asistenciaRoutes = require("./routes/asistenciaRoutes");
const comunicadoRoutes = require("./routes/comunicadoRoutes");
const errorHandler = require("./middlewares/errorHandler");
const pool = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API Colegio App funcionando." });
});

app.get("/api/test-db", async (req, res, next) => {
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

app.get("/api/cursos", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nombre, nivel, jornada, estado FROM cursos ORDER BY nombre ASC"
    );

    res.json({
      ok: true,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/asignaturas", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nombre, descripcion, estado FROM asignaturas ORDER BY nombre ASC"
    );

    res.json({
      ok: true,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/salones", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nombre, ubicacion, capacidad, estado FROM salones ORDER BY nombre ASC"
    );

    res.json({
      ok: true,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
});

app.use("/", authRoutes);
app.use("/", usuarioRoutes);
app.use("/", estudianteRoutes);
app.use("/", profesorRoutes);
app.use("/", rolRoutes);
app.use("/", matriculaRoutes);
app.use("/", personaRoutes);
app.use("/", salonRoutes);
app.use("/", horarioRoutes);
app.use("/", asistenciaRoutes);
app.use("/", comunicadoRoutes);

app.use(errorHandler);

module.exports = app;
