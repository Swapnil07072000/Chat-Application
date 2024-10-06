const express = require("express");

const users = require(("../controllers/Users"));
const chats = require(("../controllers/Chats"));

const authenticatemiddleware = require("../middlewares/authenticate");

const router = express.Router();

router.get("/", (req, res)=>{
    res.render("index");
});
router.get("/login", (req, res)=>{
    if(req.session.user){
        return res.redirect("/user/chats");
    }
    res.render("login");
});
router.post("/login", users.signIn);

router.get("/register", (req, res)=>{
    res.render("register");
});
router.post("/register", users.signUp);

router.get("/user/chats", authenticatemiddleware.handle.bind(authenticatemiddleware), chats.getAllGroups);

router.post("/chat/create", authenticatemiddleware.handle.bind(authenticatemiddleware) , chats.createGroup);

router.get("/user/chats/:chat_id", authenticatemiddleware.handle.bind(authenticatemiddleware), chats.getChatById);
router.get("/user/chatjoin/:chat_id", authenticatemiddleware.handle.bind(authenticatemiddleware), chats.joinChatGroup);

router.get("/user/logout", authenticatemiddleware.handle.bind(authenticatemiddleware), users.signOut);

module.exports = router;