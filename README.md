#Accelerometer
Driver for the accel-mma84 Tessel accelerometer module ([MMA8452Q](http://www.freescale.com/files/sensors/doc/data_sheet/MMA8452Q.pdf)).

##Example
```js
// var hardware = require('hardware');
var tessel = require('tessel');
console.log("Connecting to accelerometer on port bank A");
var accel = require('../').connect(tessel.port("A"));

// Initialize the accelerometer.
accel.on('connected', function () {
  // Loop forever.
  setInterval(function () {
    accel.getAcceleration(function (err, xyz) {
      console.log("x:", xyz[0].toFixed(2),
        "y:", xyz[1].toFixed(2),
        "z:", xyz[2].toFixed(2));
    });
  }, 100);
});
```

##Installation
```sh
npm install accel-mma84
```

##Import
```js
var accel = require('accel-mma84').connect(myhardwareapi);
```

##Methods

*  **`accel`.initialize()**

*  **`accel`.getAcceleration(callback(err, xyz))**

##Further Examples

* [Average (more advanced use)](https://github.com/tessel/modules/blob/master/accel-mma84/examples/average.js)

## License

MIT
