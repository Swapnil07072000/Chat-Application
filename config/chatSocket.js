const RedisClient = require("../config/redis");
// await new RedisClient();


const userschatsmessages = require("../models/UsersChatsMessages");
require("../config/messageWorkerService");

class ChatSocket {
    constructor(io) {
      this.io = io;
      this.initializeSocketConnection();
      this.redisClient = null;
    }
    
    

    // Initialize the socket connection
    initializeSocketConnection() {
      this.io.on('connection', async(socket) => {
        console.log('A user connected '+socket.id);
        await this.getRedisClient();
        this.joinChatGroup(socket);
        // Register event listeners for this socket
        this.handleMessage(socket);
        
        this.getChatGroupData(socket)

        // Handle disconnection
        socket.on('disconnect', () => {
          console.log('A user disconnected');
        });
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
    handleMessage(socket) {
      socket.on('chat message', async(msg) => {
        console.log('Message '+msg.message+' to room ' + msg.roomID);
        // const msg_result = {};
        if(msg.roomID){
          // console.log(redisClient);
          try{
            await this.redisClient.publish("chat_messages", JSON.stringify(msg));
            this.io.to(msg.roomID).emit('chat message', msg.message);
          }catch(error){
            console.log("Error2: "+error);
          }
          
        }else{
          // Emit the message to all connected clients
          this.io.emit('chat message', msg.message);
        }
        
      });
    }

    joinChatGroup(socket){
      socket.on("joinChatGroup", (roomID)=>{
        console.log("Socket "+socket.id+" joined the Room "+roomID);
        socket.join(roomID);
      })
    }

    getChatGroupData(socket){
      socket.on("getChatGroupMessages", async(chat_cred)=>{
        // console.log(chat_cred);
        const chat_id = chat_cred.chat_id;
        const chat_records = await userschatsmessages.findAll({where: {chat_id: chat_id, published: '1'} });
        // console.log(chat_records);
        var processed_chat_records = [];
        chat_records.forEach((per_record)=>{
          // console.log(per_record);
          let ind_record = {};
          ind_record.chat_id = per_record.chat_id;
          ind_record.message = per_record.message;
          ind_record.user_id = per_record.user_id;
          ind_record.self = (per_record.user_id == chat_cred.user_id)?true:false;
          processed_chat_records.push(ind_record);
        });
        console.log(processed_chat_records);
      })
    }
  }
  
  module.exports = ChatSocket;
  