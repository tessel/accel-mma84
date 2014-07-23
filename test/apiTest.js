var test = require('tinytap');

var assert = require('assert');
var async = require('async');
var tessel = require('tessel');
var accelLib = require('../');

var portname = process.argv[2] || 'A';
var requireTime = new Date(milliseconds);
var accel;

test.count(42);

async.series([
  // Test connecting
  test('Connecting to accelerometer module', function (t) {
    accel = accelLib.use(tessel.port[portname], function (err, accel) {
      t.ok(accel, 'The accelerometer module object was not returned');
      t.equal(err, undefined, 'There was an error connecting');
      // Test events
      var timeout = 1000;
      //ready
      var readyTimer = setTimeout(function () {
        t.ok(false, 'Failed to emit ready event in a reasonable amount of time.');
        t.end();
      }, timeout);
      accel.on('ready', function() {
        clearTimeout(readyTimer);
        t.ok(true, 'ready was emitted');
        //data
        var dataTimer = setTimeout(function () {
          t.ok(false, 'Failed to emit data event in a reasonable amount of time.');
          t.end();
        }, timeout);
        accel.on('data', function(data) {
          clearTimeout(dataTimer);
          t.ok(true, 'data was emitted');
          // Check the data to make sure it's valid
          // Data has length 3
          t.ok(data.length == 3, 'there should be three values in an accelerometer reading');
          // The three things in data are numbers
          data.forEach(function (val, index) {
            t.ok((typeof val) == 'number', 'value ' + val + ' should be a number');
            if(index == (data.length - 1)) {
              t.end();
            }
          });
        });
      });
      //error
      // Fail if we get an error
      accel.on('error', function (err) {
        t.ok(false, 'error caught: ' + err);
        t.end();
      });
    });
  }),
  
  // Test methods
  test('availableOutputRates', function (t) {
    var rates = accel.availableOutputRates();
    // Return value has a length
    t.ok(rates.length > 0, 'returned value from availableOutputRates has no length');
    // The things in the returned array are numbers
    rates.forEach(function (val, index) {
      t.equal(typeof val, 'number', 'value ' + val + ' is not a number');
      if(index == (rates.length - 1)) {
        t.end();
      }
    });
  }),
  
  test('availableScaleRanges', function (t) {
    var ranges = accel.availableScaleRanges();
    // Return value has a length
    t.ok(ranges.length > 0, 'returned value from availableScaleRanges has no length');
    // The things in the returned array are numbers
    ranges.forEach(function (val, index) {
      t.equal((typeof val), 'number', 'value ' + val + ' is not a number');
          if(index == (ranges.length - 1)) {
      t.end();
      }
    });
  }), 
  
  test('enableDataInterrupts', function (t) {
    var timeToWait = 1000;
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
      t.ok(collector[0] > 2, 'no data emitted initially');
      t.ok(collector[1] < 2, 'data continues to be emitted after data interrupts disabled');
      t.ok(collector[2] > 2, 'data not emitted even after data interrupts re-enabled');
      t.end();
    }, timeToWait * 3);
  }),
  
  test('getAcceleration', function (t) {
    accel.getAcceleration(function (err, data) {
      // Make sure there's no error
      if(err) {
        t.ok(false, 'error caught: ' + err);
      }
      // Check the data to make sure it's valid
      // Data has length 3
      t.ok(data.length == 3, 'there should be three values in an accelerometer reading');
      // The three things in data are numbers
      data.forEach(function (val, index) {
        t.ok((typeof val) == 'number', 'value ' + val + ' should be a number');
        if(index == (data.length - 1)) {
          t.end();
        }
      }); 
    });
  }),

  test('setOutputRate', function (t) {
    // Check for all available output rates
    async.eachSeries(accel.availableOutputRates(), function (rate, callback) {
      // Function completes in a reasonable amount of time
      var aboutToSet = new Date(milliseconds);
      accel.setOutputRate(rate, function (err) {
        if(err) {
          t.ok(false, 'error caught: ' + err);
        }
        var justSet = new Date(milliseconds);
        t.ok(justSet - aboutToSet < 900, 'took too long to set output rate ' + rate);
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
              t.ok(freq > 11, 'rate ' + rate + 'Hz failed, measured frequency ' + freq + ' Hz'); // WORKAROUND: this is sucky but on current firmware this is about as fast as it can go
            } else {
              t.ok(freq < (rate * 1.1) && freq > (rate * 0.9), 'rate ' + rate + ' Hz failed, measured frequency ' + freq + ' Hz');
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
    }, function () {
      t.end();
    });
  }),
  
  test('setScaleRange', function (t) {  
    // Check for all available scale ranges
    var ranges = accel.availableScaleRanges();
    var collector = {};
    async.eachSeries(accel.availableScaleRanges(), function (range, callback) {
      // Function completes in a reasonable amount of time
      var aboutToSet = new Date(milliseconds);
      accel.setScaleRange(range, function (err) {
        if(err) {
          t.ok(false, 'error caught: ' + err);
        }
        var justSet = new Date(milliseconds);
        t.ok(justSet - aboutToSet < 300, 'timed out setting output rate ' + range);
        accel.getAcceleration(function (err, data) {
          if(err) {
            t.ok(false, 'error caught: ' + err);
          }
          collector[range] = data;
          callback();
        });
      });
    }, function () {
      // Make sure the different settings are proportionally accurate
      baseline = ranges[0];
      var proportion;
      ranges.forEach(function (range, index) {
        proportion = range / baseline;
        collector[baseline].forEach(function (datum, index) {
          t.ok(collector[range][index] / datum == proportion, 'error setting range to ' + range + ' Gs; unexpected output');
        });
        if(index == (ranges.length - 1)) {
          t.end();
        }
      });
    });
  })

  ], function (err) {
    console.log('error running tests', err);
});