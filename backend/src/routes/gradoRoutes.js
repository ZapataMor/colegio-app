const express = require("express");
const gradoController = require("../controllers/gradoController");
const { authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();
const adminOnly = authorizeRoles("administrador");

router.get("/api/grados", gradoController.getAllGrados);
router.get("/api/grados/:id", gradoController.getGradoById);
router.get("/api/grados/:id/cursos", gradoController.getCursosByGrado);
router.post("/api/grados", adminOnly, gradoController.createGrado);
router.post("/api/grados/:id/cursos", adminOnly, gradoController.createCursoForGrado);
router.put("/api/grados/:id", adminOnly, gradoController.updateGrado);
router.delete("/api/grados/:id", adminOnly, gradoController.deleteGrado);

module.exports = router;
