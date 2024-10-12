const express = require("express");

require("../config/modelsSync");

const users = require(("../controllers/Users"));
const chats = require(("../controllers/Chats"));

const authenticatemiddleware = require("../middlewares/authenticate");
const veriftJWTToken = require("../middlewares/verifyToken");

const router = express.Router();

router.get("/", (req, res)=>{
    res.render("index");
});
router.get("/login", (req, res)=>{
    // console.log(req.session.user);
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

// router.get("/user/chats", [veriftJWTToken.veriftJWTToken, authenticatemiddleware.handle.bind(authenticatemiddleware)], chats.getAllGroups);
router.get("/user/chats", [veriftJWTToken.handle.bind(veriftJWTToken), authenticatemiddleware.handle.bind(authenticatemiddleware)], chats.getAllGroups);

router.post("/chat/create", [veriftJWTToken.handle.bind(veriftJWTToken), authenticatemiddleware.handle.bind(authenticatemiddleware)] , chats.createGroup);
router.get("/user/user-profile/:user_id", [veriftJWTToken.handle.bind(veriftJWTToken), authenticatemiddleware.handle.bind(authenticatemiddleware)], users.getUserProfileInfo);
router.get("/user/chats/:chat_id", [veriftJWTToken.handle.bind(veriftJWTToken), authenticatemiddleware.handle.bind(authenticatemiddleware)], chats.getChatById);
router.get("/user/chatjoin/:chat_id", [veriftJWTToken.handle.bind(veriftJWTToken), authenticatemiddleware.handle.bind(authenticatemiddleware)], chats.joinChatGroup);
router.post("/user/friendrequest", [veriftJWTToken.handle.bind(veriftJWTToken), authenticatemiddleware.handle.bind(authenticatemiddleware)], users.sendFriendRequest);

router.get("/user/friend-requests", [veriftJWTToken.handle.bind(veriftJWTToken), authenticatemiddleware.handle.bind(authenticatemiddleware)], chats.getAllFriendRequestsForUser);


router.get("/user/logout", [veriftJWTToken.handle.bind(veriftJWTToken), authenticatemiddleware.handle.bind(authenticatemiddleware)], users.signOut);


module.exports = router;