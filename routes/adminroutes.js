const express = require("express");
require("express-router-group");
require("../config/modelsSync");

const adminController = require("../controllers/Admin");

const authenticatemiddleware = require("../middlewares/authenticate");
const veriftJWTToken = require("../middlewares/verifyToken");
const { body, check} = require('express-validator');
const router = express.Router();

router.get("/", (req, res)=>{
    res.render("admin/admin");
});

router.get("/listusers", adminController.listusers);
router.get("/listgroups", adminController.listgroups);

module.exports = router;
