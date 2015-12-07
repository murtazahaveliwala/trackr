var express = require('express'),
    expressApp = express(),
    server = require('http').Server(expressApp),
    ws = require('nodejs-websocket'),
    configs = require('./configs.json');

var index = 0,
    pollTimeoutId = undefined,
    duration = undefined,
    readings = {},
    POLL_DURATION = 3000,
    HTTP_PORT = configs.ports.webServer,
    WEB_SOCKET_PORT = configs.ports.webSocket;

expressApp.set('port', HTTP_PORT);

expressApp.use(express.static('public'));

// Create a web socket on WEB_SOCKET_PORT
var socketServer = ws.createServer(function(connection) {
  connection.on('text', function(text) {
    console.log('reading - ', text);

    recordReading(JSON.parse(text));
  });
}).listen(WEB_SOCKET_PORT, function() {
  console.log('Listening on ' + WEB_SOCKET_PORT);
});

// Create a web socket on HTTP_PORT
server.listen(expressApp.get('port'), function(err) {
  if (err) {
    console.log('Error creating server!', err);
  } else {
    console.log('Server started at port ', expressApp.get('port'));
  }
});

//////////// APIs to be used by frontend to interact
/**
 * Check API. Returns a number, incremented on each call, to test if the
 * frontend is connected to the server or not
 */
expressApp.get('/check', function(req, res) {
  index++;

  res.send('' + index);
});

/**
 * Start Polling API. Starts polling on probes for readings. Can be provided
 * with optional positive poll interval. Polling interval defaults to
 * POLL_DURATION
 */
expressApp.get('/start/:duration?', function(req, res) {
  duration = req.params.duration || POLL_DURATION;

  startPolling();

  res.send(200, 'Polling initiated after every ' + duration + 'ms');
});

/**
 * Stop Polling API. Stops polling on probes for readings.
 */
expressApp.get('/stop', function(req, res) {
  stopPolling();

  res.send(200, 'Polling terminated.');
});

/**
 * Get Readings API. Provides all the readings ever recorded from probes.
 * Optionally can be provided a probe id if results are to be limited to a
 * specific probe.
 */
expressApp.get('/readings/:dId?', function(req, res) {
  var response;

  if (req.params.dId) {
    response = readings[req.params.dId];
  } else {
    response = readings;
  }

  res.json(response);
});

////////////// Private APIs
/**
 * Clears poll timeout
 */
function stopPolling() {
  if (pollTimeoutId) {
    console.log('Stopping polling.');

    clearTimeout(pollTimeoutId);
    pollTimeoutId = undefined;
  }
}

/**
 * Initiates a timeout for polling connected probes for temperature and humidity
 * readings
 */
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

/**
 * Records readings, fetched from devices based on probe IDs
 * @param data {Object}  Required.
 */
function recordReading(data) {
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
