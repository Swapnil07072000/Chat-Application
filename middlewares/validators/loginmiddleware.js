const { check, body, sanitizeBody, validationResult,query  } = require('express-validator');
class loginmiddleware{
    constructor(){
        //
    }
    handle(req, res, next){
        return [body("username").notEmpty()];
    }
}

module.exports = new loginmiddleware;