require('dotenv').config();
const express = require("express");
const session = require('express-session');
const http = require("http");
const {Server} = require("socket.io");
const bodyParser = require("body-parser");
const RedisStore = require("connect-redis").default;
// const redis = require('redis');
const path = require("path");
const flash = require('express-flash')

const router = require("./routes/routes");
const sequelize = require('./config/db');
const ChatSocket = require('./config/chatSocket');
const RedisClient = require('./config/redis');


const app = express();
//Socket-io Settings
const server = http.createServer(app);
const io = new Server(server,{
    pingInterval: 10000, 
    pingTimeout: 5000,   
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

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
app.use(flash());

app.use("/", router);

app.use((req, res, next) => {
    res.status(404).render("layouts/404");
});
app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).render("layouts/500");
});


const port = process.env.PORT || 9001;

server.listen(port, ()=>{
    console.log("App running on port "+port);
})
