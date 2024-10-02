const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class ChatGroups extends Model {
  //
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // Name of the user model
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
    modelName: 'ChatGroups',
    tableName: 'chat_groups', // Specify the table name
    timestamps: false, // Disable automatic timestamps since we're using custom fields
  }
);

module.exports = ChatGroups;
