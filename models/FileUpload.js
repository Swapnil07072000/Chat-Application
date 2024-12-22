const { DataTypes, Model, Sequelize } = require('sequelize');
const sequelize = require('../config/db');

const multer = require('multer-utf8');
const upload =  multer({ dest: 'uploads/' });
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const helper = require("../helpers/helper");

const rootPath = path.resolve(__dirname, '../');

class FileUpload extends Model{
    upload = async(files, chat_id, msg_id, user_id) =>{
      let response = true;
      let file_urls = [];
      let error_msg = "";
      try {
        if(files && files.length > 0){
          for(const key in files){
            const file = files[key];
            const fileName = path.parse(file.originalname).name;
            const uniqueFileName = path.parse(file.filename).name;
            const filePath = file.path;
            const file_type = path.parse(file.filename).ext;
            const fileID = uuidv4();
            const data = {
                file_id: fileID,
                unique_file_name: uniqueFileName,
                file_name: fileName, 
                file_url: filePath, 
                file_type: file_type,
                chat_id: chat_id,
                msg_id: msg_id,
                user_id: user_id,
            };
            const fileSave = await FileUpload.create(data);
            if(fileSave.id <= 0){
              throw new Error("Error in saving files");
            }
            let file_info = [];
            file_info.push(data);
            const fileData = await helper.performFileChanges(file_info);
  
            let temp = {
              "file_id": fileSave.file_id, 
              "file_name": fileName,
              "file_url": filePath,
              "secure_url": fileData[0].secure_url,
            };
            file_urls.push(temp);
          }
        }  
      } catch (error) {
        response = false;
        error_msg = error.message;
      }
      let resp = {
        "status": response,
        "file_urls": file_urls,
        "error_msg": error_msg,
      };
      return resp;
    }

    /**
     * Get all the commited files
     */
    getFilesMap = async(chat_id, msg_id, user_id, commited=0) => {
      let result = "", error_msg = "";
      let error = false;
      let response = {};
      try {
        let query = "";
        let replacements = {};
        replacements.commited = commited.toString();
        query = `
            SELECT f.* FROM file_upload AS f
            WHERE f.commited = :commited
            `;
        if(chat_id != null && msg_id != null && user_id != null){
          query +=`
            AND f.chat_id = :chat_id
            AND f.msg_id = :msg_id
            AMD f.user_id = :user_id
          `;
          replacements.chat_id = chat_id;
          replacements.msg_id = msg_id;
          replacements.user_id = user_id;
        }else if(chat_id != null && msg_id != null){
          query += `
            AND f.chat_id = :chat_id
            AND f.msg_id = :msg_id
          `;
          replacements.chat_id = chat_id;
          replacements.msg_id = msg_id;
        }else{
          query += `
            AND f.chat_id = :chat_id
          `;
          replacements.chat_id = chat_id;
        }
        query += `AND
            DATE(f.created_at) BETWEEN DATE(CURDATE()-INTERVAL+2 DAY) AND DATE(CURDATE())
            `;
        // console.log(query);
        result = await sequelize.query(
          query,
          {
            replacements: replacements,
            type: Sequelize.QueryTypes.SELECT,
          }
        );  
      } catch (error) {
        error = true;
        error_msg = error.message;
      }
      const fileData = await helper.performFileChanges(result);
      let fileMap = {};
      let chatMap = {};
      for(let key in fileData){
        if(fileData.hasOwnProperty(key)){
          let file = fileData[key];
          let temp_url = file.secure_url;
          fileMap[temp_url] = file;
          if(commited == 1){
            if(chatMap[file.chat_id] == undefined){
              chatMap[file.chat_id] = {};
            }
            if(chatMap[file.chat_id][file.msg_id] == undefined){
              chatMap[file.chat_id][file.msg_id] = {};
            }
            chatMap[file.chat_id][file.msg_id][temp_url] = file; 
          }
        }
      }
      response.status = error?false:true;
      response.error_msg = error_msg;
      response.filedata = fileData;
      response.fileMap = fileMap;
      if(commited == 1){
        response.chatMap = chatMap;
      }
      return response;
      // console.log(error_msg, result);
  }
}

FileUpload.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      file_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      unique_file_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      file_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      file_url: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      file_type: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      chat_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        references: {
          model: 'chat_groups', 
          key: 'chat_id',
        },
      },
      msg_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
        references: {
          model: 'users_chats_messages', 
          key: 'message_id',
        },
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users', 
          key: 'id',
        },
      },
      commited: {
        type: DataTypes.ENUM('0', '1'),
        defaultValue: '0',
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
      modelName: 'FileUpload',
      tableName: 'file_upload', // Specify the table name
      timestamps: false, // Disable automatic timestamps since we're using custom fields
    }
  );
  
  module.exports = FileUpload;