const express = require("express");
const personaController = require("../controllers/personaController");

const router = express.Router();

router.get("/api/personas/disponibles-usuario", personaController.getDisponiblesParaUsuario);
router.get("/api/personas", personaController.getAllPersonas);
router.get("/api/personas/:id", personaController.getPersonaById);

module.exports = router;
