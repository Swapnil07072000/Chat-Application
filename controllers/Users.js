
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

class Users{

    //User-exits
    async checkUserExistsOrNot(user_id){
        try{
            const user = await users.findOne({ where: {"id": user_id}});
            return !user?false:true;
        }catch(error){  
            console.error(error);
            return false;
        }
    }

    //Register
    async signUp(req, res){
        const {name, username, email, password, confirm_password} = req.body;
        // console.log(req.body);
        if(password != confirm_password){
            // return res.json({"msg":"Password do not match"});
            return res.redirect("/register");
        }
        try {
            // Check if the user already exists
            const existingUser = await users.findOne({ where: { email } });
            if (existingUser) {
                // return res.status(400).send('User already exists');
                return res.redirect("/register");
            }

            
            // console.log(name, username, password, email);
            const saltRounds = 10; 
            const password_hashed = await new Promise((resolve, reject) => {
                bcrypt.genSalt(saltRounds, function(err, salt) {
                    if(err) throw err;
                    bcrypt.hash(password, salt, function(err, hash) {
                        if(err) throw err;
                        resolve(hash);
                    });
                });
            });
            // console.log(password_hashed);
            await users.create({name, username, password_hashed, email })
                .then(function(newUser){
                    // console.log(newUser);
                })
                .catch(function(error){
                    throw error;
                    // console.log(error);
                });
            // res.send('Registration successful!');
            return res.redirect("/login");
        } catch (error) {
            // res.send('Error registering user'+error);
            return res.redirect("/register");
        }
    }

    //Login
    async signIn(req, res){
        const { username, password } = req.body;
        const user = await users.findOne({where : {username}});
        if(!user){
            return res.redirect("/login");
        }
        const isMatch = bcrypt.compare(password, user.password_hashed);
        if(!isMatch){
            return res.redirect("/login");
        }
        const jwtInstance = new JwtToken();
        const token = jwtInstance.createJWTToken(user);
        res.cookie("jwtToken", token, {
            httpOnly: true
        });
        req.session.user = user;
        return res.redirect("/user/chats");
    }

    //Logout
    async signOut(req, res){
        if(req.session && req.session.user){
            req.session.destroy((error)=>{
                if(error){
                    return res.redirect("/user/chats");
                }
                res.clearCookie("connect.sid");
                res.clearCookie("jwtToken");
                return res.redirect("/login");
            });
        }
        
    }

    //User-Profile Info
    async getUserProfileInfo(req, res){
        const { user_id } = req.params;
        // console.log(user_id);
        
        try{
            const user = await users.findOne({where: {"id": user_id}});
            // return user;
            const [is_error_in_request, is_prev_friend_request_present, is_my_request] = await userrequests.isFriendRequestSend(req.session.user.id, user.id);
            const [is_error, is_already_friend] = await usersCircle.isUserAlreadyFriend(req.session.user.id, user.id);
            // console.log(is_my_request);
            // console.log(is_already_friend);
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
                // console.log(result);
            }
            res.render("user-profile", 
                {
                    "frienduser":user, 
                    "curruser": req.session.user, 
                    "is_prev_request_present": is_prev_friend_request_present, 
                    "is_already_friend": is_already_friend, 
                    "is_my_request": is_my_request,
                    "user_circle_record": result,
                }
            );
        }catch(error){
            // console.log("Error finding the user");
            console.log(error);
            return res.redirect("/user/chats");
        }
        
    }

    //User Friend Request
    async sendFriendRequest(req, res) {
        const{ curr_user, friend_user } = req.body;
        
        try{
            const [is_error_in_request, is_prev_friend_request_present] = await userrequests.isFriendRequestSend(curr_user, friend_user);
            if(is_error_in_request == true){
                let response = {"httpCode": 500, "httpMessage": "Error in sending friendrequest."};
                return res.json(response);
            }
            if(is_prev_friend_request_present == true){
                let response = {"httpCode": 200, "httpMessage": "Friend request already been send."};
                return res.json(response);
            }
            
            const [is_error, is_already_friend] = await usersCircle.isUserAlreadyFriend(curr_user, friend_user);
            if(is_error == true){
                let response = {"httpCode": 500, "httpMessage": "Error in sending friendrequest."};
                return res.json(response);
            }
            if(is_already_friend == true){
                let response = {"httpCode": 200, "httpMessage": "Already friend with user."};
                return res.json(response);
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
                    if(!request.id){
                        let response = {"httpCode": 500, "httpMessage": "Error in sending friendrequest."};
                        return res.json(response);    
                    }
                })
                .catch((error)=>{
                    throw error;
                });
            
            let response = {"httpCode": 200, "httpMessage": "Friend request send successfully."};
            return res.json(response);
        }catch(error){
            console.log(error);
            let response = {"httpCode": 500, "httpMessage": "Error in sending friendrequest."};
            return res.json(response);
        }
        // try{
        //     const circle_id = uuidv4();
        //     await usersCircle.create({circle_id, curr_user, friend_user});
        //     let response = {"httpCode": 200, "httpMessage": "Friend request send successfully"};
        //     return res.json(response);
        // }catch(error){
        //     let response = {"httpCode": 500, "httpMessage": "Error Friend request send successfully"};
        //     return res.json(response);
        // }
    }

    generateDatabaseDateTime = (date = null) => {
        if(!date){
            date = new Date();
        }
        return date.toISOString().replace("T"," ").substring(0, 19);
    }
}

module.exports = new Users;