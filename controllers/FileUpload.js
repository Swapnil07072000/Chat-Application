const multer = require('multer-utf8');
const upload =  multer({ dest: 'uploads/' });
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const rootPath = path.resolve(__dirname, '../');
const fileUpload = require("../models/FileUpload");
const { log } = require('console');

class FileUpload{
    constructor(){
        //
    }


    /**
     * This function work with uploading files
     */
    upload = async(req, res) =>{
        let response = false;
        let error_msg = "";
        let file_urls = [];
        try {
            const file_upload = new fileUpload;
            let files = [];
            files.push(req.file);
            const chat_id = req.body.chat_id;
            const msg_id = req.body.msg_id;
            const user_id = req.body.user_id;
            var fileResp = await file_upload.upload(files, chat_id, msg_id, user_id);
            if(fileResp.status == false){
                throw new Error(fileResp.error_msg);
            } 
            response = true;
        } catch (error) {
            response = false;
            error_msg = error.message;
        }
        let resp = {
            "status": response,
            "file_data": fileResp.file_urls,
            "error_msg": error_msg,
        };
        // console.log(resp);
        res.json(resp);
    }

    /**
     * Get all the commited files
     */
    getUnCommitedFiles = async() => {
        //
    }
}

module.exports = new FileUpload;