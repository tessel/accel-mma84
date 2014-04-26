#Accelerometer
Driver for the accel-mma84 Tessel accelerometer module ([MMA8452Q](http://www.freescale.com/files/sensors/doc/data_sheet/MMA8452Q.pdf)).

##Installation
```sh
npm install accel-mma84
```

##Example
```js
// var hardware = require('hardware');
var tessel = require('tessel');
console.log("Connecting to accelerometer on port bank A");
var accel = require('accel-mma84').use(tessel.port("A"));

// Initialize the accelerometer.
accel.on('ready', function () {
  // Stream accelerometer data
  accel.on('data', function (xyz) {
    console.log("x:", xyz[0].toFixed(2),
      "y:", xyz[1].toFixed(2),
      "z:", xyz[2].toFixed(2));
  });
});

accel.on('error', function(err) {
  console.log("Unable to connect to module: ", err);
})
```

##Methods

*  **`accel`.getAcceleration(callback(err, xyz))**

*  **`accel`.setOutputRate(rateInHz, callback(err, xyz))**

*  **`accel`.availableOutputRates()**

*  **`accel`.setScaleRange(scaleRange, callback(err, xyz))**

*  **`accel`.availableScaleRanges()**

##Events

* *ready*

* *error*

* *data*

##Further Examples

* [Average (more advanced use)](https://github.com/tessel/modules/blob/master/accel-mma84/examples/average.js)

## License

MIT
