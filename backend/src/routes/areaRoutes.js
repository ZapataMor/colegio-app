const express = require("express");
const areaController = require("../controllers/areaController");

const router = express.Router();

router.get("/api/areas", areaController.getAllAreas);
router.get("/api/areas/:id", areaController.getAreaById);
router.post("/api/areas", areaController.createArea);
router.put("/api/areas/:id", areaController.updateArea);
router.delete("/api/areas/:id", areaController.deleteArea);

module.exports = router;
