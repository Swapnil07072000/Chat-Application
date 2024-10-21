/my-express-app
├── /node_modules      # Auto-generated dependencies
├── /public            # Public assets (images, CSS, JavaScript)
│   ├── /css
│   ├── /images
│   └── /js
├── /routes            # Route handlers for different endpoints
│   ├── index.js       # Main route file
│   ├── users.js       # Example route file
├── /views             # View templates (for apps using a template engine like EJS, Pug)
│   ├── index.ejs
│   ├── layout.ejs
├── /controllers       # Controller logic for handling requests (optional)
│   └── userController.js
├── /models            # Database models (e.g., Mongoose for MongoDB) (optional)
│   └── userModel.js
├── /middlewares       # Custom middleware (optional)
│   └── authMiddleware.js
├── /config            # Configuration files (e.g., environment variables)
│   └── db.js          # Database configuration
├── /services          # Services for business logic (optional)
│   └── emailService.js
├── app.js             # Main app entry point
├── package.json       # Project metadata and dependencies
└── .env               # Environment variables (optional)


Future Me:
Priority: 
    1. Need to check the socket.io connection as it is creating problem -> Done 
    - I have checked and fixed as it was the server listen issue 
    2. Need to fix the disconnection for new user comes in group -> Done
1. Users will select which group to join. -> Done
2. If the group created by same user he will be already present and join button will not display-> Done

Before this implement this
1. User send friend request to another user. -> Done
Note: We have to ensure that if they break their freindship then those records also we should have, and a new chat records between those users will be created.
2. When accepted then directly make any entry in chats_groups table, for this create a flag of is_group something like this. -> Pending
3. After this if user want to make private chat with that user in his/her friend circle then show a button which will open that 
	chat group -> Done
-> Separate the groups created by me and subcripted and non-subsribted groups -> after this pick up other tasks
4. Give a dropdown in both while creating a group and while creating a users-only private group, the list of users in dropdown is his/her 
	circle. -> Pending.
5. While creating a users-only group if those users group already exists then redirect then to that group page with loaded messages. -> Pending
6. We can think of saving the messages in chunk to avoid heavy load of messages in single table -> Pending

3. To edit/delete the messages send(Need to find some way to make it possible) -> Pending
4. One can send the images, documents, gif etc -> Pending
5. React to the messages send/recieved(Need to find some way to do this) -> Pending 

