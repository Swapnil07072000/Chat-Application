require("dotenv").config();
const { Model, DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/db'); // Adjust the path as needed

const CryptoService = require("../config/encryptdecrypt");

class UsersChatsMessages extends Model {

  static async getChatMessagesFromChatID(chat_id, user_id){
    // const chat_records = await userschatsmessages.findAll({where: {chat_id: chat_id, published: '1'} });
    let chat_records = "";
    let limit = process.env.CHAT_MESSAGE_LIMIT;
    if(!limit) limit = 50;
    limit = parseInt(limit);
    try{
      chat_records = await sequelize.query(
        `
          SELECT g.*, u.username FROM users_chats_messages AS g
          LEFT JOIN users AS u
          ON (g.user_id = u.id)
          WHERE g.chat_id = :chat_id
          AND g.published = '1'
          LIMIT :limit
        `,
        {
          replacements: {chat_id, limit},
          type: Sequelize.QueryTypes.SELECT,
        }
      );
    }catch(error){
      return error;
    }
    
    // console.log(chat_records);
    var processed_chat_records = [];
    const cryptoInstance = new CryptoService();
    chat_records.forEach((per_record)=>{
      // console.log(per_record);
      let ind_record = {};
      ind_record.chat_of_user = per_record.username;
      ind_record.chat_id = per_record.chat_id;
      let decryptedText = cryptoInstance.decrypt(per_record.message);
      ind_record.message = decryptedText;
      ind_record.user_id = per_record.user_id;
      ind_record.self = (per_record.user_id == user_id)?true:false;
      ind_record.created_on = ((new Date(per_record.created_at)).toUTCString().replace(' GMT', ''));
      processed_chat_records.push(ind_record);
    });
    return processed_chat_records;
  }
}

UsersChatsMessages.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    message_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true, 
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    chat_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: 'chat_groups', 
        key: 'chat_id',
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // Reference to the User model
        key: 'id',
      },
    },
    published: {
      type: DataTypes.ENUM('0', '1'),
      defaultValue: '1',
    },
    created_at: {
        type: DataTypes.DATE(3),
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP(3)'),
    },
    updated_at: {
        type: DataTypes.DATE(3),
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP(3)'),
        onUpdate: sequelize.literal("CURRENT_TIMESTAMP(3)"),
    },
  },
  {
    sequelize,
    modelName: 'UsersChatsMessages',
    tableName: 'users_chats_messages', // Specify the table name
    timestamps: false, // Disable automatic timestamps since we're using custom fields
  }
);

module.exports = UsersChatsMessages;
