require("dotenv").config();
const { Sequelize } = require("sequelize");

const host = process.env.DB_HOST;
const db = process.env.DB_NAME;
const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const dialect = process.env.DB_TYPE;

const sequelize = new Sequelize(db, username, password, {
    host: host,
    dialect: dialect,
    logging: false
});

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
})();

module.exports = sequelize;