/*********************************************
This more advanced accelerometer example logs
a stream of x, y, and z data, then stops the
stream, changes the polling rate, and resumes
streaming from the accelerometer
*********************************************/

var tessel = require('tessel');
var accel = require('../').use(tessel.port("A"));

// Initialize the accelerometer.
accel.on('ready', function () {
	// Stream accelerometer data
	accel.on('data', function (xyz) {
		console.log("x:", xyz[0].toFixed(2),
      "y:", xyz[1].toFixed(2),
      "z:", xyz[2].toFixed(2));
	});
	//After two seconds, stop streaming
	setTimeout(function () {
		console.log('removing listeners')
		accel.removeAllListeners('data');
		//After two more seconds, change stream rate, then stream again
			console.log('Changing poll frequency')
			accel.setOutputRate(1.56, function rateSet() {
				accel.on('data', function (xyz) {
					console.log("slow x:", xyz[0].toFixed(2),
			      "slow y:", xyz[1].toFixed(2),
			      "slow z:", xyz[2].toFixed(2));
				});
			}); // every 1 second (default is 10x/second)
	}, 2000);
});

accel.on('error', function(err) {
	console.log('there was an error', err);
})

setInterval(function() {}, 20000);