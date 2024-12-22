const express = require("express");

require("../config/modelsSync");

const users = require(("../controllers/Users"));
const chats = require(("../controllers/Chats"));
const fileUpload = require("../controllers/FileUpload");

const authenticatemiddleware = require("../middlewares/authenticate");
const veriftJWTToken = require("../middlewares/verifyToken");
const upload = require("../middlewares/multer-utf8");
const { body, check} = require('express-validator');
const router = express.Router();

router.get("/", (req, res)=>{
    res.render("home");
});
router.get("/login", (req, res)=>{
    if(req.session.user){
        return res.redirect("/user/chats");
    }
    res.render("layouts/index",{partial:"../login"});
});
router.post("/login", 
    [
        body("username")
            .notEmpty()
            .withMessage("Username is required.")
            .trim()
            .escape(),
        body("password")
            .notEmpty()
            .withMessage("Password is required.")
            .trim()
            .escape()
    ], users.signIn);

router.get("/register", (req, res)=>{
    res.render("layouts/index",{partial:"../register"});
});
router.post("/register",
    [
        body("name")
            .notEmpty()
            .withMessage("Name is required.")
            .trim()
            .escape(),
        body("username")
            .notEmpty()
            .withMessage("Username is required.")
            .trim()
            .escape(),
        body("email")
            .notEmpty()
            .withMessage("Email is required.")
            .trim()
            .isEmail()
            .withMessage("Please enter valid email.")
            .escape(),
        body("password")
            .notEmpty()
            .withMessage("Password is required.")
            .trim()
            .escape(),
        check("confirm_password")
            .notEmpty()
            .withMessage("Confirm Password is required.")
            .trim()
            .custom((value,{req, loc, path}) => {
                if (value !== req.body.password) {
                    throw new Error("Passwords don't match");
                } else {
                    return value;
                }
            })
    ],
    users.signUp);

// router.get("/user/chats", [veriftJWTToken.veriftJWTToken, authenticatemiddleware.handle.bind(authenticatemiddleware)], chats.getAllGroups);
router.get("/user/chats", [veriftJWTToken.handle.bind(veriftJWTToken), authenticatemiddleware.handle.bind(authenticatemiddleware)], chats.getAllGroups);

router.post("/chat/create", [veriftJWTToken.handle.bind(veriftJWTToken), authenticatemiddleware.handle.bind(authenticatemiddleware)] , chats.createGroup);
router.get("/user/user-profile/:user_id", [veriftJWTToken.handle.bind(veriftJWTToken), authenticatemiddleware.handle.bind(authenticatemiddleware)], users.getUserProfileInfo);
router.get("/user/chats/:chat_id", [veriftJWTToken.handle.bind(veriftJWTToken), authenticatemiddleware.handle.bind(authenticatemiddleware)], chats.getChatById);
router.get("/user/chatjoin/:chat_id", [veriftJWTToken.handle.bind(veriftJWTToken), authenticatemiddleware.handle.bind(authenticatemiddleware)], chats.joinChatGroup);
router.post("/user/friendrequest", [veriftJWTToken.handle.bind(veriftJWTToken), authenticatemiddleware.handle.bind(authenticatemiddleware)], users.sendFriendRequest);
router.post("/user/friendrequestaction/:actionType", [veriftJWTToken.handle.bind(veriftJWTToken), authenticatemiddleware.handle.bind(authenticatemiddleware)], chats.actionOnRequest);

router.get("/user/friend-requests", [veriftJWTToken.handle.bind(veriftJWTToken), authenticatemiddleware.handle.bind(authenticatemiddleware)], chats.getAllFriendRequestsForUser);


router.get("/user/logout", [veriftJWTToken.handle.bind(veriftJWTToken), authenticatemiddleware.handle.bind(authenticatemiddleware)], users.signOut);

router.post("/upload",[veriftJWTToken.handle.bind(veriftJWTToken), authenticatemiddleware.handle.bind(authenticatemiddleware), upload.single('file')], fileUpload.upload);

module.exports = router;