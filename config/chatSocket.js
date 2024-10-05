class ChatSocket {
    constructor(io) {
      this.io = io;
      this.initializeSocketConnection();
    }
  
    // Initialize the socket connection
    initializeSocketConnection() {
      this.io.on('connection', (socket) => {
        console.log('A user connected '+socket.id);
  

        this.joinChatGroup(socket);
        // Register event listeners for this socket
        this.handleMessage(socket);
  
        // Handle disconnection
        socket.on('disconnect', () => {
          console.log('A user disconnected');
        });
      });
    }
  
    // Handle incoming chat messages
    handleMessage(socket) {
      socket.on('chat message', (msg) => {
        console.log('Message '+msg.message+' to room ' + msg.roomID);
        const msg_result = {};
        // msg_result.message = msg.message;
        // msg_result.self = ()
        if(!msg.roomID){
          this.io.to(msg.roomID).emit('chat message', msg.message);
        }else{
          // Emit the message to all connected clients
          this.io.emit('chat message', msg.message);
        }
        
      });
    }

    joinChatGroup(socket){
      socket.on("joinChatGroup", (roomID)=>{
        console.log("Socket "+socket.id+" joined the Room "+roomID);
        socket.join(roomID);
      })
    }
  }
  
  module.exports = ChatSocket;
  