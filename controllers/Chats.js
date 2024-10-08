// const users = require("../models/Users");
const chatgroups = require('../models/ChatGroups');
const chatsgroupusers = require('../models/ChatsGroupUsers');
const userschatsmessages = require('../models/UsersChatsMessages');
// const bcrypt = require("bcryptjs");
// const session = require('express-session');
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

class Chats{
    constructor(){
        //
    }

    //Get All the groups
    async getAllGroups(req, res){
        const user = req.session.user;

        // console.log(user.id, req.session.user.data.id);
        const user_id = user.id;
        // const selfCreatedGroups = await chatgroups.findAll({where: {user_id}});
        // console.log(chatsgroupusers);
        const [chat_id_list, all_groups_list] = await chatgroups.getAllGroupForUser(user_id);
        // console.log(all_groups_list, chat_id_list);
        const other_groups_list = await chatgroups.getAllGroup(chat_id_list);
        // console.log(other_groups_list);
        res.render("chats", {groups: all_groups_list, other_groups: other_groups_list, user: user}); 
    }

    //Group Creation
    async createGroup(req, res){
        const user = req.session.user;
        var user_id = user.id;
        const {groupName, users} = req.body;
        const chat_id = uuidv4();
        const chat_name = groupName;
        // const current_timestamp = this.generateDatabaseDateTime();
        // const chat_id = await jwt.sign({ uuid: uuid}, current_timestamp, { algorithm: 'HS256' });
        try{
            const group = await chatgroups.create({chat_id, chat_name, user_id});
            const group_users = await chatsgroupusers.create({chat_id, user_id})
                .catch((error)=>{
                    throw error;
                });
            if(users){
                for(user_id in users){
                    await chatsgroupusers.create({chat_id, user_id})
                        .then(()=>{})
                        .catch((error)=>{
                            throw error;
                        });
                }
            }
        }catch(error){
            return res.json({"status": 401, "msg":"Error"});
        }
        
        return res.json({"status": 200, "msg": "Group created successfully"});

    }

    //Chat records
    async getChatById(req, res){
        const {chat_id} = req.params;
        // console.log(chat_id);
        // console.log("CS");
        const user = req.session.user;
        const user_id = user.id;
        try{
            const is_valid = await chatgroups.isValidChatGroup(chat_id);
            if(!is_valid){
                return res.json({"error":"No such chat group exists"});    
            }
            const chat_records = await chatsgroupusers.getChatRecords(user_id, chat_id);
            // console.log(is_valid);
            // console.log(chat_records[0].chat_name);
            // console.log(chat_records.chat_name);
            res.render("chat-page", {"chat_group_name":chat_records[0].chat_name, "user": user});
            // const chat_records = await chatsgroupusers.getChatRecords(user_id, chat_id);
        }catch(error){
            return res.json({"error":"Error faced while fetching the chats"});
        }
    }

    async joinChatGroup(req, res){
        const {chat_id} = req.params;
        // console.log(chat_id);
        const user = req.session.user;
        const user_id = user.id;
        try{
            const is_valid = await chatgroups.isValidChatGroup(chat_id);
            if(!is_valid){
                return res.json({"error":"No such chat group exists"});    
            }
            const join_user = await chatsgroupusers.create({chat_id, user_id});
            // res.redirect("chats");
            res.redirect("/user/chats");
        }catch(error){
            return res.json({"error":"Error faced while fetching the chats"});
        }
    }

    generateDatabaseDateTime = (date = null) => {
        if(!date){
            date = new Date();
        }
        return date.toISOString().replace("T"," ").substring(0, 19);
    }
}

module.exports = new Chats;