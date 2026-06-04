const express = require("express");
const matriculaController = require("../controllers/matriculaController");

const router = express.Router();

router.get("/api/matriculas", matriculaController.getAllMatriculas);
router.get("/api/matriculas/:id", matriculaController.getMatriculaById);
router.post("/api/matriculas", matriculaController.createMatricula);
router.put("/api/matriculas/:id", matriculaController.updateMatricula);
router.delete("/api/matriculas/:id", matriculaController.deleteMatricula);

module.exports = router;
