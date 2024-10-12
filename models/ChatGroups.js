const { DataTypes, Model, Sequelize } = require('sequelize');
const sequelize = require('../config/db');

class ChatGroups extends Model {
  static async getAllGroupForUser(user_id){
    let result = "";
    try{
      result = await sequelize.query(
        `
          SELECT g.chat_id, g.chat_name FROM chat_groups AS g
          JOIN chats_group_users AS cu
          ON(cu.chat_id = g.chat_id)
          WHERE cu.user_id = :user_id
          AND g.published = '1' 
          AND cu.active = '1'
        `,
        {
          replacements: {user_id},
          type: Sequelize.QueryTypes.SELECT,
        }
      );  
      // console.log(result);
      
    }catch(error){
      return error;
    }
    var chat_id_list = [];
    result.forEach(element => {
      chat_id_list.push(element.chat_id)
    });
    return [chat_id_list, result];
    
  }

  static async isValidChatGroup(chat_id){
    let result = "";
    try{
      result = await sequelize.query(
        `
          SELECT g.id FROM chat_groups AS g
          WHERE g.chat_id = :chat_id
          AND g.published = 1
        `,
        {
          replacements: {chat_id},
          type: Sequelize.QueryTypes.SELECT,
        }
      );
    }catch(error){
      return error;
    }
    return (result?true:false);
  }

  static async getAllGroup(chat_id_list){
    let result = "";
    try{
      let query = "";
      if(!chat_id_list){
        query = `
          SELECT g.chat_id, g.chat_name FROM chat_groups AS g
          LEFT JOIN chats_group_users AS cu
          ON(cu.chat_id = g.chat_id)
          AND g.published = '1' 
          AND cu.active = '1'
        ` ;
      }else{
        const chat_ids = "'"+chat_id_list.join("','")+"'";
        query = `
          SELECT g.chat_id, g.chat_name FROM chat_groups AS g
          LEFT JOIN chats_group_users AS cu
          ON(cu.chat_id = g.chat_id AND cu.active = '1')
          WHERE g.chat_id NOT IN (${chat_ids})
          AND g.published = '1' 
          
        ` ;
      }
      
      result = await sequelize.query(query,
        {
          type: Sequelize.QueryTypes.SELECT,
        }
      );  
      // console.log(result);
      
    }catch(error){
      return error;
    }
    return result;
    
  }
}

ChatGroups.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    chat_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    chat_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    chat_description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', 
        key: 'id',
      },
    },
    is_group: {
      type: DataTypes.ENUM('0', '1'),
      defaultValue: '1',
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
    modelName: 'ChatGroups',
    tableName: 'chat_groups', // Specify the table name
    timestamps: false, // Disable automatic timestamps since we're using custom fields
  }
);

module.exports = ChatGroups;
