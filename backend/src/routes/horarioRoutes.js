const express = require("express");
const horarioController = require("../controllers/horarioController");

const router = express.Router();

router.get("/api/horarios/catalogo", horarioController.getHorarioCatalog);
router.get("/api/horarios/conflictos", horarioController.validateHorarios);
router.get("/api/horarios/mi-horario", horarioController.getMiHorario);
router.post("/api/horarios/generar", horarioController.generateHorarios);
router.delete("/api/horarios/generados", horarioController.clearHorarios);
router.get("/api/horarios", horarioController.getAllHorarios);
router.get("/api/horarios/:id", horarioController.getHorarioById);
router.post("/api/horarios", horarioController.createHorario);
router.put("/api/horarios/:id", horarioController.updateHorario);
router.delete("/api/horarios/:id", horarioController.deleteHorario);

module.exports = router;
