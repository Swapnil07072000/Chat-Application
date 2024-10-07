require("dotenv").config();
const jwt = require("jsonwebtoken");

class JwtToken {
    constructor() {
        this.secret = process.env.JWT_SECRET_KEY;
    }

    handle(req, res, next) {
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
            req.session.user = decoded;
            if (!req.session.user.id) {
                req.session.user = req.session.user.data;
            }
            return next();
        } catch (error) {
            console.error(error);
            return this.clearSessionAndRedirect(req, res);
        }
    }

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
