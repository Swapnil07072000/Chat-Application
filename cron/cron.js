const cron = require("node-cron");
const fs = require('fs');

cronJob = async() => {
	cron.schedule("* 10 * * * *", function(){
		console.log("CRON running every 10 mins");
		deleteUploads();
	},
	{
		scheduled: true,
		timezone: "Asia/Kolkata"
	}
	);
}

deleteUploads = async() =>{
	file_directory = "./uploads/";
	let max = 5;
	let cnt = 0;
  	const files = await fs.readdirSync(file_directory);
	if(files && files.length < 10){
		return;
	}
    for(const file of files){ 
		if(cnt > max){
			break;
		}
        // Process each file
        //filess.forEach(file => {
            const filePath = `${file_directory}/${file}`;

            // Delete the file
            fs.unlink(filePath, err => {
                if (err) {
                    console.error(`Error deleting file ${filePath}:`, err);
                } else {
                    console.log(`Deleted: ${filePath}`);
                }
            });
        //});
		cnt = cnt+1;
    }
}

module.exports = cronJob;

