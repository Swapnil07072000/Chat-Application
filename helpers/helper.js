require("dotenv").config();
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
		const hostname = process.env.HOST_NAME;
		const port = process.env.PORT;
        for(let key in fileInfo){
            if(fileInfo.hasOwnProperty(key)){
                let file = fileInfo[key];
                const name = file.file_name;
				const url = "http://"+hostname+":"+port+"/chat/"+file.chat_id+"/"+file.msg_id+"/view/"+file.file_id;
               
				const download_url = "http://"+hostname+":"+port+"/chat/"+file.chat_id+"/"+file.msg_id+"/download/"+file.file_id;
				const tmp_url = new URL(url);
				const download_tmp_url = new URL(download_url);
                const secure_url = tmp_url.href
                fileInfo[key].secure_url = secure_url;
                fileInfo[key].image_url = tmp_url.href;
				fileInfo[key].download_url = download_tmp_url.href;
            }
        }
		//console.log(fileInfo);
        return fileInfo;
    }
}

module.exports = Helper;
