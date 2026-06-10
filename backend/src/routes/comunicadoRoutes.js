const express = require("express");
const comunicadoController = require("../controllers/comunicadoController");

const router = express.Router();

router.get("/api/comunicados/catalogo", comunicadoController.getComunicadoCatalog);
router.get("/api/comunicados", comunicadoController.getAllComunicados);
router.get("/api/comunicados/:id", comunicadoController.getComunicadoById);
router.post("/api/comunicados", comunicadoController.createComunicado);
router.put("/api/comunicados/:id", comunicadoController.updateComunicado);
router.delete("/api/comunicados/:id", comunicadoController.deleteComunicado);

module.exports = router;
