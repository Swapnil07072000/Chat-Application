require('dotenv').config();
const express = require("express");
const session = require('express-session');
const http = require("http");
const {Server} = require("socket.io");
const bodyParser = require("body-parser");
const RedisStore = require("connect-redis").default;
// const redis = require('redis');
const path = require("path");

const router = require("./routes/routes");
const sequelize = require('./config/db');
const ChatSocket = require('./config/chatSocket');
const RedisClient = require('./config/redis');


const app = express();
//Socket-io Settings
const server = http.createServer(app);
const io = new Server(server);
// console.log(io);
new ChatSocket(io);

// Sync models and create tables when the app starts
sequelize.sync({ force: false }) // `force: false` ensures existing tables are not dropped
    .then(() => {
        console.log('Tables synchronized successfully.');
    })
    .catch(err => {
        console.error('Error synchronizing tables:', err);
    });

//Redis settings
/* Moved to /config/redis.js */
/*
const redis_username = process.env.REDIS_USERNAME;
const redis_password = process.env.REDIS_PASSWORD;
const redis_host = process.env.REDIS_HOST;
const redis_port = process.env.REDIS_PORT;
const redis_url = "redis://"+redis_username+":"+redis_password+"@"+redis_host+":"+redis_port;
const redisClient = redis.createClient({
    url: redis_url
});
redisClient.connect().then(()=>{
    console.log("Redis connected successfully")
});
redisClient.on("error", (err)=>{
    console.error("Redis error: "+error);
})
*/
/*
Using redis to store the session removed and 
replaced with JWT

const redisInstance = new RedisClient();
// redisInstance.connect();
const redisClient = redisInstance.getClient();
// console.log("A "+redisClient)
// Configure session middleware
app.use(session({
    // store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET, // Replace with a secure key
    resave: false,
    saveUninitialized: true,
    cookie: { 
        httpOnly: true,
        maxAge: 1000 * 60 * 60 // 1-hour expiration 
    } 
}));

*/
app.use(session({
    secret: process.env.SESSION_SECRET, // Replace with a secure key
    resave: false,
    saveUninitialized: true,
    cookie: { 
        httpOnly: true,
        maxAge: 1000 * 60 * 60 // 1-hour expiration 
    } 
}));




app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));




app.use("/", router);



const port = process.env.PORT || 9001;

/* Commented as server should listen to socket.io server */
// app.listen(port, ()=>{
//     console.log("App running on port "+port);
// })
/* End */

server.listen(port, ()=>{
    console.log("App running on port "+port);
})
