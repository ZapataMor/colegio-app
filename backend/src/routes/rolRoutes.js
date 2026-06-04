const express = require("express");
const rolController = require("../controllers/rolController");

const router = express.Router();

router.get("/api/roles", rolController.getRoles);

module.exports = router;
