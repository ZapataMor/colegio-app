const express = require("express");
const periodoController = require("../controllers/periodoController");

const router = express.Router();

router.get("/api/periodos", periodoController.getAllPeriodos);
router.get("/api/periodos/:id/asignaturas", periodoController.getPeriodoAsignaturas);
router.post("/api/periodos/:id/asignaturas", periodoController.createPeriodoAsignatura);
router.put("/api/periodos/:id/asignaturas/:asignaturaPeriodoId", periodoController.updatePeriodoAsignatura);
router.delete("/api/periodos/:id/asignaturas/:asignaturaPeriodoId", periodoController.deletePeriodoAsignatura);
router.get("/api/periodos/:id", periodoController.getPeriodoById);
router.post("/api/periodos", periodoController.createPeriodo);
router.put("/api/periodos/:id", periodoController.updatePeriodo);
router.delete("/api/periodos/:id", periodoController.deletePeriodo);

module.exports = router;
