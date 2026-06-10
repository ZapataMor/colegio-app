const express = require("express");
const salonController = require("../controllers/salonController");

const router = express.Router();

router.get("/api/salones", salonController.getAllSalones);
router.get("/api/salones/:id", salonController.getSalonById);
router.post("/api/salones", salonController.createSalon);
router.put("/api/salones/:id", salonController.updateSalon);
router.delete("/api/salones/:id", salonController.deleteSalon);

module.exports = router;
