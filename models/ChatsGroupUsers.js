const { Model, DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/db'); // Adjust the path as needed

class ChatsGroupUsers extends Model {
  

  static async getAllGroupForUser(user_id){
    let result = "";
    try{
      result = await sequelize.query(
        `
          SELECT g.chat_name FROM chat_groups AS g
          JOIN chats_group_users AS cu
          ON(cu.chat_id = g.chat_id)
          WHERE cu.user_id = :user_id
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
    return result;
    
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
