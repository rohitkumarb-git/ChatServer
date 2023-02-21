const express = require("express");
const path = require("path");
const http = require("http");
const cors = require("cors");
const socketio = require("socket.io");
const formatMessage = require("./utils/chatMessage");
const {filterMsg, userChatMessage} = require('./utils/filterChatMessage');
const mongoClient = require("mongodb").MongoClient;

const dbname = "ChatBox";
//const chatCollection = 'chats'; //collection to store all chats
const userCollection = "onlineUsers"; //collection to maintain list of currently online users

const port = process.env.PORT | 3001;
const database =
  "mongodb+srv://rohitkumar:Mongodb@31@iconnect-cluster.kni459t.mongodb.net/test";
const app = express();
const corsOptions = {
  origin: "*",
  credentials: true,
};
app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.send("Hello world");
});
const server = http.createServer(app);
const io = socketio(server, {cors: {origin: "*"}});

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

        const chat = db.db(dbname).collection(chatcollection);
        chat.insertOne(filterMsg(data,  data.msgType), (err, res) => {
          //inserts message to into the database
          if (err) throw err;
         // console.log(dataElement, "------dataelement----", socket.id);
        //  console.log(data.msgType,'------data.msgType')
          socket.emit("message", userChatMessage(data,  data.msgType)); //emits message back to the user for display
        });
        const currentName =
          data.msgType === "user" ? data.userid : data.agentid;
        // console.log(currentName, 'currentName')
        if (data.msgType !== "user") {
          onlineUsers.findOne({ typeId: data.userid }, (err, res) => {
            //checks if the recipient of the message is online
            if (err) throw err;
            if (res != null) {
              //if the recipient is found online, the message is emmitted to him/her
             // console.log(res.ID, currentName, "AGENT");
             // console.log(filterMsg(data, 'agent'));
              socket.to(res.ID).emit("message", filterMsg(data, 'agent'));
            }
          });
        } else {
          onlineUsers.findOne({ typeId: data.agentid }, (err, res) => {
            //checks if the recipient of the message is online
            if (err) throw err;
            if (res != null) {
              //if the recipient is found online, the message is emmitted to him/her
            //  console.log(res.ID, "user");
            //  console.log(filterMsg(data, 'user'));
              socket.to(res.ID).emit("message", filterMsg(data, 'user'));
            }
          });
        }

        /* onlineUsers.findOne({ name: data.agentname }, (err, res) => {
          //checks if the recipient of the message is online
          if (err) throw err;
          if (res != null) {
            //if the recipient is found online, the message is emmitted to him/her
            console.log(res.ID, "agent");
            socket.to(res.ID).emit("message", dataElement);
          }
        });*/
      }
      db.close();
    });
  });

  socket.on("userDetails", (data) => {
    //checks if a new user has logged in and recieves the established chat details
    mongoClient.connect(database, (err, db) => {
     // console.log(data, "data");
      if (err) throw err;
      else {
        var onlineUser = {};
        if (data.chatType === "user") {
          onlineUser = {
            //forms JSON object for the user details
            ID: socket.id,
            name: data.username,
            typeId: data.userid,
          };
        } else {
          onlineUser = {
            //forms JSON object for the user details
            ID: socket.id,
            name: data.agentname,
            typeId: data.agentid,
          };
        }

        //  var currentCollection = db.db(dbname).collection(chatCollection);
        const chatcollection = data.agentid + "_" + data.userid;
      //  console.log(chatcollection, "-------collection-------", data);
        var currentCollection = db.db(dbname).collection(chatcollection);
        var online = db.db(dbname).collection(userCollection);
        online.insertOne(onlineUser, (err, res) => {
          //inserts the logged in user to the collection of online users
          if (err) throw err;
          console.log(onlineUser.name + " is online...");
          socket.emit("onlineusers", onlineUser.name);
        });

       
        currentCollection
          .find(
            {
              //finds the entire chat history between the two people
              userid: { $in: [data.userid, data.agentid] },
              agentid: { $in: [data.userid, data.agentid] },
            },
            { projection: { _id: 0 } }
          )
          .toArray((err, res) => {
            if (err) throw err;
            else {
              // console.log(res,'res');
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



server.listen(port, () => {
  console.log(`Chat Server listening to port ${port}...`);
});
