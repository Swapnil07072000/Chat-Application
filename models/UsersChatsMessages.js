require("dotenv").config();
const path = require("path");
const { Model, DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/db'); // Adjust the path as needed

const CryptoService = require("../config/encryptdecrypt");
const fileUpload = require("../models/FileUpload");
const rootPath = path.resolve(__dirname, '../');

class UsersChatsMessages extends Model {

  static async getChatMessagesFromChatID(chat_id, user_id, message_id=null){
    // const chat_records = await userschatsmessages.findAll({where: {chat_id: chat_id, published: '1'} });
    let chat_records = "";
    let limit = process.env.CHAT_MESSAGE_LIMIT;
    let edit_timeout = process.env.MSG_EDIT_TIMEOUT;
    let delete_timeout = process.env.MSG_DELETE_TIMEOUT;
    var fileResponse = "";
    const fileModel = new fileUpload();
    if(!limit) limit = 50;
    limit = parseInt(limit);
    try{
      let query = "";
      if(!message_id){
        query = `
          SELECT 
          g.*, u.username 
          FROM users_chats_messages AS g
          LEFT JOIN users AS u
          ON (g.user_id = u.id)
          WHERE g.chat_id = '${chat_id}'
          AND g.published = '1'
          ORDER BY g.id DESC
          LIMIT ${limit}
        `;
        fileResponse = await fileModel.getFilesMap(chat_id, null, null, 1);
      }else{
        query = `
          SELECT 
          g.*, u.username 
          FROM users_chats_messages AS g
          LEFT JOIN users AS u
          ON (g.user_id = u.id)
          WHERE g.chat_id = '${chat_id}'
          AND g.published = '1'
          AND g.message_id = '${message_id}'
          ORDER BY id DESC
          LIMIT 1;
        `;
        fileResponse = await fileModel.getFilesMap(chat_id, message_id, null, 1);
      }
      chat_records = await sequelize.query(
        query,
        {
          type: Sequelize.QueryTypes.SELECT,
        }
      );
		//console.log(query);
		//console.log(chat_records);
      // console.log(query, chat_records);
    }catch(error){
      console.log(error.message);
      return error;
    }
    
    
    var processed_chat_records = [];
    const cryptoInstance = new CryptoService();
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
	//console.log(chat_id);
	//console.log(fileResponse);    
    const chatMap = fileResponse["chatMap"] && Object.keys(fileResponse["chatMap"]).length > 0?fileResponse["chatMap"]:{}; 
   	//console.log(chatMap);
	for(let key in chat_records){
      if(chat_records.hasOwnProperty(key)){
        let ind_record = {};
        let per_record = chat_records[key];  
        ind_record.chat_of_user = per_record.username;
        ind_record.chat_id = per_record.chat_id;
        //if(per_record.user_id == user_id){
          ind_record.message_id = per_record.message_id;
        //}else ind_record.message_id = null;
        let decryptedText = cryptoInstance.decrypt(per_record.message);
        ind_record.message = decryptedText;
        ind_record.user_id = per_record.user_id;
        ind_record.self = (per_record.user_id == user_id)?true:false;
        let timeout_mins = ((new Date())-(new Date(per_record.created_at)))/(1000*60);
        // console.log(timeout_mins);
        if(timeout_mins <= edit_timeout){
          ind_record.allow_edit = true;
        }
        if(timeout_mins <= delete_timeout){
          ind_record.allow_delete = true;
        }
        let created_at_timestamp = new Date(per_record.created_at).getTime();
        let updated_at_timestamp = new Date(per_record.updated_at).getTime();
        if(created_at_timestamp != updated_at_timestamp){
          // console.log(per_record.id);
          /*
          if(ind_record.allow_edit == true){
            ind_record.created_on = ((new Date(per_record.created_at)).toLocaleTimeString(undefined, options));
            ind_record.timestamps = ((new Date(per_record.created_at)).toLocaleTimeString(undefined, display_options));
          }else{
          */
          ind_record.created_on = ((new Date(per_record.created_at)).toLocaleTimeString(undefined, options));
          ind_record.updated_on = ((new Date(per_record.updated_at)).toLocaleTimeString(undefined, options));
          ind_record.timestamps = ((new Date(per_record.created_at)).toLocaleTimeString(undefined, display_options));
          ind_record.timestamps_updated = ((new Date(per_record.updated_at)).toLocaleTimeString(undefined, display_options));
          // }
          
          ind_record.is_edited = true;
        }else{
          ind_record.created_on = ((new Date(per_record.created_at)).toLocaleTimeString(undefined, options));
          ind_record.timestamps = ((new Date(per_record.created_at)).toLocaleTimeString(undefined, display_options));
          ind_record.is_edited = false;
        }
		  /*
        if(chatMap != undefined && chatMap[per_record.message_id] !== undefined){
          let k = chatMap[per_record.message_id];
          ind_record.chat_files = k;
        }
		*/
		  //console.log(chatMap.length);
       	if(chatMap && Object.keys(chatMap).length > 0 && chatMap[ind_record.chat_id][ind_record.message_id]){
			let each_file_record = chatMap[ind_record.chat_id][ind_record.message_id];
			if(each_file_record){
				let file_msg_list = [];
			    for(const [key,each_file_record_value] of Object.entries(each_file_record)){
					//console.log(value);
					file_msg_list.push( "<a href='"+each_file_record_value.image_url+"' target='_blank' >"+each_file_record_value.file_name+"</a>");
				}
				ind_record.is_href = true;
				ind_record.message = file_msg_list.join("</br>");//"<a href='"+each_file_record_value.image_url+"' target='_blank' >"+each_file_record_value.file_name+"</a>";
			}
		} 
        processed_chat_records.push(ind_record);
      }
    }

   //console.log(processed_chat_records);
  // console.log(processed_chat_records.reverse());
    return processed_chat_records.reverse();
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
