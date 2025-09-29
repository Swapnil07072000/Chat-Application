const multer = require('multer-utf8');
const upload =  multer({ dest: 'uploads/' });
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const rootPath = path.resolve(__dirname, '../');
const fileUpload = require("../models/FileUpload");
const { log } = require('console');

const userschatsmessages = require("../models/UsersChatsMessages");
const CryptoService = require("../config/encryptdecrypt");


const util = require('util');
const fsp = require('fs/promises');
const { pipeline } = require('stream');
//const { pipeline } = require('stream/promises'); // Native since Node 15+
const { promisify } = require('util');


const pipe = promisify(pipeline);

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
            let msg_id = req.body.msg_id;
            const user_id = req.body.user_id;
			console.log(files);
           	if(!msg_id){
				const message_id = uuidv4();
				const cryptoInstance = new CryptoService();
				const encryptedText = cryptoInstance.encrypt("");
				const message_data = await userschatsmessages.create({
					message_id: message_id,
					chat_id: chat_id,
					user_id: user_id,
					message: encryptedText,
				});
				msg_id = message_id;
			}

			var fileResp = await file_upload.upload(files, chat_id, msg_id, user_id);
            if(fileResp.status == false){
                throw new Error(fileResp.error_msg);
            } 
			//console.log(fileResp);	
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
	 *	This function handles the file upload in chunk
	 *	@param object req
	 *	@param object res
	 *
	 */
	uploadChunk = async(req, res) => {
		const CHUNKS_DIR = "./chunks";
		const file_name = req.headers["x-file-name"];
		const total_chunks = parseInt(req.headers["x-total-chunks"]);
		const current_chunk = parseInt(req.headers["x-current-chunk"]);	
		const original_file_name = req.headers["x-original-file-name"]; 
		const chat_id = req.headers["x-chat-id"];
		 let msg_id = parseInt(req.headers["x-msg-id"]);
		 const user_id = req.session.user.id;
	
        const file_upload = new fileUpload;

		//console.log(file_name);
		//console.log(total_chunks, current_chunk);
		//console.log(first, file_name, totalChunks, currentChunk); 
		//const {first, file_name} = req.body;
		//console.log(req.body);
		const chunk_file_name = path.parse(file_name).name;
		const chunkFilename = `${chunk_file_name}.${current_chunk}`;
		//console.log(chunkFilename);
		const chunkPath = `${CHUNKS_DIR}/${chunkFilename}`;
		//console.log(file.path);
  		const writeStream = fs.createWriteStream(chunkPath);
		req.pipe(writeStream);
		writeStream.on('finish', async() => {
    		//res.send('Chunk uploaded');
  		//console.log("chunk uploaded", current_chunk+1, total_chunks);
	  	if (current_chunk+1 === total_chunks) {	
		  await this.assembleChunks(file_name, total_chunks, chunk_file_name, original_file_name)
		  .then(async(file_resp) => {
					
				
			  res.send({file: file_resp, msg:'File uploaded successfully'});
		  })
		  .catch((err) => {
			console.error('Error assembling chunks:', err);
			res.send('Error assembling chunks');
		  });
		 
		
	  	} else {
			res.send('Chunk uploaded successfully');
	  	}
		});	
		//console.log(chunkPath);
	}

	/**
	 *	This function assembles the chunk of data
	 *
	 *
	*/
	assembleChunks = async(filename, totalChunks, chunk_file_name, original_file_name="") => {
	 
		 const CHUNKS_DIR = "./chunks";
		 const write_path = `./uploads/${filename}`;
		 const writer = await fs.createWriteStream(write_path);
	  for (let i = 0; i < totalChunks; i++) {
		const chunkPath = (`${CHUNKS_DIR}/${chunk_file_name}.${i}`);
		console.log(chunkPath);
		  
try {

		  const reader = fs.createReadStream(chunkPath);
		  //console.log(reader);
		reader.on('error', (err) => {
    console.error('Error reading the source file:', err);
});
    await pipe(reader, writer);
    await fsp.unlink(chunkPath);
  } catch (err) {
    console.error(`Error processing chunk ${i}:`, err);
  }
		
		
		
	  
	  }
	writer.on('finish', () => {
		console.log('Data has been successfully copied from ');
	});

  writer.end();
	let file_resp = {};
	file_resp.path = write_path;
	file_resp.originalname = original_file_name;	
    file_resp.filename = filename;
	return file_resp;
	}

	/**
	 *	This function add the files to a message
	 *	@param object req
	 *	@param object res
	 *
	*/
	registerFiles = async(req, res) => {
		const chat_id = req.headers["x-chat-id"];
		 let msg_id = parseInt(req.headers["x-msg-id"]);
		 const user_id = req.session.user.id;
	
        const file_upload = new fileUpload;
		const { files } = req.body;
		//console.log(chat_id, msg_id, user_id);
		//console.log(files, req.body);
		//res.send("OK");
		if(!msg_id){
			 const message_id = uuidv4();
			 const cryptoInstance = new CryptoService();
			 const encryptedText = cryptoInstance.encrypt("");
			 //console.log(message_id, chat_id, user_id, encryptedText);
			 const message_data = await userschatsmessages.create({
				 message_id: message_id,
				 chat_id: chat_id,
				 user_id: user_id,
				 message: encryptedText,
			 });
			 msg_id = message_id;
		 }
		 //console.log(files, chat_id, msg_id, user_id);
		 let fileResp = await file_upload.upload(files, chat_id, msg_id, user_id);
		 if(fileResp.status == false){
			 //throw new Error(fileResp.error_msg);
			 res.send("Issue in file record");
		}
		res.send("Files register curretly");
	}


    /**
     * Get all the commited files
     */
    getUnCommitedFiles = async() => {
        //
    }
}

module.exports = new FileUpload;
