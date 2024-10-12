const { DataTypes, Model, Sequelize } = require('sequelize');
const sequelize = require('../config/db'); 

class UserRequests extends Model {

    //Get all the friend requests
    static async getAllFriendRequestsForUser(user_id){
        let result = "";
        let is_error = false;
        try{
            let request_from_user = await sequelize.query(
                `
                SELECT ur.*, u.* FROM user_requests AS ur
                INNER JOIN users AS u
                ON(ur.request_to = u.id)
                WHERE ur.published = '1'
                AND ur.status = '0'
                AND u.active = '1'
                AND ur.request_last_action_by = :user_id
                LIMIT 50
                `,
                {
                    replacements: {user_id},
                    type: Sequelize.QueryTypes.SELECT,
                }
            );  
            // console.log(result);
            let request_to_other_users =
                await sequelize.query(
                    `
                    SELECT ur.*, u.* FROM user_requests AS ur
                    INNER JOIN users AS u
                    ON(ur.request_last_action_by = u.id)
                    WHERE ur.published = '1'
                    AND ur.status = '0'
                    AND u.active = '1'
                    AND ur.request_to = :user_id
                    LIMIT 50
                    `,
                    {
                        replacements: {user_id},
                        type: Sequelize.QueryTypes.SELECT,
                    }
                ); 
            // console.log(is_error, is_present);
            // console.log(request_from_user, request_to_other_users);
            return [is_error, request_from_user, request_to_other_users];
        
        }catch(error){
            // return error;
            console.log(error);
            is_error = true;
            return [is_error, result];
        }        
    }

    //Check if friend request is already send or not
    static async isFriendRequestSend(from_user, to_user){
        let result = "";
        let is_error = false, is_present = false;
        try{
        result = await sequelize.query(
            `
            SELECT ur.* FROM user_requests AS ur
            WHERE ur.published = '1'
            AND ur.status = '0'
            AND (ur.request_last_action_by = :from_user
            OR ur.request_last_action_by = :to_user)
            AND (ur.request_to = :from_user
            OR ur.request_to = :to_user)
            `,
            {
            replacements: {from_user, to_user},
            type: Sequelize.QueryTypes.SELECT,
            }
        );  
        // console.log(result);
        // is_present = (!result)?false:true;
        if (typeof result != "undefined" && result != null && result.length != null && result.length > 0) {
            is_present = true;
        }
        let is_my_request = true;
        // console.log(result[0], result.request_last_action_by, from_user);
        if(result[0].request_last_action_by != from_user){
            is_my_request = false;
        }
        // console.log(is_error, is_present);
        return [is_error, is_present, is_my_request];
        
        }catch(error){
            // return error;
            console.log(error);
            is_error = true;
            return [is_error, is_present];
        }
    }
    
}

UserRequests.init({
    id: {
        type: DataTypes.INTEGER(11),
        autoIncrement: true,
        primaryKey: true,
    },
    request_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    request_data: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    request_to: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        references: {
            model: 'users', 
            key: 'id',
        },
    },
    status: {
        type: DataTypes.ENUM('-1', '0', '1'),
        defaultValue: '0',
    },
    published: {
        type: DataTypes.ENUM('0', '1'),
        defaultValue: '1',
    },
    request_last_action_by: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        references: {
            model: 'users', 
            key: 'id',
        },
    },
    request_last_action_on: {
        type: DataTypes.DATE(3),
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP(3)'), 
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
    modelName: 'UserRequests',
    tableName: 'user_requests', 
    timestamps: false, 
});

module.exports = UserRequests;
