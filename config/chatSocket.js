const RedisClient = require("../config/redis");
// await new RedisClient();
const users = require("../models/Users");



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
            const user_id = msg.user_id;
            // console.log(user_id);
            const user = await users.findOne({where: {id: user_id}}); 
            // console.log(msg);
            msg.chat_of_user = user.username;
            this.io.to(msg.roomID).emit('chat message', msg);
            // getChatGroupData(socket, msg.roomID, msg.user_id);
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

    async getChatGroupData(socket, param_chat_id=null, param_user_id=null){
      if(!param_chat_id && !param_user_id){
        socket.on("getChatGroupMessages", async(chat_cred)=>{
          // console.log(chat_cred);
          const chat_id = chat_cred.chat_id;
          const user_id = chat_cred.user_id;
          const processed_chat_records = await userschatsmessages.getChatMessagesFromChatID(chat_id, user_id);
          // console.log(processed_chat_records);
          socket.emit("messagesOfChatGroup", processed_chat_records);
        })
      }else{
        const processed_chat_records = await userschatsmessages.getChatMessagesFromChatID(param_chat_id, param_user_id);
        socket.emit("messagesOfChatGroup", processed_chat_records);
      }
      
    }

    
  }
  
  module.exports = ChatSocket;
  