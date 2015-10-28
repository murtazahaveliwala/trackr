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

//if (!wifi.isConnected()) {
//  console.log('Wifi is disconnected. Trying connecting.');
//
//  var wifiConfigs = configs.wifi;
//  wifi.connect({
//    security: wifiConfigs.security,
//    ssid: wifiConfigs.ssid,
//    password: wifiConfigs.password,
//    timeout: 30 // in seconds
// });
//} else {
//  console.log('wifi seems to be connected.');
//}
try{
  wifi.on('connect', function() {
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
      console.log('Error - ', arguments);
    });

    socket.on('close', function(code, reason) {
      console.log('Socket CLOSED - ', code, reason);
    });

    socket.on('connect', function() {
      console.log('Socket CONNECTED.');
    });

    socket.on('disconnect', function() {
      console.log('Socket disconnected - ', arguments);
    });
  });

  function getReading(callback) {
    if (climateReady) {
      climate.readTemperature('c', function (err, temp) {
        temp = temp.toFixed(2);
        climate.readHumidity(function (err, humid) {
          humid = humid.toFixed(2);
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
    console.log('error connecting module', err);
  });

} catch(e) {
  console.log('App Error: ', e);
}
