const express = require("express");
const usuarioController = require("../controllers/usuarioController");

const router = express.Router();

router.get("/api/usuarios", usuarioController.getAllUsers);
router.get("/api/usuarios/:id", usuarioController.getUserById);
router.post("/api/usuarios", usuarioController.createUser);
router.put("/api/usuarios/:id", usuarioController.updateUser);
router.delete("/api/usuarios/:id", usuarioController.deleteUser);

module.exports = router;
