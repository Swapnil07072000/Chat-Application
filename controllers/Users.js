
const users = require('../models/Users');
const userrequests = require("../models/UserRequests");
const usersCircle = require('../models/UsersCircle');
const chatgroups = require("../models/ChatGroups");
const bcrypt = require("bcryptjs");
// const session = require('express-session');
// const jwt = require("jsonwebtoken");
const JwtToken = require("../config/jwtToken");
const { v4: uuidv4 } = require("uuid");
const Op = require('sequelize').Op
const { check, body, sanitizeBody, validationResult,query  } = require('express-validator');
const helper = require("../helpers/helper");

class Users{

    constructor(){
        
    }

    /**
     * Check user exists or not 
     * with user_id
     */
    checkUserExistsOrNot = async(user_id) => {
        let status = true;
        try{
            user_id = parseInt(user_id);
            if(user_id == "" || user_id == undefined || user_id == NaN){
                throw new Error("Please send valid details.");
            }
            const user = await users.findOne({ where: {"id": user_id}});
            if(user.id == undefined || user_id.id == ""){
                throw new Error("User does not exists.");
            }
        }catch(error){  
            status = false;
        }
        return status;
    }

    /**
     * Register or Sign Up
     */
    signUp = async(req, res) => {
        let redirect_url = "";
        let error_msg = "";
        try {
            const {name, username, email, password, confirm_password} = req.body;
            let valid = await this.validateCredentials(req, res);
            if(valid != ""){
                throw new Error(valid);
            }
            const existingUser = await users.findOne({ where: { email } });
            if (existingUser) {
                throw new Error("User with the same email already exists. Please eneter another email.");
            }
            const saltRounds = 10; 
            const password_hashed = await new Promise((resolve, reject) => {
                bcrypt.genSalt(saltRounds, function(err, salt) {
                    if(err) throw new Error(err);
                    bcrypt.hash(password, salt, function(err, hash) {
                        if(err) throw new Error(err);
                        resolve(hash);
                    });
                });
            });
            await users.create({name, username, password_hashed, email })
                .then(function(newUser){
                    //
                })
                .catch(function(error){
                    throw new Error(error);
                });
            redirect_url = "/login";
        } catch (error) {
            redirect_url = "/register";
            error_msg = error.message;
        }
        if(error_msg != ""){
            req.flash("error", error_msg);
        }
        return res.redirect(redirect_url);
    }

    /**
     * Login or Sign In
     */
    signIn = async(req, res) => {
        let redirect_url = "";
        let error_msg = "";
        try {
            const { username, password } = req.body;
            let valid = await this.validateCredentials(req, res);
            if(valid != ""){
                throw new Error(valid);
            }
            const user = await users.findOne({where : {username}});
            if(!user){
                throw new Error("Username or password is invalid.");
            }
            const isMatch = await bcrypt.compare(password, user.password_hashed);
            if(!isMatch){
                throw new Error("Username or password is invalid.");
            }
            const jwtInstance = new JwtToken();
            const token = await jwtInstance.createJWTToken(user);
            await res.cookie("jwtToken", token, {
                httpOnly: true
            });
            req.session.user = user;
            redirect_url = "/user/chats";
        } catch (error) {
            redirect_url = "/login";
            error_msg = error.message;
        }
        if(error_msg != ""){
            req.flash("error", error_msg);
        }
        return res.redirect(redirect_url);
    }

    /**
     * Validate the login credentials
     * name, username, email, password, 
     * confirm password, islogin
     */
    validateCredentials = async(req, res) => {
        let response = "";
        try {
            let errors = validationResult(req);
            if(errors.errors.length > 0){
                let list = errors.errors;
                let error_list = [];
                for(let x in list){
                   error_list.push(list[x].msg); 
                }
                throw new Error(error_list.join(","));
            }    
        } catch (error) {
            response = error.message;
        }
        return response;
    }

    /**
     * Logout User and end the session
     */
    signOut = async(req, res) => {
        let url = "/login";
        try {
            if(req.session && req.session.user){
                await req.session.destroy((error)=>{
                    if(error){
                        throw new Error(error.message);
                    }
                    res.clearCookie("connect.sid");
                    res.clearCookie("jwtToken"); 
                    return res.redirect(url);          
                });
            }    
        } catch (error) {
            url = "/user/chats";
            req.flash("error", error.message);
        }
        // res.set("Connection", "close");
        // return res.redirect(url);
    }

    /**
     * This function returns the 
     * user's profile info
     * either self or someone else's
     */
    getUserProfileInfo = async(req, res) => {
        const { user_id } = req.params;
        let is_error = false;
        try{
            const user = await users.findOne({where: {"id": user_id}});
            const userReq = new userrequests();
            const userCircle = new usersCircle();
            const [is_error_in_request, is_prev_friend_request_present, is_my_request, error_msg_req] = await userReq.isFriendRequestSend(req.session.user.id, user.id);
            if(is_error_in_request){
                throw new Error(error_msg_req);
            }
            const [is_error, is_already_friend, error_msg] = await userCircle.isUserAlreadyFriend(req.session.user.id, user.id);
            if(is_error){
                throw new Error(error_msg);
            }
            const curr_user = req.session.user;
            let result = "";
            if(is_already_friend && (curr_user.id != user_id)){
                result = await usersCircle.findOne(
                    {
                        where: {
                            friend_user_id:{
                                [Op.or]: [curr_user.id, user_id]
                            },
                            user_id:{
                                [Op.or]: [curr_user.id, user_id]
                            } 
                        }
                    }
                );
            }
            var sendData = {
                "frienduser":user, 
                "curruser": req.session.user, 
                "is_prev_request_present": is_prev_friend_request_present, 
                "is_already_friend": is_already_friend, 
                "is_my_request": is_my_request,
                "user_circle_record": result,
            };
            
        }catch(error){
            is_error = true;
            req.flash("error", error.message);
        }
        return (is_error?res.redirect("/user/chats"):res.render("layouts/index",{partial:"../user-profile", data: sendData}));
    }

    /**
     * This function handles the task of sending
     * friend request to users other then self
     */
    sendFriendRequest = async(req, res) => {
        const{ curr_user, friend_user } = req.body;
        let is_ajax = await helper.isAjax(req, res);
        let response = null;
        let is_error = false;
        try{
            if(curr_user == friend_user){
                throw new Error("Cannot send friend request to self.");
            }
            const userReq = new userrequests();
            const [is_error_in_request, is_prev_friend_request_present, is_my_request, error_msg] = await userReq.isFriendRequestSend(curr_user, friend_user);
            if(is_error_in_request == true){
                throw new Error(error_msg);
            }
            if(is_prev_friend_request_present == true){
                throw new Error("Already friend request send.");
            }
            const userCircle = new usersCircle();
            const [is_error, is_already_friend, error_friend] = await userCircle.isUserAlreadyFriend(curr_user, friend_user);
            if(is_error == true){
                throw new Error(error_friend);
            }
            if(is_already_friend == true){
                throw new Error("Already friend.");
            }
            
            const request_id = uuidv4();
            const data = {"request_user_from": curr_user, "request_user_to": friend_user};
            const request_data = JSON.stringify(data);
            
            await userrequests.create(
                {
                    request_id:request_id, 
                    request_data: request_data, 
                    request_to:friend_user, 
                    request_last_action_by: curr_user,
                    created_by: curr_user,
                })
                .then((request)=>{
                    //
                })
                .catch((error)=>{
                    throw new Error(error.message);
                });
                let sucess_msg = "Sucessfully send the friend request.";
                if(is_ajax){
                    response = {"httpCode": 200, "httpMessage": sucess_msg};
                }else{
                    req.flash("success", sucess_msg);
                }
        }catch(error){
            is_error = true;
            let error_msg = error.message;
            if(is_ajax){
                response = {"httpCode": 500, "httpMessage": error_msg};
            }else{
                req.flash("error", error_msg);
            }
        }
        return (is_ajax?res.json(response):res.redirect("/user/user-profile/"+friend_user)) 
    }

    
}

module.exports = new Users;