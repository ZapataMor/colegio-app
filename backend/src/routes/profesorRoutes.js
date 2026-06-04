const express = require("express");
const profesorController = require("../controllers/profesorController");

const router = express.Router();

router.get("/api/profesores", profesorController.getAllProfesores);
router.get("/api/profesores/:id", profesorController.getProfesorById);
router.post("/api/profesores", profesorController.createProfesor);
router.put("/api/profesores/:id", profesorController.updateProfesor);
router.delete("/api/profesores/:id", profesorController.deleteProfesor);

module.exports = router;
