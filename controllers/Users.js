
const users = require('../models/Users');
const bcrypt = require("bcryptjs");
// const session = require('express-session');
// const jwt = require("jsonwebtoken");
const JwtToken = require("../config/jwtToken");

class Users{

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
}

module.exports = new Users;