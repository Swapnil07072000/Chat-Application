// const users = require("../models/Users");
const chatgroups = require('../models/ChatGroups');
const chatsgroupusers = require('../models/ChatsGroupUsers');
const userrequests = require("../models/UserRequests");
const userscircle = require("../models/UsersCircle");
const userschatsmessages = require('../models/UsersChatsMessages');
// const bcrypt = require("bcryptjs");
// const session = require('express-session');
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

class Chats{
    constructor(){
        //
        // this.init();
        // this.acceptRequest = this.acceptRequest.bind(this);
        this.valid_actions = ["accept", "reject", "cancel"];
        this.valid_actions_status = ['-1', '1', '-2'];
    }

    //Get All the groups
    async getAllGroups(req, res){
        const user = req.session.user;

        // console.log(user.id, req.session.user.data.id);
        const user_id = user.id;
        // const selfCreatedGroups = await chatgroups.findAll({where: {user_id}});
        // console.log(chatsgroupusers);
        // console.log(user_id);
        const [chat_id_list, all_groups_list] = await chatgroups.getAllGroupForUser(user_id);
        // console.log(all_groups_list);
        const other_groups_list = await chatgroups.getAllGroup(chat_id_list, user_id);
        // console.log(other_groups_list);
        const private_chat_list = await chatgroups.getPrivateChatGroups(user_id);
        // console.log({groups: all_groups_list, other_groups: other_groups_list, user: user});
        // console.log(private_chat_list);
        res.render("chats", {groups: all_groups_list, other_groups: other_groups_list, private_chat_group_list: private_chat_list, user: user}); 
    }

    //Group Creation
    createGroup = async(req, res) => {
        const user = req.session.user;
        var user_id = user.id;
        const {groupName, groupDescription, users} = req.body;
        const chat_id = uuidv4();
        const chat_name = groupName;
        const chat_description = groupDescription;
        // const current_timestamp = this.generateDatabaseDateTime();
        // const chat_id = await jwt.sign({ uuid: uuid}, current_timestamp, { algorithm: 'HS256' });
        // console.log(chat_description);
        try{
            const [is_error, response] = await this.createGroupAndAddUsers(chat_id, chat_name, chat_description, user_id, users);
            // const group = await chatgroups.create({chat_id, chat_name, chat_description, user_id});
            // const group_users = await chatsgroupusers.create({chat_id, user_id})
            //     .catch((error)=>{
            //         throw error;
            //     });
            // if(users){
            //     for(user_id in users){
            //         await chatsgroupusers.create({chat_id, user_id})
            //             .then(()=>{})
            //             .catch((error)=>{
            //                 throw error;
            //             });
            //     }
            // }
            // console.log(is_error);
            if(is_error == true){
                throw response;
            }
        }catch(error){
            console.log(error);
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
            const [is_error, is_present, result] = await chatsgroupusers.isUserAlreadyPresentInGroup(user_id, chat_id);
            // console.log(is_error, is_present, result);
            // console.log("a");
            if(is_error){
                return res.json({"error":"Something went wrong."});
            }
            if(!is_present){
                req.flash("error", "You are not the memeber of this group. Please first join this group.");
                return res.redirect("/user/chats");
            }
            const chat_records = await chatsgroupusers.getChatRecords(user_id, chat_id);
            // console.log(is_valid);
            // console.log(chat_records);
            // console.log(chat_records.chat_name);
            const chat_data = {
                "chat_group_name":chat_records[0].chat_name, 
                "user": user,
                "is_present_in_group": is_present,
            };
            // console.log(chat_data);
            res.render("chat-page", chat_data);
            // const chat_records = await chatsgroupusers.getChatRecords(user_id, chat_id);
        }catch(error){
            console.error(error);
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
            // console.log("BB");
            const [is_error, is_already_present_in_group, result] = await chatsgroupusers.isUserAlreadyPresentInGroup(user_id, chat_id);
            // console.log(is_error);
            // console.log("BB");
            if(is_error){
                throw result;
            }
            // console.info(is_already_present_in_group);
            if(is_already_present_in_group){
                // res.redirect("/user/chats");
                return res.json({"error":"User already present in this group"});
            }
            // console.log("A");
            if(!is_already_present_in_group){
                const join_user = await chatsgroupusers.create({chat_id, user_id});
            }
            
            // res.redirect("chats");
            res.redirect("/user/chats");
        }catch(error){
            // console.log(error);
            return res.json({"error":"Error faced while fetching the chats"});
        }
    }

    generateDatabaseDateTime = (date = null) => {
        if(!date){
            date = new Date();
        }
        return date.toISOString().replace("T"," ").substring(0, 19);
    }

    async getAllFriendRequestsForUser(req, res){
        const {from} = req.query;
        let back_url = "";
        if(from){
            switch(from){
                case "profile":
                    const {user_id} = req.query;
                    if(!user_id){
                        back_url = "/user/user-profile";
                    }else{
                        back_url = "/user/user-profile/"+user_id;
                    }
                    
                break;
            }
        }
        const user = req.session.user;
        const [is_error, friendRequests, friendRequestsFromOthers] = await userrequests.getAllFriendRequestsForUser(user.id);
        res.render("listfriendrequests",{sentRequests: friendRequests,receivedRequests: friendRequestsFromOthers, backURL: back_url });
    }

    createGroupAndAddUsers = async(...args)=>{
        const [chat_id, chat_name, chat_description, user_id, users, is_group] = args;
        // console.log(args);
        // console.log(chat_id, chat_name, chat_description, user_id, users);
        try{
            // console.log(typeof is_group);
            const is_group_or_private_chat = is_group==undefined?'1':'0';
            const group = await chatgroups.create({chat_id, chat_name, chat_description, user_id, is_group: is_group_or_private_chat});
            const group_users = await chatsgroupusers.create({chat_id, user_id})
                .catch((error)=>{
                    throw error;
                });
            if(users){
                // console.log(users);
                users.forEach(async(each_user_id) => {
                    console.log(each_user_id);
                    await chatsgroupusers.create({chat_id, user_id:each_user_id})
                        .then(()=>{})
                        .catch((error)=>{
                            throw error;
                        });
                }); 
            }
            const response = {"httpCode": 200, "httpMessage": "Successfully"};
            return [false, response];
        }catch(error){
            return [true, error];
        }
        
    }

    //Perform action on user request
    actionOnRequest = async (req, res)=>{
        const {requestId} = req.body;
        var {actionType} = req.params;
        const action =  (actionType.trim()).toLowerCase();
        // console.log(action, requestId);
        const curr_user = req.session.user;
        try{
            const request = await userrequests.findOne({where: {request_id: requestId, published: '1'}});
            // console.log(request);
            if(!request){
                let response = {"httpCode": 403, "httpMessage": "Request ID is invalid"};
                return res.json(response);
            }
            // const valid_actions = ["accept", "reject", "cancel"];
            if(!this.valid_actions.includes(action)){
                let response = {"httpCode": 500, "httpMessage": "Action is not valid"};
                return res.json(response);
            }
            if(this.valid_actions_status.includes(request.status)){
                let response = {"httpCode": 500, "httpMessage": "Action has already been performed on these request"};
                return res.json(response);
            }
            let response = {}, is_error = false;
            switch(action){
                case "accept": //1
                    [is_error, response] = await this.acceptRequest(requestId, curr_user);
                break;
                case "reject": //-1
                    [is_error, response] = await this.rejectRequest(requestId, curr_user);
                break;
                case "cancel": //-2
                    [is_error, response] = await this.cancelRequest(requestId, curr_user);
                break;
            }
            if(is_error){
                // let response = {"httpCode": 500, "httpMessage": "Error performing the action"};
                return res.json(response);
            }
            // response = {"httpCode": 200, "httpMessage": "Successfully accepted request"};
            return res.json(response);
            
        }catch(error){
            // console.log(error);
            let response = {"httpCode": 500, "httpMessage": "Error performing the action"};
            return res.json(response);
        }
    }

    //Accept-Request -> 1
    async acceptRequest(requestId, curr_user){
        
        try{
            const request = await userrequests.findOne({where: {request_id: requestId, published: '1'}});
            // console.log(request);
            if(!request){
                let response = {"httpCode": 403, "httpMessage": "Request ID is invalid"};
                return [true, response];
            }
            // console.log(request.status);
            if(this.valid_actions_status.includes(request.status)){
                let response = {"httpCode": 500, "httpMessage": "Action has already been performed on these request"};
                return [true, response];
            }
            console.log("A");
            //First accept the tranction/request
            let request_data = JSON.parse(request.request_data);
            // console.log(request_data.request_user_from);  
            const chat_id = uuidv4();
            const chat_name = "Private Chat", chat_description = "This is private chat description of users";
            const user_id = request_data.request_user_from;
            const users = [request_data.request_user_to];
            // console.log("A");
            await userrequests.update(
                {status: '1', request_last_action_by:request_data.request_user_to},
                {where: {request_id: requestId}}
            )
            .catch((error)=>{throw error;});
            
            await this.createGroupAndAddUsers(chat_id, chat_name, chat_description, user_id, users, 0);
            const circle_id = uuidv4();
            // console.log("New");
            // console.log({circle_id, 
            //     friend_user_id: request_data.request_user_to,
            //     user_id: request_data.request_user_from,
            //     chat_id,
            //     request_id: requestId,
            // });
            await userscircle.create(
                {circle_id, 
                friend_user_id: request_data.request_user_to,
                user_id: request_data.request_user_from,
                chat_id,
                request_id: requestId,
            }).catch((error)=>{
                console.log(error);
                throw error;
            });
            // console.log('A');
            let response = {"httpCode": 200, "httpMessage": "Accept action performed successfully"};
            return [false, response];
        }catch(error){
            let response = {"httpCode": 500, "httpMessage": "Accept action cannot be performed"};
            return [true, response];
        }
    }

    //Reject Request -> -1
    async rejectRequest(requestId, curr_user){
        try {
            const request = await userrequests.findOne({where: {request_id: requestId, published: '1'}});
            // console.log(request);
            if(!request){
                let response = {"httpCode": 403, "httpMessage": "Request ID is invalid"};
                return [true, response];
            }
            if(this.valid_actions_status.includes(request.status)){
                let response = {"httpCode": 500, "httpMessage": "Action has already been performed on these request"};
                return [true, response];
            }
            let request_data = JSON.parse(request.request_data);
            await userrequests.update(
                {status: '-1', request_last_action_by:request_data.request_user_to},
                {where: {request_id: requestId}}
            )
            .catch((error)=>{throw error;});
            let response = {"httpCode": 200, "httpMessage": "Reject action performed successfully"};
            return [false, response];
        } catch (error) {
            console.log(error);
            let response = {"httpCode": 500, "httpMessage": "Reject action cannot be performed"};
            return [true, response];
        }
    }

    //Cancel Request -> -2
    async cancelRequest(requestId, curr_user){
        try {
            const request = await userrequests.findOne({where: {request_id: requestId, published: '1'}});
            // console.log(request, requestId);
            if(!request){
                let response = {"httpCode": 403, "httpMessage": "Request ID is invalid"};
                return [true, response];
            }
            if(this.valid_actions_status.includes(request.status)){
                let response = {"httpCode": 500, "httpMessage": "Action has already been performed on these request"};
                return [true, response];;
            }
            let request_data = JSON.parse(request.request_data);
            const user_id = request_data.request_user_from;
            // console.log(user_id, curr_user.id);
            if(user_id != curr_user.id){
                let response = {"httpCode": 403, "httpMessage": "This friend request was not send by you."};
                return [true, response];
            }
            await userrequests.update(
                {status: '-2', request_last_action_by:user_id},
                {where: {request_id: requestId}}
            )
            .catch((error)=>{throw error;});
            let response = {"httpCode": 200, "httpMessage": "Reject action performed successfully"};
            return [false, response];
        } catch (error) {
            console.log(error);
            let response = {"httpCode": 500, "httpMessage": "Cancel action cannot be performed"};
            return [true, response];
        }
    }
}

module.exports = new Chats;