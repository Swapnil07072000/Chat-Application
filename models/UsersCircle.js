const { DataTypes, Model, Sequelize } = require('sequelize');
const sequelize = require('../config/db'); 

class UsersCircle extends Model {
    
    /**
     * 	This function check users are already friends or not
	 * 	@param object from_user_list
	 * 	@param object to_user_list
	 * 	@return object
     */
    isUserAlreadyFriend = async(from_user_list, to_user_list) => {
		let response = {};
        try{
            if(typeof from_user_list != "object"){
				from_user_list = ""+from_user_list;
				from_user_list = from_user_list.split(",");
			}
            if(typeof to_user_list != "object"){
				to_user_list = ""+to_user_list;
				to_user_list = to_user_list.split(",");
			}
			let from_user = from_user_list.join(",");
			let to_user = to_user_list.join(",");
            let result = await sequelize.query(
                `
                SELECT uc.id FROM users_circle AS uc
                WHERE uc.active = '1'
                AND (uc.friend_user_id IN (:from_user)
                OR uc.friend_user_id IN (:to_user))
                AND (uc.user_id IN (:from_user)
                OR uc.user_id IN (:to_user))
                `,
                {
                replacements: {from_user, to_user},
                type: Sequelize.QueryTypes.SELECT,
                }
            );  
            response.status = true;
			response.http_code = 200;
			response.result = result;
        }catch(error){
            response.status = false;
			response.http_code = error.code;
            response.message = error.message;
        }
        return response;
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
