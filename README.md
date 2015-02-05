#Accelerometer
Driver for the accel-mma84 Tessel accelerometer module. The hardware documentation for this module can be found [here](https://github.com/tessel/hardware/blob/master/modules-overview.md#accelerometer). 

If you run into any issues you can ask for support on the [Accelerometer Module Forums](http://forums.tessel.io/category/accelerometer).

###Installation
```sh
npm install accel-mma84
```

###Example
```js
/*********************************************
This basic accelerometer example logs a stream
of x, y, and z data from the accelerometer
*********************************************/

var tessel = require('tessel');
var accel = require('../').use(tessel.port['A']); // Replace '../' with 'accel-mma84' in your own code

// Initialize the accelerometer.
accel.on('ready', function () {
    // Stream accelerometer data
  accel.on('data', function (xyz) {
    console.log('x:', xyz[0].toFixed(2),
      'y:', xyz[1].toFixed(2),
      'z:', xyz[2].toFixed(2));
  });

});

accel.on('error', function(err){
  console.log('Error:', err);
});
```

###Methods

&#x20;<a href="#api-accel-availableOutputRates-Logs-the-available-interrupt-rates-in-Hz" name="api-accel-availableOutputRates-Logs-the-available-interrupt-rates-in-Hz">#</a> accel<b>.availableOutputRates</b>()  
 Logs the available interrupt rates in Hz.  

&#x20;<a href="#api-accel-availableScaleRanges-Logs-the-available-accelerometer-ranges-in-units-of-Gs" name="api-accel-availableScaleRanges-Logs-the-available-accelerometer-ranges-in-units-of-Gs">#</a> accel<b>.availableScaleRanges</b>()  
Logs the available accelerometer ranges (in units of Gs).  

&#x20;<a href="#api-accel-enableDataInterrupts-trueOrFalse-callback-err-Enables-or-disables-data-interrupts-Set-the-first-param-truthy-to-enable-falsy-to-disable" name="api-accel-enableDataInterrupts-trueOrFalse-callback-err-Enables-or-disables-data-interrupts-Set-the-first-param-truthy-to-enable-falsy-to-disable">#</a> accel<b>.enableDataInterrupts</b>( trueOrFalse, callback(err) )  
 Enables or disables data interrupts, and thus, `data` events. Set the first param truthy to enable, falsy to disable.  

&#x20;<a href="#api-accel-getAcceleration-callback-err-xyz-Gets-the-acceleration-from-the-device-outputs-as-array-x-y-z" name="api-accel-getAcceleration-callback-err-xyz-Gets-the-acceleration-from-the-device-outputs-as-array-x-y-z">#</a> accel<b>.getAcceleration</b>( callback(err, xyz) )  
 Gets the acceleration from the device, outputs as array [x, y, z].  

&#x20;<a href="#api-accel-setOutputRate-rateInHz-callback-err-Sets-the-output-rate-of-the-data-1-56-800-Hz" name="api-accel-setOutputRate-rateInHz-callback-err-Sets-the-output-rate-of-the-data-1-56-800-Hz">#</a> accel<b>.setOutputRate</b>( rateInHz, callback(err) )  
Sets the output rate of the data (1.56-800 Hz).  

&#x20;<a href="#api-accel-setScaleRange-scaleRange-callback-err-Sets-the-accelerometer-to-read-up-to-2-4-or-8-Gs-of-acceleration-smaller-range-better-precision" name="api-accel-setScaleRange-scaleRange-callback-err-Sets-the-accelerometer-to-read-up-to-2-4-or-8-Gs-of-acceleration-smaller-range-better-precision">#</a> accel<b>.setScaleRange</b>( scaleRange, callback(err) )  
Sets the accelerometer to read up to 2, 4, or 8 Gs of acceleration (smaller range = better precision).  

###Events
&#x20;<a href="#api-accel-on-data-callback-xyz-Emitted-when-data-is-available-xyz-is-an-array-in-the-form-of-x-y-z" name="api-accel-on-data-callback-xyz-Emitted-when-data-is-available-xyz-is-an-array-in-the-form-of-x-y-z">#</a> accel<b>.on</b>( 'data', callback(xyz) )  
 Emitted when data is available. xyz is an array in the form of [x, y, z].  

&#x20;<a href="#api-accel-on-error-callback-err-Emitted-upon-error" name="api-accel-on-error-callback-err-Emitted-upon-error">#</a> accel<b>.on</b>( 'error', callback(err) )  
 Emitted upon error.  

&#x20;<a href="#api-accel-on-ready-callback-Emitted-upon-first-successful-communication-between-the-Tessel-and-the-module" name="api-accel-on-ready-callback-Emitted-upon-first-successful-communication-between-the-Tessel-and-the-module">#</a> accel<b>.on</b>( 'ready', callback() )  
 Emitted upon first successful communication between the Tessel and the module.  

###Further Examples
* [Change Rates](https://github.com/tessel/accel-mma84/blob/master/examples/change-rates.js). This more advanced accelerometer example logs a stream of x, y, and z data, then stops the stream, changes the polling rate, and resumes streaming from the accelerometer.
* [Show Axes](https://github.com/tessel/accel-mma84/blob/master/examples/show-axes.js). Demonstrates axes by turning on a different LED per axis (x, y, z) only when that axis has positive acceleration. Also prints +/- per axis to the console.

###Licensing  
MIT or Apache 2.0, at your option
