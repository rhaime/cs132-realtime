var socket = io.connect(); // obtained through some trickery, you'll see later

// go to new chatroom onclick
function newRoom(){
    window.location.href = window.location + 'chatroom';
}

