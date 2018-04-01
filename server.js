var http = require('http'); // this is new
var express = require('express');
var app = express();
var server = http.createServer(app); // this is new
// add socket.io
var io = require('socket.io').listen(server);
// send to one user

var path = require("path");
var bodyParser = require('body-parser');
var anyDB = require('any-db');

var conn = anyDB.createConnection('sqlite3://chatroom.db');
var messageTable = conn.query('CREATE TABLE IF NOT EXISTS message (id INTEGER PRIMARY KEY AUTOINCREMENT, room TEXT, nickname TEXT, body TEXT, time TEXT)');

var engines = require('consolidate');
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use('/js', express.static('js'));
app.engine('html', engines.hogan);
app.set('views', __dirname + '/templates');
app.set('view engine', 'html');

var messages = []

// show home.html
app.get('/', function(req, res){
  res.sendFile(path.join(__dirname + '/templates/home.html'));
});

// on chatroom, redirect to unique room URL
app.get('/chatroom', function(req, res){
  var newRoom = generateRoomIdentifier();
  res.redirect('/chatroom/' + newRoom);
});

app.get('/chatroom/:roomName', function(req, res){
  res.render('room.html', {roomName: req.params.roomName});
});

io.sockets.on('connection', function(socket){

    // on client side we sent back the roomname and the nickname
    socket.on('join', function(roomName, nickname, callback){
      
      // join the room name that is passed
      socket.join(roomName);

      // add a nickname property to the socket and set it to emitted nickname
      socket.nickname = nickname;

      // send back the messages already saved in that room, if any
      conn.query('SELECT * FROM message WHERE room=$1', function(error, data){
        // each item in this array is one message
        // messages = data.rows;

        if (error){
          console.log("FAILED to add to database");
          res.sendStatus(500);
        } else {
          messages = data.rows;
          socket.emit('join', messages);
        }

      });

      // send back messages, where each item is a single message with all 3 elements
      //callback(messages);
      broadcastMemberJoined();
    });

    // socket.emit('join', function(messages){
    //   console.log(messages);
    // });

    socket.on('changedNickname', function(nickname){
        socket.nickname = nickname;
        broadcastMemberJoined();
    });

    // add incoming message to database
    socket.on('message', function(message){

      var roomNamee = Object.keys(io.sockets.adapter.sids[socket.id])[1];
      var nicknamee = socket.nickname
      var date = new Date();
      var timee = date.getHours() + ":" + date.getMinutes();

      // add to database
      //conn.query('INSERT INTO message (room, nickname, body, time) VALUES($1, $2, $3, $4)', [roomNamee, nicknamee, message, timee]);
      
      // add to database
      conn.query('INSERT INTO message (room, nickname, body, time) VALUES($1, $2, $3, $4)', [roomNamee, nicknamee, message, timee], function(error, data) {
        console.log(messageTable);
        if (error){
          console.log("FAILED to add to database")
          res.sendStatus(500);
        } else {
          messages = data.rows;
        }
      });

  //       conn.query('INSERT INTO message (room, nickname, body, time) VALUES($1, $2, $3, $4)', [roomm, nicknamee, bodyy, timee], function(error, data) { 
  //     if(error){
  //         console.log("failed to add to database....")
  //         res.sendStatus(500);
  //     } else {
  //         console.log("added")
  //         res.json({nickname: nicknamee, message: bodyy, time:timee})
  //     }
  // })};

      // send back to roomname the message, along with other info to display
      io.sockets.in(roomNamee).emit('message', nicknamee, message, timee);
    
    });

    socket.on('disconnect', function(){
        // Leave the room!
        // notify others

        broadcastMemberJoined();
    });

    socket.on('error', function(){
        // Don't forget to handle errors!
        // Maybe you can try to notify users that an error occured and log the error as well.
    });

})

function broadcastMemberJoined(roomName, nickname) {
    io.sockets.in(roomName).emit('newMember', nickname);

}

// app.post('/:roomName/messages', saveMessage);

// // change to socket (on message, save the message,)
// // add chat information to database

// function saveMessage(req, res) {

//   var roomm = req.params.roomName;
//   var nicknamee = req.body.nickname;
//   var bodyy = req.body.message;
//   var date = new Date();
//   var timee = date.getHours() + ":" + date.getMinutes();

//   conn.query('INSERT INTO message (room, nickname, body, time) VALUES($1, $2, $3, $4)', [roomm, nicknamee, bodyy, timee], function(error, data) { 
//       if(error){
//           console.log("failed to add to database....")
//           res.sendStatus(500);
//       } else {
//           console.log("added")
//           res.json({nickname: nicknamee, message: bodyy, time:timee})
//       }
//   })};

function generateRoomIdentifier() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  var result = '';
  for (var i = 0; i < 6; i++)
    result += chars.charAt(Math.floor(Math.random() * chars.length));

  //return result;
  return uniqueRoom(result);
}

var resultArray = [];

// get a unique room number
function uniqueRoom(result){
    var i = resultArray.length;
    if (i===0){
        return result;
    } else {
        // loop through list of results
        while (i--){
            // if there's a duplicate item
            if (resultArray[i]===result){
                // generate another room ID, don't add to list
                generateRoomIdentifier();
            }
        }
        // else add to result array and return the unique ID
        resultArray.push(result);
        return result;
    }
}

var port = process.env.PORT || 8080;
server.listen(port);
console.log("listening to port " + port)

/**


app.use(function(req, res) {
	res.status(404).type('html');
    res.write('<h1>404 - Page Not Found</h1>');
    res.end();
	});

*/

