require("dotenv").config();
const jwt = require("jsonwebtoken");

class JwtToken{
    constructor(){
        this.secret = process.env.JWT_SECRET_KEY;
    }


    createJWTToken(user){
        const token = jwt.sign(
            {data: user, exp: Math.floor(Date.now() / 1000) + (60 * 60)}, 
            this.secret,
            // { algorithm: 'RS256' }
        );
        return token;
    }

    veriftJWTToken = async(token) => {

        if(!token){
            return;
        }
        if(!token){
            token = req.cookies;
        }
        // console.log(token);
        var decoded = "";
        try{
            decoded = jwt.verify(token, this.secret);
            // console.log(decoded);
            // req.session.user = decoded;
            return decoded;
        }catch(error){
            return false;
            // req.redirect("/login");
        }
        
        
    }

    


}

module.exports = JwtToken;
