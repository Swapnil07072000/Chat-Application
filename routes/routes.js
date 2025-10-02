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

router.use("/user", [veriftJWTToken.handle.bind(veriftJWTToken), authenticatemiddleware.handle.bind(authenticatemiddleware)]);
	router.get("/user/chats", chats.getAllGroups);
	router.get("/user/user-profile/:user_id", users.getUserProfileInfo);
	router.get("/user/chats/:chat_id", chats.getChatById);
	router.get("/user/chatjoin/:chat_id", chats.joinChatGroup);
	router.get("/user/friend-requests", chats.getAllFriendRequestsForUser);
	router.get("/user/logout", users.signOut);

	router.post("/user/friendrequest", users.sendFriendRequest);
	router.post("/user/friendrequestaction/:actionType", chats.actionOnRequest);
	router.post("/user/chats/exitgroup/:chat_id", chats.exitGroup);

router.use("/chat", [veriftJWTToken.handle.bind(veriftJWTToken), authenticatemiddleware.handle.bind(authenticatemiddleware)]);
	router.get("/chat/:chat_id/:msg_id/view/:file_id", chats.viewFile);
	router.get("/chat/:chat_id/:msg_id/download/:file_id", chats.downloadFile);

	router.post("/chat/create", chats.createGroup);



router.use("/upload",[veriftJWTToken.handle.bind(veriftJWTToken), authenticatemiddleware.handle.bind(authenticatemiddleware)]);/*, upload.single('file')]);*/
	router.post("/upload", fileUpload.upload);
	router.post("/upload/chunk", fileUpload.uploadChunk);
	router.post("/upload/registerfiles", fileUpload.registerFiles);

router.use("/video", [veriftJWTToken.handle.bind(veriftJWTToken), authenticatemiddleware.handle.bind(authenticatemiddleware)]);
	router.get("/video/:file_id", fileUpload.streamVideo);

module.exports = router;
