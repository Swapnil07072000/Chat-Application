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
          WHERE g.user_id = :user_id
          AND g.is_group = '1'
          AND g.published = '1' 
          AND cu.active = '1'
          GROUP BY g.id
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

  static async getAllGroup(chat_id_list, user_id){
    let result = "";
    try{
      let query = "";
      // console.log(chat_id_list, chat_id_list.length <= 0);
      // console.log(user_id);
      if(!chat_id_list || chat_id_list.length <= 0){
        query = `
          SELECT g.chat_id, g.chat_name,
          MAX(CASE 
            WHEN cu.user_id = ${user_id} THEN '1'
            ELSE '0'
          END) AS 'is_present_in_group',
          MAX(CASE 
            WHEN ((uc.friend_user_id = g.user_id) OR (uc.user_id = g.user_id)) THEN '1'
            ELSE '0'
          END) AS 'is_in_my_circle' 
          FROM chat_groups AS g
          INNER JOIN chats_group_users AS cu
          ON(cu.chat_id = g.chat_id)
          LEFT JOIN users_circle AS uc
          ON(
            ((uc.friend_user_id = g.user_id) OR (uc.user_id = g.user_id))
            AND uc.active = '1'
            )
          AND g.published = '1' 
          AND g.is_group = '1'
          AND g.user_id != ${user_id}
          AND cu.active = '1'
          GROUP BY g.id
        ` ;
        // console.info(query);
      }else{
        const chat_ids = "'"+chat_id_list.join("','")+"'";
        query = `
          SELECT g.chat_id, g.chat_name,
          MAX(CASE 
            WHEN cu.user_id = ${user_id} THEN '1'
            ELSE '0'
          END) AS 'is_present_in_group' 
          FROM chat_groups AS g
          LEFT JOIN chats_group_users AS cu
          ON(cu.chat_id = g.chat_id AND cu.active = '1')
          WHERE g.chat_id NOT IN (${chat_ids})
          AND g.published = '1' 
          AND g.is_group = '1'
          GROUP BY g.id
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

  static async getPrivateChatGroups(user_id){
    let result = "";
    try {
      let query = "";
      query = `
        SELECT g.chat_id, 
        g.chat_name, 
        GROUP_CONCAT(u.username SEPARATOR ',') AS private_chat_name 		
        FROM chat_groups AS g
        INNER JOIN chats_group_users AS cu
        ON(cu.chat_id = g.chat_id AND cu.user_id = ${user_id})
        INNER JOIN users AS u
        ON(u.id = cu.user_id)
        AND g.published = '1'
        AND u.active = '1' 
        AND g.is_group = '0'
        #AND cu.user_id != ${user_id}
        AND cu.active = '1'
        GROUP BY g.id
      ` ;
      console.info(query);
      result = await sequelize.query(query,
        {
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      // console.log(result);
    } catch (error) {
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
