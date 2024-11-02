require("dotenv").config();
const jwt = require("jsonwebtoken");
const Users = require("../controllers/Users");

class JwtToken {
    constructor() {
        this.secret = process.env.JWT_SECRET_KEY;
    }

    async handle(req, res, next) {
        var cookies = req.headers.cookie;
        
        if (!cookies) {
            return this.clearSessionAndRedirect(req, res);
        }

        let cookie_list = cookies.split("; ");
        let cookie_dict = {};
        cookie_list.forEach(element => {
            let [cookie_key, cookie_value] = element.split("=");
            cookie_dict[cookie_key] = cookie_value;
        });

        const token = cookie_dict.jwtToken;
        
        if (!token) {
            return this.clearSessionAndRedirect(req, res);
        }

        try {
            var decoded = jwt.verify(token, this.secret);
            const user_data = decoded.data;
            const user = await Users.checkUserExistsOrNot(user_data.id);
            // console.log(req.session);
            if(user == false){
                return this.clearSessionAndRedirect(req, res);    
            }
            
            req.session.user = user_data;
            // if (!req.session.user.id) {
            //     req.session.user = req.session.user.data;
            // }
            return next();
        } catch (error) {
            console.error(error);
            return this.clearSessionAndRedirect(req, res);
        }
    }
    /*
    async handleSocket(socket, next) {
        var cookies = socket.handshake.headers.cookie;
        // console.log(cookies);
        if (!cookies) {
            return this.clearSessionAndRedirectForSocket(socket);
        }

        let cookie_list = cookies.split("; ");
        let cookie_dict = {};
        cookie_list.forEach(element => {
            let [cookie_key, cookie_value] = element.split("=");
            cookie_dict[cookie_key] = cookie_value;
        });

        const token = cookie_dict.jwtToken;
        // console.log(token);
        if (!token) {
            return this.clearSessionAndRedirectForSocket(socket);
        }

        try {
            var decoded = jwt.verify(token, this.secret);
            const user_data = decoded.data;
            const user = await Users.checkUserExistsOrNot(user_data.id);
            if(user == false){
                return this.clearSessionAndRedirectForSocket(socket);    
            }
            // req.session.user = user_data;
            // if (!req.session.user.id) {
            //     req.session.user = req.session.user.data;
            // }
            // console.log(next);
            return next();
        } catch (error) {
            console.error(error);
            return this.clearSessionAndRedirectForSocket(socket);
        }
    }
    clearSessionAndRedirectForSocket(socket){
        // console.log(req);
        // return socket.redirect("/login");
        const url = "/login";
        socket.emit("redirect_to_login", url);
    }
    */
    clearSessionAndRedirect(req, res) {
        req.session.destroy(error => {
            if (error) {
                console.error("Error destroying session:", error);
            }
            res.clearCookie("connect.sid");
            res.clearCookie("jwtToken");
            res.redirect("/login");
        });
    }
}

module.exports = new JwtToken();
