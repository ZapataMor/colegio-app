const express = require("express");
const asistenciaController = require("../controllers/asistenciaController");

const router = express.Router();

router.get("/api/asistencias/catalogo", asistenciaController.getAsistenciaCatalog);
router.get("/api/asistencias/resumen", asistenciaController.getResumenAsistencias);
router.get("/api/asistencias/por-curso", asistenciaController.getAsistenciasPorCurso);
router.post("/api/asistencias/marcar", asistenciaController.marcarAsistencia);
router.get("/api/asistencias", asistenciaController.getAllAsistencias);
router.get("/api/asistencias/:id", asistenciaController.getAsistenciaById);
router.post("/api/asistencias", asistenciaController.createAsistencia);
router.put("/api/asistencias/:id", asistenciaController.updateAsistencia);
router.delete("/api/asistencias/:id", asistenciaController.deleteAsistencia);

module.exports = router;
