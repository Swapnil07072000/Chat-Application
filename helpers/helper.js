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

    /**
     * 
     */
    static async performFileChanges(fileInfo){
        for(let key in fileInfo){
            if(fileInfo.hasOwnProperty(key)){
                let file = fileInfo[key];
                const name = file.file_url.replace(/\\/g, '/')
                const tmp_url = new URL(`http://localhost:9000/${name}`);
                const secure_url = "["+file.file_name+"]["+tmp_url.href+"]";
                fileInfo[key].secure_url = secure_url;
                fileInfo[key].image_url = tmp_url.href;
            }
        }
        return fileInfo;
    }
}

module.exports = Helper;