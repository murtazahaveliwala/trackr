var http = require('http');

var statusCode = 200,
    URL = 'http://httpstat.us/' + statusCode,
    count = 1;

setImmediate(function start() {
  console.log('http request #' + (count++), ' to ', URL);

  http.get(URL , function(response) {
    console.log('# statusCode', res.statusCode);

    var bufs = [];

    response.on('data', function (data) {
      bufs.push(new Buffer(data));
      console.log('# received', new Buffer(data).toString());
    });

    response.on('end', function () {
      console.log('done.');

      // redo
      setImmediate(start);
    })
  }).on('error', function (e) {
    console.log('Couldn\'t get response!\nURL may be unreachable.');
    console.log(e);

    // re-attempt
    setImmediate(start);
  });
});