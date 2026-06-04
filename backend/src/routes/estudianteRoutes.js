const express = require("express");
const estudianteController = require("../controllers/estudianteController");

const router = express.Router();

router.get("/api/estudiantes", estudianteController.getAllEstudiantes);
router.get("/api/estudiantes/:id", estudianteController.getEstudianteById);
router.post("/api/estudiantes", estudianteController.createEstudiante);
router.put("/api/estudiantes/:id", estudianteController.updateEstudiante);
router.delete("/api/estudiantes/:id", estudianteController.deleteEstudiante);

module.exports = router;
