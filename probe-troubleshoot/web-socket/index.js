var configs = require('./configs.json'),
    SOCKET_URL = configs.socketUrl,
    wifi = require('wifi-cc3000'),
    ws = require('nodejs-websocket');

function initialize() {
  // is connected to wifi? If so, then proceed for making web socket connection
  if (wifi.isConnected()) {
    console.log('Connected to wifi network -', wifi.connection().ssid);
    doSocketConnection();
  } else { // not connected to wifi
    console.log('Not connected to any wifi network! \nNeed to be connected ' +
        'to wifi first before establishing socket connection.');
  }
}

function doSocketConnection() {
  console.log('Attempting web socket connection to ', SOCKET_URL);

  var socket = ws.connect(SOCKET_URL, function(err) {
    if (err) {
      console.log('Error establishing a web socket!', err);
    } else {
      console.log('Web socket connection to remote established.');
    }
  });

  socket.on('error', function(err) {
    console.log('Couldn\'t establish socket connection! \nRemote may be ' +
        'unavailable or unreachable.');
    console.log('Error - ', err);
  });

  socket.on('text', function(text) {
    // print it out
    console.log('Request on socket received - ', text);
  });

  socket.on('close', function(code, reason) {
    console.log('socket closed - ', code, reason);
  });
}

// set dominoes in motion
initialize();