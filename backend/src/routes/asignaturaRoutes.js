const express = require("express");
const asignaturaController = require("../controllers/asignaturaController");

const router = express.Router();

router.get("/api/asignaturas", asignaturaController.getAllAsignaturas);
router.get("/api/asignaturas/areas", asignaturaController.getAreas);
router.get("/api/asignaturas/:id", asignaturaController.getAsignaturaById);
router.post("/api/asignaturas", asignaturaController.createAsignatura);
router.put("/api/asignaturas/:id", asignaturaController.updateAsignatura);
router.delete("/api/asignaturas/:id", asignaturaController.deleteAsignatura);

module.exports = router;
