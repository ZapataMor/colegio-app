const express = require("express");
const cursoController = require("../controllers/cursoController");
const { authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();
const adminOnly = authorizeRoles("administrador");

router.get("/api/cursos", cursoController.getAllCursos);
router.get("/api/cursos/:id", cursoController.getCursoById);
router.put("/api/cursos/:id", adminOnly, cursoController.updateCurso);
router.delete("/api/cursos/:id", adminOnly, cursoController.deleteCurso);

module.exports = router;
