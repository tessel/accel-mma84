// var hardware = require('hardware');
var tessel = require('tessel');
console.log("Connecting to accelerometer on port bank A");
var accel = require('../').connect(tessel.port("A"));

// Initialize the accelerometer.
accel.on('connected', function () {
	// Stream accelerometer data
	accel.on('data', function (xyz) {
		console.log("x:", xyz[0].toFixed(2),
      "y:", xyz[1].toFixed(2),
      "z:", xyz[2].toFixed(2));
	});
	//After two seconds, stop streaming
	setTimeout(function () {
		accel.removeListener('data');

		//After two more seconds, change stream rate, then stream again
		setTimeout(function () {
			accel.setPollFrequency(1000); // every 1 second (default is 10x/second)
			accel.on('data', function (xyz) {
				console.log("x:", xyz[0].toFixed(2),
		      "y:", xyz[1].toFixed(2),
		      "z:", xyz[2].toFixed(2));
			});
		}, 2000);
	}, 2000);
});
