const express = require("express");
const path = require("path");
const http = require("http");
const cors = require("cors");
const socketio = require("socket.io");
const formatMessage = require("./utils/chatMessage");
const mongoClient = require("mongodb").MongoClient;

const dbname = "ChatBox";
//const chatCollection = 'chats'; //collection to store all chats
const userCollection = "onlineUsers"; //collection to maintain list of currently online users

const port = 3001;
const database =
  "mongodb+srv://rohitkumar:Mongodb@31@iconnect-cluster.kni459t.mongodb.net/test";
const app = express();
const corsOptions = {
  origin: "*",
  credentials: true,
};
app.use(cors(corsOptions));

const server = http.createServer(app);
const io = socketio(server);

io.on("connection", (socket) => {
  console.log("New User Logged In with ID " + socket.id);

  //Collect message and insert into database
  socket.on("chatMessage", (data) => {
    //recieves message from client-end along with sender's and reciever's details
    var dataElement = formatMessage(data);
    mongoClient.connect(database, (err, db) => {
      if (err) {
        console.log("error", err);
        throw err;
      } else {
        var onlineUsers = db.db(dbname).collection(userCollection);

        const chatcollection = data.agentid + "_" + data.userid;
        console.log(chatcollection,'chatcollection')
        const chat = db.db(dbname).collection(chatcollection);
        chat.insertOne(dataElement, (err, res) => {
          //inserts message to into the database
          if (err) throw err;
          // console.log(dataElement,'dataelement')
          socket.emit("message", dataElement); //emits message back to the user for display
        });
        const currentName =
          data.msgType === "user" ? data.username : data.agentname;
        // console.log(currentName)
        onlineUsers.findOne({ name: data.username }, (err, res) => {
          //checks if the recipient of the message is online
          if (err) throw err;
          if (res != null) {
            //if the recipient is found online, the message is emmitted to him/her
            console.log(res.ID, "user");
            socket.to(res.ID).emit("message", dataElement);
          }
        });
        onlineUsers.findOne({ name: data.agentname }, (err, res) => {
          //checks if the recipient of the message is online
          if (err) throw err;
          if (res != null) {
            //if the recipient is found online, the message is emmitted to him/her
            console.log(res.ID, "agent");
            socket.to(res.ID).emit("message", dataElement);
          }
        });
      }
      db.close();
    });
  });

  socket.on("userDetails", (data) => {
    //checks if a new user has logged in and recieves the established chat details
    mongoClient.connect(database, (err, db) => {
      // console.log(data,'data')
      if (err) throw err;
      else {
        var onlineUser = {};
        if (data.chatType === "user") {
          onlineUser = {
            //forms JSON object for the user details
            ID: socket.id,
            name: data.username,
          };
        } else {
          onlineUser = {
            //forms JSON object for the user details
            ID: socket.id,
            name: data.agentname,
          };
        }

        //  var currentCollection = db.db(dbname).collection(chatCollection);
        const chatcollection = data.agentid + "_" + data.userid;
        console.log(chatcollection,'collection')
        var currentCollection = db.db(dbname).collection(chatcollection);
        var online = db.db(dbname).collection(userCollection);
        online.insertOne(onlineUser, (err, res) => {
          //inserts the logged in user to the collection of online users
          if (err) throw err;
          console.log(onlineUser.name + " is online...");
        });
        currentCollection
          .find(
            {
              //finds the entire chat history between the two people
              username: { $in: [data.username, data.agentname] },
              agentname: { $in: [data.username, data.agentname] },
            },
            { projection: { _id: 0 } }
          )
          .toArray((err, res) => {
            if (err) throw err;
            else {
              // console.log(res);
              socket.emit("output", res); //emits the entire chat history to client
            }
          });
      }
      db.close();
    });
  });
  var userID = socket.id;
  socket.on("disconnect", () => {
    mongoClient.connect(database, function (err, db) {
      if (err) throw err;
      var onlineUsers = db.db(dbname).collection(userCollection);
      var myquery = { ID: userID };
      onlineUsers.deleteOne(myquery, function (err, res) {
        //if a user has disconnected, he/she is removed from the online users' collection
        if (err) throw err;
        console.log("User " + userID + "went offline...");
        db.close();
      });
    });
  });
});

//app.use(express.static(path.join(__dirname,'front')));

server.listen(port, () => {
  console.log(`Chat Server listening to port ${port}...`);
});
