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

    socket.on('join', function(roomName, nickname, callback){
      socket.join(roomName);
      socket.nickname = nickname;

      var messages = 'SELECT * FROM message WHERE room=$1';

      callback(messages);
      broadcastMemberJoined();
    });

    socket.on('changedNickname', function(nickname){
        socket.nickname = nickname;
        broadcastMemberJoined();
    });

    socket.on('message', function(message){
      var roomName = Object.keys(io.sockets.adapter.sids[socket.id])[1];
      // send back to roomname the message, along with other info to display
      io.sockets.in(roomName).emit('message', nickname, message, time);
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

app.post('/:roomName/messages', saveMessage);

// change to socket (on message, save the message,)
// add chat information to database
function saveMessage(req, res) {
    console.log("saving message")
  var roomm = req.params.roomName;
  var nicknamee = req.body.nickname;
  var bodyy = req.body.message;
  var date = new Date();
  var timee = date.getHours() + ":" + date.getMinutes();

  var msgss = conn.query('INSERT INTO message (room, nickname, body, time) VALUES($1, $2, $3, $4)', [roomm, nicknamee, bodyy, timee], function(error, data) {
      if(error){
          console.log("failed to add to database....")
          res.sendStatus(500);
      } else {
          console.log("added")
          res.json({nickname: nicknamee, message: bodyy, time:timee})
      }
  })};


app.use(function(req, res) {
	res.status(404).type('html');
    res.write('<h1>404 - Page Not Found</h1>');
    res.end();
	});

*/

