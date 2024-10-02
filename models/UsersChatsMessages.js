// models/UsersChatsMessages.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Adjust the path as needed

class UsersChatsMessages extends Model {}

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
      unique: true, // Ensure unique constraint for message_id
    },
    chat_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: 'chat_groups', // Reference to the ChatGroups model
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
