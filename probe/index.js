var tessel = require('tessel'),
    ws = require('nodejs-websocket'),
    wifi = require('wifi-cc3000'),
    configs = require('./configs.json'),
    climateLib = require('climate-si7020'),
    climate;


var WIFI_BUSY_CHECK_TIMEOUT = 10000, // in milliseconds
    WIFI_RECONNECTION_TIMEOUT = 30,  // in seconds
    GREEN_LED_INDEX = 0,
    BLUE_LED_INDEX = 1,
    CLIMATE_MODULE_PORT = 'A',
    selfConnectedWifi = false,
    socketStateLed = tessel.led[GREEN_LED_INDEX].output(0),   // green LED
    readingStateLed = tessel.led[BLUE_LED_INDEX].output(0),  // blue LED
    climateReady = false;

try {

  function establishWifiConnection() {
    // check wifi status. If auto wifi connection is being attempted, disconnect
    // it and reattempt wifi connection using the credentials available
    if (wifi.isBusy()) {
      setTimeout(checkAndSelfAttemptWifiConnection, WIFI_BUSY_CHECK_TIMEOUT);
    } else {
      checkAndSelfAttemptWifiConnection();
    }
  }

  function initialize() {
    establishWifiConnection();

    attachWifiHandlers();

    attachClimateModuleHandlers();

  }

  function attachWifiHandlers() {
    // attach handler to detect successful wifi connection
    wifi.on('connect', function () {

      // if auto wifi connection got through, return and wait for self connection
      // attempt
      if (!selfConnectedWifi) {
        console.log('auto-wifi connection was established, attempting for self ' +
            'connection.');
        return;
      }

      console.log('Wifi is now connected.');

      // Establish a websocket connection to remote application to get reading
      // requests
      console.log('Attempting to connect to remote at ',
          configs.remote.socketUrl);
      var socket = ws.connect(configs.remote.socketUrl, function (err) {
        if (err) {
          console.log('Error connecting to remote - ', err);
        } else {
          console.log('Connected to remote application.');
        }
      });

      // When we get text back
      socket.on('text', function (text) {
        // print it out
        console.log('\nReading request received - ', text);
        var data = JSON.parse(text);

        // ask climate module for a reading and to send the reading to the remote
        // app using the established socket connection
        getReading(function (rId, temp, humid) {
          console.log('Sending reading - ', temp, humid);

          socket.sendText(JSON.stringify({
            dId: configs.device.id,
            rId: rId,
            temperature: temp,
            humidity: humid
          }));

        }.bind(undefined, data.rId));
      });

      socket.on('error', function () {
        updateLEDState(socketStateLed, false);

        console.log('Error - ', arguments);
      });

      socket.on('close', function (code, reason) {
        updateLEDState(socketStateLed, false);

        console.log('Socket CLOSED - ', code, reason);
      });

      socket.on('connect', function () {
        updateLEDState(socketStateLed, true);

        console.log('Socket CONNECTED.');
      });
    });
  }

  function attachClimateModuleHandlers() {
    climate = climateLib.use(tessel.port[CLIMATE_MODULE_PORT]); // climate module sensed from port 'A'

    // Ready climate module for measurements
    climate.on('ready', function () {
      console.log('Connected to climate module(si7020)');

      climateReady = true;
    });

    // Catch errors, if any, from climate module
    climate.on('error', function (err) {
      climateReady = false;

      updateLEDState(readingStateLed, false);

      console.log('error connecting module', err);
    });
  }

  /**
   * Fetches temperature and humidity readings from climate module, provided
   * climate module is ready.
   * If it is not ready, then requests for readings are ignored.
   * If it is ready, readings are taken and the passed callback is executed and
   * provide with those readings
   *
   * @param callback {function}  Required. Callback to be executed after getting
   *     the readings from climate module
   */
  function getReading(callback) {

    // if climate module is ready
    if (climateReady) {
      updateLEDState(readingStateLed, true);

      climate.readTemperature('c', function (err, temp) {
        temp = temp.toFixed(2);
        climate.readHumidity(function (err, humid) {
          humid = humid.toFixed(2);

          updateLEDState(readingStateLed, false);

          console.log('Degrees:', temp + 'C', 'Humidity:', humid + '%RH');
          callback(temp, humid);
        });
      });
    } else {
      console.log('Climate module not ready yet.');
    }
  }

  /**
   * Checks if the probe already has a wifi connection.
   * If so, it disconnects and re-attempts connection by itself.
   *
   * Self attempt was required to get over issue in unreliable socket connection
   * when wifi was attempted by the board itself and socket connection later
   * didn't succeed.
   */
  function checkAndSelfAttemptWifiConnection() {
    if (wifi.isConnected()) {
      console.log('Auto wifi connection had succeeded. Disconnecting and ' +
          're-attempting self connection.');

      wifi.disconnect(); // disconnect
      connectToWifi(); // reconnect
    } else {
      console.log('auto-wifi connection didn\'t succeed. Attempting ' +
          'self-connection.');
      connectToWifi(); // connect
    }
  }

  /**
   * Connects to wifi and sets up internal flag to signal wifi connection was
   * via this api
   */
  function connectToWifi() {
    // turn it to true to signal that the connect event to be generated next is
    // from our own connection attempt
    selfConnectedWifi = true;

    var wifiConfigs = configs.wifi;

    // if attempting connection to secure network for which password is provided
    if (wifiConfigs.password) {
      // default the security protocol to wpa2
      wifiConfigs.security = wifiConfigs.security || 'wpa2';

      console.log('Attempting wifi connection to network with ssid ',
          wifiConfigs.ssid, ' using ', wifiConfigs.security,
          ' and password ', wifiConfigs.password);

      wifi.connect({
        security: wifiConfigs.security,
        ssid: wifiConfigs.ssid,
        password: wifiConfigs.password,
        timeout: WIFI_RECONNECTION_TIMEOUT
      });
    } else { // attempting connection to open network
      console.log('Attempting wifi connection to open network with ssid ',
          wifiConfigs.ssid);

      wifi.connect({
        ssid: wifiConfigs.ssid,
        timeout: WIFI_RECONNECTION_TIMEOUT
      });
    }
  }

  /**
   * Turns On or Off the passed on-board LED
   * @param led {Object}  Required.
   * @param state {boolean}  Required.
   */
  function updateLEDState(led, state) {
    led.output(state);
  }


  initialize();
} catch(e) {
  console.log('Probe Error: ', e);
}
