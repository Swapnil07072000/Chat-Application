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
        // console.log(user.id);
        const user_id = user.id;
        // const selfCreatedGroups = await chatgroups.findAll({where: {user_id}});
        // console.log(chatsgroupusers);
        const all_groups_list = await chatsgroupusers.getAllGroupForUser(user_id);
        // console.log(all_groups_list);
        res.render("chats", {groups: all_groups_list}); 
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

    generateDatabaseDateTime = (date = null) => {
        if(!date){
            date = new Date();
        }
        return date.toISOString().replace("T"," ").substring(0, 19);
    }
}

module.exports = new Chats;