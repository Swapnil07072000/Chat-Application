const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db'); 

class Users extends Model {
    //
}

Users.init({
    id: {
        type: DataTypes.INTEGER(11),
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    username: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    password_hashed: {
        type: DataTypes.STRING(60),
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true, // Adds UNIQUE constraint on the email field
    },
    active: {
        type: DataTypes.ENUM('0', '1'),
        defaultValue: '1', // Default value is '1'
    },
    created_at: {
        type: DataTypes.DATE(3),
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP(3)'), 
    },
    updated_at: {
        type: DataTypes.DATE(3),
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP(3)'),
        onUpdate: sequelize.literal("CURRENT_TIMESTAMP(3)"),
    }
}, {
    sequelize, // Passing the `sequelize` instance is required
    modelName: 'Users', // Model name
    tableName: 'users', // Explicit table name
    timestamps: false, // Auto-create `createdAt` and `updatedAt` fields
});

module.exports = Users;
