/*********************************************
 This basic climate example logs a stream
 of temperature and humidity to the console.
 *********************************************/

var tessel = require('tessel');
var ws = require('nodejs-websocket');
var wifi = require('wifi-cc3000');
var configs = require('./configs.json');
var climatelib = require('climate-si7020');
var climate = climatelib.use(tessel.port['A']);
var socketStateLed = tessel.led[0].output(0);
var readingStateLed = tessel.led[1].output(0);

var selfConnectedWifi = false;

try {
  // check wifi status. If auto wifi connection is being attempted, disconnect
  // it and reattempt wifi connection using the credentials available
  if (wifi.isBusy()) {
    setTimeout(checkAndSelfAttemptWifiConnection, 10000);
  } else {
    checkAndSelfAttemptWifiConnection();
  }

  wifi.on('connect', function() {
    if (!selfConnectedWifi) {
      console.log('auto-wifi connection was established, attempting for self ' +
          'connection.');
      return;
    }

    console.log('Wifi is now connected.');

    console.log('Attempting to connect to remote at ', configs.remote.socketUrl);
    var socket = ws.connect(configs.remote.socketUrl, function(err) {
      if (err) {
        console.log('Error connecting to remote - ', err);
      } else {
        console.log('Connected to remote');
      }
    });

  // When we get text back
    socket.on('text', function(text) {
      // print it out
      console.log('Reading request received - ', text);
      var data = JSON.parse(text);

      getReading(function(rId, temp, humid) {
        console.log('Sending reading - ', temp, humid);

        socket.sendText(JSON.stringify({
          dId: configs.device.id,
          rId: rId,
          temperature: temp,
          humidity: humid
        }));

      }.bind(undefined, data.rId));
    });

    socket.on('error', function() {
      socketStateLed.output(0);
      console.log('Error - ', arguments);
    });

    socket.on('close', function(code, reason) {
      socketStateLed.output(0);
      console.log('Socket CLOSED - ', code, reason);
    });

    socket.on('connect', function() {
      socketStateLed.output(1);
      console.log('Socket CONNECTED.');
    });
  });

  function getReading(callback) {
    if (climateReady) {
      readingStateLed.output(1);

      climate.readTemperature('c', function (err, temp) {
        temp = temp.toFixed(2);
        climate.readHumidity(function (err, humid) {
          humid = humid.toFixed(2);

          readingStateLed.output(0);

          console.log('Degrees:', temp + 'C', 'Humidity:', humid + '%RH');
          callback(temp, humid);
        });
      });
    } else {
      console.log('Climate module not ready yet.');
    }
  }

  var climateReady = false;
  climate.on('ready', function () {
    console.log('Connected to si7020');

    climateReady = true;
  });

  climate.on('error', function(err) {
    climateReady = false;

    readingStateLed.output(0);

    console.log('error connecting module', err);
  });

} catch(e) {
  console.log('App Error: ', e);
}


function checkAndSelfAttemptWifiConnection() {
  if (wifi.isConnected()) {
    console.log('Auto wifi connection succeeded. Disconnecting and ' +
        're-attempting self connection.');

    wifi.disconnect();
    connectToWifi();
  } else {
    console.log('auto-wifi connection didn\'t succeed. Attempting ' +
        'self-connection.');
    connectToWifi();
  }
}

function connectToWifi() {
  // turn it to true to signal that the connect event to be generated next is
  // from our own connection attempt
  selfConnectedWifi = true;

  var wifiConfigs = configs.wifi;
  wifi.connect({
    security: wifiConfigs.security,
    ssid: wifiConfigs.ssid,
    password: wifiConfigs.password,
    timeout: 30 // in seconds
  });
}