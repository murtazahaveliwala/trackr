var express = require('express');
var app = express();
var server = require('http').Server(app);
var ws = require('nodejs-websocket');

var index = 0;
var pollTimeoutId = undefined;
var POLL_DURATION = 3000;
var duration = undefined;
var readings = {};

//var fakeReadings = {
//  'tessel-probe-1': [{
//    epoch: Date.now(),
//    temperature: 37,
//    humidity: 72
//  }, {
//    epoch: Date.now() + 1000,
//    temperature: 37.1,
//    humidity: 72.3
//  }, {
//    epoch: Date.now() + 2000,
//    temperature: 37.1,
//    humidity: 72.3
//  }, {
//    epoch: Date.now() + 3000,
//    temperature: 37.2,
//    humidity: 72.4
//  }]
//};
//readings = fakeReadings;

app.set('port', process.env.PORT || 5000);

app.use(express.static('public'));

var socketServer = ws.createServer(function(conn) {
  conn.on('text', function(text) {
    console.log('reading - ', text);

    var data = JSON.parse(text);
    recordReading(data);
  });
}).listen(9050, function() {
  console.log('Listening on 9050.');
});

server.listen(app.get('port'), function(err) {
  if (err) {
    console.log('Error creating server!', err);
  } else {
    console.log('Server started at port ', app.get('port'));
  }
});

app.get('/check', function(req, res) {
  index++;

  res.send('' + index);
});

app.get('/start/:duration?', function(req, res) {
  duration = req.params.duration || POLL_DURATION;

  startPolling();

  res.send(200, 'Polling initiated after every ' + duration + 'ms');
});


app.get('/stop', function(req, res) {
  stopPolling();

  res.send(200, 'Polling terminated.');
});

app.get('/readings/:dId?', function(req, res) {
  var response;

  if (req.params.dId) {
    response = readings[req.params.dId];
  } else {
    response = readings;
  }

  res.json(response);
});

function stopPolling() {
  if (pollTimeoutId) {
    console.log('Stopping polling.');

    clearTimeout(pollTimeoutId);
    pollTimeoutId = undefined;
  }
}

function startPolling() {
  if (!pollTimeoutId) {
    pollTimeoutId = setTimeout(function repeat() {
      var rId = Date.now();

      console.log('Polling devices. ', rId, ' duration: ', duration);

      socketServer.connections.forEach(function(conn) {
        //console.log('sending message for reading to ', conn);
        conn.sendText(JSON.stringify({
          rId: rId
        }));
      });

      pollTimeoutId = setTimeout(repeat, duration);
    }, duration);
  }
}

function recordReading(data) {
  //console.log('Recording reading:', data);

  if (data.dId) {
    var dId = data.dId;

    if (!readings[dId]) {
      readings[dId] = [];
    }

    readings[dId].push({
      epoch: data.rId,
      temperature: data.temperature,
      humidity: data.humidity
    });
  }
}