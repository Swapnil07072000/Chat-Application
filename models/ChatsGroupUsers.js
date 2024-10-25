const { Model, DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/db'); // Adjust the path as needed

class ChatsGroupUsers extends Model {
  
  static async getChatRecords(user_id, chat_id){
    let result = "";
    try{
      let query = "";
      query = `
        SELECT g.chat_name, g.is_group FROM chat_groups AS g 
        WHERE g.chat_id = '${chat_id}'
        AND g.published = '1'
        LIMIT 1
      `;
      result = await sequelize.query(
        query,
        {
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      // console.log(result[0].is_group);
      if(result[0].is_group == 1){
        result = await sequelize.query(
          `
            SELECT g.chat_name FROM chat_groups AS g 
            WHERE g.chat_id = :chat_id
            AND g.published = '1'
          `,
          {
            replacements: {chat_id},
            type: Sequelize.QueryTypes.SELECT,
          }
        );
      }else{
        result = await sequelize.query(
          `
            SELECT GROUP_CONCAT(u.username SEPARATOR ',') 
            FROM chat_groups AS g
            INNER JOIN chats_group_users AS cu
            ON(cu.chat_id = g.chat_id)
            INNER JOIN users AS u
            ON(u.id = cu.user_id) 
            WHERE g.chat_id = :chat_id
            AND cu.user_id != :user_id
            AND g.published = '1'
            AND cu.active = '1'
            AND u.active = '1'
            GROUP BY g.id
          `,
          {
            replacements: {chat_id, user_id},
            type: Sequelize.QueryTypes.SELECT,
          }
        );
      }
        
      // console.log(result);
      return result;
    }catch(error){
      console.log(error);
      return error;
    } 
  }
  
  static async isUserAlreadyPresentInGroup(user_id, chat_id){
    let result = "";
    try {
      // console.log(user_id, chat_id);
      let query = "";
      query = `
        SELECT cgu.* FROM chats_group_users AS cgu
        WHERE cgu.chat_id = '${chat_id}'
        AND cgu.user_id = ${user_id}
        AND cgu.active = '1'
      `;
      // console.log(query);
      result = await sequelize.query(
        query,
        {
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      
    } catch (error) {
      return [true, false, error];
    }
    // console.log(result);
    // let is_present = true;
    let is_present = (result.length > 0)?true:false;
    // console.log(result.length);
    return [false, is_present, result];
  }

}

ChatsGroupUsers.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    chat_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: 'chat_groups', // Reference to the ChatGroups model (ensure this model exists)
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
    active: {
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
    modelName: 'ChatsGroupUsers',
    tableName: 'chats_group_users', // Specify the table name
    timestamps: false, // Disable automatic timestamps since we're using custom fields
  }
);

module.exports = ChatsGroupUsers;
