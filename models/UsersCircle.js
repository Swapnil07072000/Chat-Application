const { DataTypes, Model, Sequelize } = require('sequelize');
const sequelize = require('../config/db'); 

class UsersCircle extends Model {
    //User is already friend or not
    static async isUserAlreadyFriend(from_user, to_user){
        let result = "";
        let is_error = false, is_present = false;
        try{
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
        console.log(result);
        // is_present = (!result)?false:true;
        if (typeof result != "undefined" && result != null && result.length != null && result.length > 0) {
            is_present = true;
        }
        // console.log(is_present);
        return [is_error, is_present];
        
        }catch(error){
            // return error;
            console.log(error);
            is_error = true;
            return [is_error, is_present];
        }
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
