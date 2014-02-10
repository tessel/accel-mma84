/*********************************************
This more advanced accelerometer example logs
a stream of x, y, and z data, then stops the
stream, changes the polling rate, and resumes
streaming from the accelerometer
*********************************************/

var tessel = require('tessel');
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
		console.log('Stopping stream')
		accel.removeAllListeners('data', function () {
			console.log('listener removed')
			//After two more seconds, change stream rate, then stream again
			setTimeout(function () {
				console.log('Changing poll frequency')
				accel.setPollFrequency(1000); // every 1 second (default is 10x/second)
				accel.on('data', function (xyz) {
					console.log("x:", xyz[0].toFixed(2),
			      "y:", xyz[1].toFixed(2),
			      "z:", xyz[2].toFixed(2));
				});
			}, 2000);
		});
	}, 2000);
});