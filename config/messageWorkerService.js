const RedisClient = require("../config/redis");
// const redisInstance = new RedisClient();
// const subscriber = redisInstance.getClient();
const userschatsmessages = require('../models/UsersChatsMessages');
const CryptoService = require("../config/encryptdecrypt");

const { v4: uuidv4 } = require("uuid");

class MessageWorker{
    constructor(){
        this.redisInstance = null;
        this.redisClient = null;
        this.setUpSubscriber();
    }

    async setUpRedisConnection(){
        try{
            this.redisInstance = await (new RedisClient());
            this.redisClient = this.redisInstance.getClient();
        }catch(error){
            console.log("Error in set up redis in message worker file "+error);
        }
        
    }

    async setUpSubscriber() {
        try{
            
            await this.setUpRedisConnection();
            this.redisClient.subscribe("chat_messages", async (message) => {
                const messageData = JSON.parse(message);     
                try {
                    // console.log(messageData);
                    // console.log(messageData.chat_id)
                    // Save the message to the database
                    const message_id = uuidv4();
                    const cryptoInstance = new CryptoService();
                    // console.log(messageData.message);
                    const encryptedText = cryptoInstance.encrypt(messageData.message);
                    await userschatsmessages.create({
                        message_id: message_id,
                        chat_id: messageData.roomID,
                        user_id: messageData.user_id,
                        message: encryptedText,
                    })
                    
                } catch (error) {
                    console.error('Error saving message of Redis subscriber:', error);
                }
            });
        }catch(error){
            console.error("Error in set up of Redis subscriber "+error);
        }
    }
}



// Subscribe to the Redis channel
module.exports = new MessageWorker();