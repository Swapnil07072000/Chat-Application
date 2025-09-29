const RedisClient = require("../config/redis");
// await new RedisClient();
const users = require("../models/Users");



const userschatsmessages = require("../models/UsersChatsMessages");
const CryptoService = require("../config/encryptdecrypt");
const jwtTokenVerify = require("../middlewares/verifyToken");

const fileUpload = require("../controllers/FileUpload");
const fileUploadModel = require("../models/FileUpload");
const { v4: uuidv4 } = require("uuid");
const fileModel = require("../models/FileUpload");
require("../config/messageWorkerService");

class ChatSocket {
    constructor(io) {
      this.io = io;
      this.initializeSocketConnection();
      this.redisClient = null;
      // this.io.engine.use((req, res, next)=>{
      //   jwtTokenVerify.handle(req, res, next);
      // })
    }
    
    
    
    // Initialize the socket connection
    initializeSocketConnection() {
      // this.io.use((socket, next) => {
      //   // let tk = new jwtTokenVerify();
      //   // this.next = next;
      //   jwtTokenVerify.handleSocket(socket, next);
      // });

      

      this.io.on('connection', async(socket) => {
        // console.log(this.next);
        console.log('A user connected '+socket.id);
        await this.getRedisClient();
        this.joinChatGroup(socket);
        // Register event listeners for this socket
        this.handleMessage(socket);
  
        this.getChatGroupData(socket)
        socket.on("ping", ()=>{
          socket.emit("pong");
        })
        // Handle disconnection
        socket.on('disconnect', () => {
          console.log('A user disconnected');
        });
        /*
        this.io.use((socket, next) => {
          const err = new Error("not authorized");
          err.data = { content: "Please retry later" }; // additional details
          next(err);
        });
        */  
      });
      
    }
  
    async  getRedisClient(){
      try{
        // const redisClient = 
        const redisInstance = await (new RedisClient());        
        this.redisClient = redisInstance.getClient();
        // this.redisClient = RedisClient.getClient();
      }catch(error){
        console.log("Error1");
      }
      
    }

    // Handle incoming chat messages
    handleMessage(socket, next) {
      const options = {  
        weekday: "short", year: "numeric", month: "short",  
        day: "numeric", 
        hour: "2-digit", minute: "2-digit"  
      };
      const display_options = {  
        // weekday: "short", year: "numeric", month: "short",  
        // day: "numeric", 
        hour: "2-digit", minute: "2-digit"  
      };
      socket.on('chat message', async(msg) => {
        const file_model = new fileModel();
        // this.authenticateTheSockets(socket, this.next);
        const fileResponse = await file_model.getFilesMap(msg.roomID, null, msg.user_id);
        // console.log(msg.message, fileResponse);
        if(fileResponse.status == false){
          throw new Error(fileResponse.error_msg);
        }
        const fileMap = fileResponse.fileMap;
        const fileIds = [];
		//console.log(msg);
		const data = msg.data;
        const message = data.message;
        for(let key in fileMap){
          if(fileMap.hasOwnProperty(key)){
            if(message.includes(key)){
              let fileObj = fileMap[key];
              fileIds.push(fileObj.file_id);
            }
          }
        }
        //console.log('Message '+data.message+' to room ' + msg.roomID);
        // const msg_result = {};
        if(msg.roomID){
          try{
            
            // this.redisClient.publish("chat_messages", JSON.stringify(msg));
            const message_id = uuidv4();
            const cryptoInstance = new CryptoService();
            const encryptedText = cryptoInstance.encrypt(data.message);
            const message_data = await userschatsmessages.create({
                message_id: message_id,
                chat_id: msg.roomID,
                user_id: msg.user_id,
                message: encryptedText,
            })
            if(message_data.id > 0){
              for(let key in fileIds){
                const file_id  = fileIds[key];
                // console.log(file_id, message_data.message_id); 
                await fileModel.update(
                  {
                    msg_id: message_data.message_id,
                    commited: '1'
                  },{
                    where: {
                      file_id: file_id
                    }
                  }
                );

              }
				//if(data.files){
				//console.log(data.files);
              	//const file = new fileUploadModel();
              	//await file.upload(data.files, msg.roomID, message_data.message_id);  
		//	}
			  //console.log("A");

              const processed_chat_record = await userschatsmessages.getChatMessagesFromChatID(message_data.chat_id, message_data.user_id, message_data.message_id);
             // console.log(processed_chat_record);
              
              this.io.to(msg.roomID).emit('chat message', processed_chat_record);
			}
			            
            // getChatGroupData(socket, msg.roomID, msg.user_id);
          }catch(error){
            console.log("Error2: "+error);
          }
          
        }else{
          // Emit the message to all connected clients
          this.io.emit('chat message', msg.message);
        }
        
      });

      socket.on('edit message', async(msg) => {
        // socket.use();
        // this.authenticateTheSockets(socket, this.next);
        try{
          const cryptoInstance = new CryptoService();
          const encryptedText = cryptoInstance.encrypt(msg.message);
          // console.log(encryptedText, msg.message);
          const messageData = await userschatsmessages.findOne({where: {message_id: msg.message_id, chat_id: msg.roomID}});
          if(!messageData.id){
            throw "This message does not belongs to this group";
          }
          const update_record = await userschatsmessages.update(
            {message: encryptedText, updated_at: new Date()},
            {where: {message_id: msg.message_id, chat_id: msg.roomID}});
          const processed_chat_record = await userschatsmessages.getChatMessagesFromChatID(msg.roomID, msg.user_id, msg.message_id);
          // const messageData = await userschatsmessages.findOne({where: {message_id: msg.message_id}});
          this.io.to(msg.roomID).emit('edit message', processed_chat_record);
        }catch(error){
          console.error("Error in updating record: "+error);
        }
      });

      socket.on("delete message", async(msg)=>{
        try{
          const messageData = await userschatsmessages.findOne({where: {message_id: msg.msg_id, chat_id: msg.roomID}});
          if(!messageData.id){
            throw "This message does not belongs to this group";
          }
          await userschatsmessages.update(
            {published: '0', updated_at: new Date()},
            {where: {message_id: msg.msg_id, chat_id: msg.roomID}}
          );
          // const processed_chat_records = await userschatsmessages.getChatMessagesFromChatID(msg.roomID, msg.user_id);
          // socket.emit("messagesOfChatGroup", processed_chat_records);
          let resp = {msg_id: msg.msg_id};
          //socket.emit("delete message", resp);
		  this.io.to(msg.roomID).emit("delete message", resp);  
        }catch(error){
          console.log("Error in deleting messages: "+error);
        }
      })
    }

    joinChatGroup(socket){
      socket.on("joinChatGroup", (roomID)=>{
        // this.authenticateTheSockets(socket, this.next);
        console.log("Socket "+socket.id+" joined the Room "+roomID);
        socket.join(roomID);
      })
    }

    async getChatGroupData(socket, param_chat_id=null, param_user_id=null){
      if(!param_chat_id && !param_user_id){
        socket.on("getChatGroupMessages", async(chat_cred)=>{
          // this.authenticateTheSockets(socket, this.next);
          // console.log(chat_cred);
          const chat_id = chat_cred.chat_id;
          const user_id = chat_cred.user_id;
          const processed_chat_records = await userschatsmessages.getChatMessagesFromChatID(chat_id, user_id);
          // console.log(processed_chat_records);
          // processed_chat_records = ["A":{"a":'A'}];
          socket.emit("messagesOfChatGroup", processed_chat_records);
        })
      }else{
        const processed_chat_records = await userschatsmessages.getChatMessagesFromChatID(param_chat_id, param_user_id);
        socket.emit("messagesOfChatGroup", processed_chat_records);
      }
      
    }

    
  }
  
  module.exports = ChatSocket;
  
