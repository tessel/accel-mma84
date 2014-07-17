var assert = require('assert');
var async = require('async');

var tessel = require('tessel');
var startTime = new Date(milliseconds);
var accel = require('../').use(tessel.port[process.argv[2] || 'A']);
var requireTime = new Date(milliseconds);

// Make sure accel-mma84 requires in a reasonable amount of time
assert(requireTime - startTime < 500, 'timed out requiring accel-mma84');


//***Events***//
//ready
  // It calls ready within a reasonable amount of time
  accel.on('ready', function() {
    var readyTime = new Date(milliseconds);
    assert(readyTime - requireTime < 500, 'timed out waiting for ready event');
//data
    // It gets data within a reasonable amount of time
    var firstData = true;
    accel.on('data', function(data) {
      if(firstData) {
        var dataTime = new Date(milliseconds);
        assert(dataTime - readyTime < 300, 'timed out waiting for initial data');
        // Check the data to make sure it's valid
        checkValidAccelData(data);
        firstData = false;
        accel.removeAllListeners('data');
      }
    });
  });

//error
  // Fail if we get an error
  accel.on('error', function (err) {
    assert(false, 'error caught: ' + err);
  });

//***Methods***//
//availableOutputRates
var rates = accel.availableOutputRates();
// Return value has a length
assert(rates.length > 0, 'returned value from availableOutputRates has no length');
// The things in the returned array are numbers
rates.forEach(function (val) {
  assert((typeof val) == 'number', 'value ' + val + ' is not a number');
});

//availableScaleRanges()
var rates = accel.availableOutputRates();
// Return value has a length
assert(rates.length > 0, 'returned value from availableScaleRanges has no length');
// The things in the returned array are numbers
rates.forEach(function (val) {
  assert((typeof val) == 'number', 'value ' + val + ' is not a number');
});

//enableDataInterrupts
var timeToWait = 1100;
var counter = 0;
// Enable initially
accel.enableDataInterrupts(true, function () {
  setTimeout(function () {
    // Disable
    accel.enableDataInterrupts(false, function () {
      counter++;
      setTimeout(function () {
        // Enable
        accel.enableDataInterrupts(true, function () {
          counter++;
        });
      }, timeToWait);
    });
  }, timeToWait);
});
// Collect data
var collector = {0:0, 1:0, 2:0}; // 0 enabled, 1 disabled, 2 re-enabled
accel.on('data', function (data) {
  collector[counter] ++;
});
// Stop listening once test is complete
setTimeout(function () {
  accel.removeAllListeners('data');
  // Evaluate results
  assert(collector[0] > 2, 'no data emitted initially');
  assert(collector[1] < 2, 'data continues to be emitted after data interrupts disabled');
  assert(collector[2] > 2, 'data not emitted even after data interrupts re-enabled');
}, timeToWait * 3);

//getAcceleration
accel.getAcceleration(function (err, data) {
  // Make sure there's no error
  assert(!err, 'error in getAcceleration');
  // Check the data to make sure it's valid
  checkValidAccelData(data);  
});

//setOutputRate
// Check for all available output rates
async.eachSeries(accel.availableOutputRates(), function (rate, callback) {
  // Function completes in a reasonable amount of time
  var aboutToSet = new Date(milliseconds);
  accel.setOutputRate(rate, function (err) {
    var justSet = new Date(milliseconds);
    assert(justSet - aboutToSet < 900, 'timed out setting output rate ' + rate);
    // New output rate matches the requested output rate (10% tolerance)
    var count = 0;
    var thisTime;
    var lastTime;
    var freq;
    accel.on('data', function (data) {
      thisTime = new Date(milliseconds);
      if(count) { // Check the first few data points
        freq = 1000/(thisTime - lastTime);
        if(rate > 12.5) {
          assert(freq > 11, 'rate ' + rate + 'Hz failed, measured frequency ' + freq + ' Hz'); // WORKAROUND: this is sucky but on current firmware this is about as fast as it can go
        } else {
          assert(freq < (rate * 1.1) && freq > (rate * 0.9), 'rate ' + rate + ' Hz failed, measured frequency ' + freq + ' Hz');
        }
      }
      lastTime = thisTime;
      count ++;
      if(count > 6) {
        accel.removeAllListeners('data');
        callback();
      }
    });
  });
});

//setScaleRange
// Check for all available scale ranges
var ranges = accel.availableScaleRanges();
var collector = {};
async.eachSeries(accel.availableScaleRanges(), function (range, callback) {
  // Function completes in a reasonable amount of time
  var aboutToSet = new Date(milliseconds);
  accel.setScaleRange(range, function (err) {
    var justSet = new Date(milliseconds);
    assert(justSet - aboutToSet < 300, 'timed out setting output rate ' + range);
    accel.getAcceleration(function (err, data) {
      collector[range] = data;
      callback();
    });
  });
}, function () {
  // Make sure the different settings are proportionally accurate
  baseline = ranges[0];
  var proportion;
  ranges.forEach(function (range) {
    proportion = range / baseline;
    collector[baseline].forEach(function (datum, index) {
      assert(collector[range][index] / datum == proportion, 'error setting range to ' + range + ' Gs; unexpected output');
    });
  });
});

function checkValidAccelData(dataArray) {
  // Data has length 3
  assert(dataArray.length == 3, 'there should be three values in an accelerometer reading');
  // The three things in data are numbers
  dataArray.forEach(function (val) {
    assert((typeof val) == 'number', 'value ' + val + ' should be a number');
  });
}