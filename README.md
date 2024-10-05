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
    2. Need to fix the disconnection for new user comes in group -> Pending
1. Users will select which group to join. -> Done
2. If the group created by same user he will be already present and join button will not display-> Done

