var tessel = require('tessel'),
    climateLib = require('climate-si7020'),
    CLIMATE_MODULE_PORT = 'A',
    climate = climateLib.use(tessel.port[CLIMATE_MODULE_PORT]); // climate module sensed from port 'A'

var READING_TIMEOUT = 1000;

function initialize() {
    attachHandlers();
}

function attachHandlers() {
  climate.on('ready', onReady);

  climate.on('error', onError);

  console.log('Attached handlers, waiting for sensor to get ready...');
}

function onReady() {
  console.log('Sensor ready for measurements.');
  console.log('***** Press CTRL + C to quit *****');

  setInterval(function() {
    try {
      getReadings(Date.now());
    } catch(ex) {
      console.log('Error in fetching readings from climate module!', ex);
    }
  }, READING_TIMEOUT);
}

function onError(err) {
  console.log('Error connecting to Climate module! (Is it inserted in port ' + CLIMATE_MODULE_PORT + '?)');
  console.log(err);
}

function getReadings(timeInstant) {
  climate.readTemperature('c', function (err, temp) {
    if (err) {
      console.log('Error while measuring temperature!', err);
      return;
    }

    temp = temp.toFixed(2);
    climate.readHumidity(function (err, humid) {
      if (err) {
        console.log('Error while measuring humidity!', err);
        return;
      }

      humid = humid.toFixed(2);
      console.log(timeInstant + ' - Degrees:', temp + 'C', 'Humidity:', humid + '%RH');
    });
  });
}

console.log('\n\nInitialising.');
initialize(); // set dominoes in motion