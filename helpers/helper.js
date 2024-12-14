class Helper{
    constructor(){
        //
    }
    /**
     * This function is used to check
     * whether the request is ajax or form submission
     */
    static async isAjax(req, res){
        let is_ajax = false;
        try {
            if(req.headers.host != req.headers.referer){
                is_ajax = true;
            }
        } catch (error) {
            //apply logging
        }
        return is_ajax;
    }

    /**
     * This functions get the date in 
     * YYYY-mm-dd format
     */
    static async generateDatabaseDateTime(date = null){
        if(!date){
            date = new Date();
        }
        return date.toISOString().replace("T"," ").substring(0, 19);
    }
}

module.exports = Helper;