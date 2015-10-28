var ws = require('nodejs-websocket');

//var socket = ws.connect('ws://echo.websocket.org/', function(err) {
var socket = ws.connect('ws://192.168.43.147:9050', function(err) {
  console.log('connected.');
  if (err) {
    console.log('Error connecting!');
  } else {
    console.log('WS connected.');
  }
});

socket.on('error', function() {
  console.log('Error - ', arguments);
});

socket.on('text', function(text) {
  // print it out
  console.log('Reading request received - ', text);
});

socket.on('close', function(code, reason) {
  console.log('socket closed - ', code, reason);
});