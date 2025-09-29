class Admin{
	listusers = async(req, res) => {
		console.log("Admin User list");
		return res.status(200);
	}

	listgroups = async(req, res) => {
		console.log("Admin User Groups");
		return res.status(200);
	}

}

module.exports = new Admin;
