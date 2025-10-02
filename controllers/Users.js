
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


	/*
	 *	This function handles whether the user email is already assigned to another user or not
	 * 	@param object user
	 * 	@return boolean 
	*/
	#emailExists = async(user) => {
		let existing_user = await users.findOne({where: {"email": user.email}});
		return (existing_user?true:false);
	}


	/*
	 *	This function handles whether the user username is already assigned to another user or not
	 * 	@param object user
	 * 	@return boolean 
	*/
	#usernameExists = async(user) => {
		let existing_user = await users.findOne({where: {"username": user.username}});
		return (existing_user?true:false);
	}

	/**
	 *	This function handles the password salting rounds
	 *	@param string password	
	 *	@return string
	 *
	*/
	#hashPassword = async(user) => {
		const saltRounds = 10; 
		const password_hashed = await new Promise((resolve, reject) => {
			bcrypt.genSalt(saltRounds, function(err, salt) {
				if(err) throw new Error(err);
				bcrypt.hash(user.password, salt, function(err, hash) {
					if(err) throw new Error(err);
					resolve(hash);
				});
			});
		});
		return password_hashed;
	}

	/**
	 *	This function create/save a new user
	 *	@param object user
	 *	@return object 
	*/
	#saveUser = async(user) => {
		let newUser = null;
		try{
			const new_user = await users.create(user)
				.then(function(newUser){
					return newUser;
				})
				.catch(function(error){
					throw new Error(error);
				});
			newUser = new_user;
		}catch(error){
			newUser = false;
		}
		return newUser;
	}

	/**
	 *	This function compare the user password is valid or not
	 *	@param object user
	 *	@param string password
	 *	@return bool
	*/
	#comparePassword = async(user, password) => {
		const isMatch = await bcrypt.compare(password, user.password_hashed);
		return isMatch;
	}

	/**
	 *	This function get the user JWT token
	 *	@param object user
	 *	@return string
	*/
	#createJWTtoken = async(user) => {	
		const jwtInstance = new JwtToken();
		const token = await jwtInstance.createJWTToken(user);
		return token;
	}

	/**
	 *	This function creates a new user
	 * 	@param object user
	 * 	@param object
	*/
	createUser = async(user) => {
		let response = {};
		try{	
			const emailExist = await this.#emailExists(user);
			if(emailExist == true){
				throw new Error("Please enter another email address already been used.", 409);
			}
			const usernameExist = await this.#usernameExists(user);
			if(usernameExist == true){
				throw new Error("Please enter another username already been used.", 409);
			}
			const password_hashed = await this.#hashPassword(user);
			user.password_hashed = password_hashed;
			const newUser = await this.#saveUser(user);
			if(newUser === false){
				throw new Error("Something went wrong, please try again later", 422);
			}
			response.status = true;
			response.http_code = 200;
			response.message = "User created successfully.";
		}catch(error){
			response.status = false;
			response.http_code = error.code;
			response.message = error.message;
		}	
		return response;
	}

    /**
     * 	Check user exists or not with userID 
     * 	@param int user_id
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
     * 	This function handles register/sign-up from user request
	 * 	@param object req
	 * 	@param object res
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
			let user = {};
			user.name = name;
			user.email = email;
			user.username = username;
			user.password = password;
			const create_response = await this.createUser(user);
			if(create_response.status == false){
				throw new Error(create_response.message, create_response.http_code);
			}
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
     * 	This function handles login/sign-in from user request
	 * 	@param object req
	 * 	@param object res
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
                throw new Error("Username or password is invalid.", 422);
            }
			const isMatch = await this.#comparePassword(user, password);
			if(!isMatch){			
                throw new Error("Username or password is invalid.", 422);
			}
			const token = await this.#createJWTtoken(user);
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
        let response = {};
        try{ 
			let from_user = req.session.user.id;
			let from_user_obj = req.session.user;
			const user = await users.findOne({where: {"id": user_id}});
			if((!user || user.id <= 0) || (!from_user || from_user <= 0)){
				throw new Error("Something went wrong", 404);
			} 
			
            const userReq = new userrequests();
            const userCircle = new usersCircle();
			let to_user = user.id;
			let is_already_friend = false;
			let is_prev_friend_request_present = false;
			let is_my_request = false;
            const user_req_response = await userReq.getFriendRequestList(from_user, to_user);
			if(user_req_response.status == false){
                throw new Error(user_req_response.message, user_req_response.http_code);
            }
			const user_req_result = user_req_response.result;
			if(user_req_result && user_req_result.length > 0){
				is_prev_friend_request_present = true;
			}
            const user_circle_response = await userCircle.isUserAlreadyFriend(from_user, to_user);
            if(user_circle_response.status == false){
                throw new Error(user_circle_response.message, user_cirlce_response.http_code);
            }
			const user_circle_result = user_circle_response.result;
			if(user_circle_result && user_circle_result.length > 0){
				is_already_present = true;
			}	

            let result = "";
            if(is_already_friend && (from_user != to_user)){
                result = await usersCircle.findOne(
                    {
                        where: {
                            friend_user_id:{
                                [Op.or]: [from_user, to_user]
                            },
                            user_id:{
                                [Op.or]: [from_user, to_user]
                            } 
                        }
                    }
                );
            }

			response.status = true;
			response.http_code = 200;
			response.curruser = from_user_obj;
			response.frienduser = user;
			response.is_prev_request_present = is_prev_friend_request_present;
			response.is_already_friend = is_already_friend;
			response.is_my_request = is_my_request;
			
			response.user_circle_record = result; 
       		response.is_self = (user.id == from_user_obj.id);	
			//console.log("A");
			//console.log(response);
			//return;
		}catch(error){
			response.status = false;
			response.http_code = error.code;
			response.message = error.message;
        }
		//console.log(response);
		if(response.status == false){
            req.flash("error", response.message);
			res.redirect("/user/chats");
		}else{
			res.render("layouts/index",{partial:"../user-profile", data: response})
		}
		
        return;
    }

    /**
     *	This function handles the task of sending friend request
	 *	@param object req
	 *	@param object res
	 *	@param object
     */
    sendFriendRequest = async(req, res) => {
        const{ curr_user, friend_user } = req.body;
        let is_ajax = await helper.isAjax(req, res);
		let response = {};
        try{
			let from_user = req.session.user.id;
			let to_user = friend_user;
            if(from_user == to_user){
                throw new Error("Cannot send friend request to self.", 422);
            }
            const userReq = new userrequests();
            const userCircle = new usersCircle();
			let is_prev_friend_request_present = false;
			let is_already_friend = false;
			const user_req_response  = await userReq.getFriendRequestList(from_user, to_user);
            if(user_req_response.status == false){
                throw new Error(user_req_response.message, user_req_response.http_code);
            }
            if(is_prev_friend_request_present == true){
                throw new Error("Already friend request send.", 422);
            }
            const user_circle_response = await userCircle.isUserAlreadyFriend(from_user, to_user);
            if(user_circle_response.status == false){
                throw new Error(user_cirlce_response.message, user_circle_response.http_code);
            }
            if(is_already_friend == true){
                throw new Error("Already friend.", 422);
            }
            
            const request_id = uuidv4();
			let data = {};
			data.request_user_from = from_user;
			data.request_user_to = to_user;
            const request_data = JSON.stringify(data);
            let save_data = {};
			save_data.request_id = request_id;
			save_data.request_data = request_data;
			save_data.request_to = to_user;
			save_data.request_last_action_by = from_user;
			save_data.created_by = from_user;
            const user_request = await userrequests.create(save_data)
                .then((request)=>{
                   	return request;
                })
                .catch((error)=>{
                    throw new Error(error.message, error.code);
                });
			response.status = true;
			response.http_code = 200;
			response.message = "Friend Request is send!";
        }catch(error){
			response.status = false;
			response.http_code = error.code;
			response.message = error.message;
        }
		let flash_status = "success";
		if(response.status == false){
			flash_status = "error";
		}
		if(is_ajax){
			response.httpMessage = response.message;
			res.json(response);
		}else{
			req.flash(flash_status, response.message);
			res.redirect("/user/user-profile/"+to_user);
		}
        return;
    }

    
}

module.exports = new Users;
