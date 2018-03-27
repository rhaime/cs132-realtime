var socket = io.connect();
var sign = "";
var meta = document.querySelector('meta[name=roomName]');
var roomName = meta.content;

// fired when the page has loaded
$(document).ready(function(){
    sign = window.prompt('Enter your username');
    document.getElementById("nicknameField").value = sign;

    // handle incoming messages
    socket.on('message', function(nickname, message, time){
        // display a newly-arrived message
        //socket.broadcast
        $('chats').append($('<li>').text(message));
    });

    socket.on('join', function(members){
        // display the new member list
        // update html -- new member joined, append to ul
    });
    
    socket.emit('nickname', function(nickname){
    	// send new nickname from html to server
    	// broadcast membershipChanged 
    });

    // get the nickname
    var nickname = prompt('Enter a nickname:');

    socket.emit('join', meta('roomName'), nickname, function(messages){
        // process the list of messages the server sent back
        // callback that gets the messages from server
        var ul = $('#chats');
        ul.empty();

        // work with messages
        // eachMsg should be an array w/ all info
        var eachMsg = res.rows;

        for (var i=0; i<eachMsg.length; i++){
            var li = $('<li></li>');

            li.html(
                res.rows[i].nickname + ': ' + res.rows[i].body + ', ' + res.rows[i].time
            );

            ul.append(li);
        }
    });
});

function postOneChat(){
    // in sockets emit this data back to server
    var message= $("#messageField").val()
    socket.emit('message', nickname, message);

    var ul = $('#chats');
    ul.append($('<li></li>').text(res.nickname + ': ' + res.message + ', ' + res.time));

}
