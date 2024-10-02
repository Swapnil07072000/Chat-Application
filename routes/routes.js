const express = require("express");

const users = require(("../controllers/Users"));
const chats = require(("../controllers/Chats"));

const authenticatemiddleware = require("../middlewares/authenticate");

const router = express.Router();

router.get("/", (req, res)=>{
    res.render("index");
});
router.get("/login", (req, res)=>{
    res.render("login");
});
router.post("/login", users.signIn);

router.get("/register", (req, res)=>{
    res.render("register");
});
router.post("/register", users.signUp);

router.get("/user/chats", authenticatemiddleware.handle.bind(authenticatemiddleware), chats.getAllGroups);

router.post("/chat/create", authenticatemiddleware.handle.bind(authenticatemiddleware) , chats.createGroup);

module.exports = router;