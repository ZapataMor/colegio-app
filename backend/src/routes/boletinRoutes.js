const express = require("express");
const boletinController = require("../controllers/boletinController");

const router = express.Router();

router.get("/api/boletines/catalogo", boletinController.getBoletinCatalog);
router.post("/api/boletines/generar", boletinController.generateBoletinesByCourse);
router.get("/api/boletines/estudiantes/:estudianteId", boletinController.getBoletinByStudent);

module.exports = router;
