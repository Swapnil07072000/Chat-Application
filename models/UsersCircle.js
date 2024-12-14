const { DataTypes, Model, Sequelize } = require('sequelize');
const sequelize = require('../config/db'); 

class UsersCircle extends Model {
    
    /**
     * Check for the user whom one is sending
     * the request, is already friend
     */
    isUserAlreadyFriend = async(from_user, to_user) => {
        let is_error = false, is_present = false;
        let error_msg = "";
        try{
            let result = "";
            result = await sequelize.query(
                `
                SELECT uc.id FROM users_circle AS uc
                WHERE uc.active = '1'
                AND (uc.friend_user_id = :from_user
                OR uc.friend_user_id = :to_user)
                AND (uc.user_id = :from_user
                OR uc.user_id = :to_user)
                `,
                {
                replacements: {from_user, to_user},
                type: Sequelize.QueryTypes.SELECT,
                }
            );  
            if (typeof result != undefined && 
                result != null && 
                result.length != null && 
                result.length > 0) {
                is_present = true;
            }
        }catch(error){
            is_error = true;
            error_msg = error.message;
        }
        return [is_error, is_present, error_msg];
    }
}

UsersCircle.init({
    id: {
        type: DataTypes.INTEGER(11),
        autoIncrement: true,
        primaryKey: true,
    },
    circle_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    friend_user_id: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        references: {
            model: 'users', 
            key: 'id',
        },
    },
    user_id: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        references: {
            model: 'users', 
            key: 'id',
        },
    },
    chat_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        references: {
            model: 'chat_groups',
            key: 'chat_id',
        }
    },
    request_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        references: {
            model: 'user_requests',
            key: 'request_id',
        }
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
    }
}, {
    sequelize, 
    modelName: 'UsersCircle',
    tableName: 'users_circle', 
    timestamps: false, 
});

module.exports = UsersCircle;
