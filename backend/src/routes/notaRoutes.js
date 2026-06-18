const express = require("express");
const notaController = require("../controllers/notaController");

const router = express.Router();

router.get("/api/notas/catalogo", notaController.getNotaCatalog);
router.get("/api/notas/por-curso", notaController.getNotasPorCurso);
router.post("/api/notas/actividades", notaController.createActividad);
router.post("/api/notas/actividades/:actividadId/notas", notaController.upsertNotaActividad);
router.get("/api/notas", notaController.getAllNotas);
router.get("/api/notas/:id", notaController.getNotaById);
router.post("/api/notas", notaController.createNota);
router.put("/api/notas/:id", notaController.updateNota);
router.delete("/api/notas/:id", notaController.deleteNota);

module.exports = router;
