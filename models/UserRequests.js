const { DataTypes, Model, Sequelize } = require('sequelize');
const sequelize = require('../config/db'); 

class UserRequests extends Model {
    /**
     * For a specified user, get all the friend requests
     * which are pending
     */
    getAllFriendRequestsForUser = async(user_id) => {
        let is_error = false;
        let request_from_user = null;
        let request_to_other_users = null;
        let error_msg = "";
        try{
            request_from_user = await sequelize.query(
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
            request_to_other_users =
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
            
        }catch(error){
            is_error = true;
            error_msg = error.message;
        }
        return [is_error, request_from_user, request_to_other_users, error_msg];        
    }


    /**
     * Check is already a friend request
     * exists or not
     */
    isFriendRequestSend = async(from_user, to_user) =>{
        let result = "";
        let is_error = false, is_present = false;
        let is_my_request = true;
        let error_msg = "";
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
            if (typeof result != undefined && 
                result != null && 
                result.length != null && 
                result.length > 0) {
                is_present = true;
            }
            if(result[0]){
                if(result[0].request_last_action_by != from_user){
                    is_my_request = false;
                }
            }
        }catch(error){
            is_error = true;
            error_msg = error.message;
        }
        return [is_error, is_present, is_my_request, error_msg];
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
        type: DataTypes.ENUM('-2','-1', '0', '1'),
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
    created_by: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        references: {
            model: 'users', 
            key: 'id',
        },
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
