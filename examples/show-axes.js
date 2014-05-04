/*********************************************
Demonstrates axes by turning on a different
LED per axis (x, y, z) only when that axis
has positive acceleration. Also prints +/-
per axis to the console.
*********************************************/

var tessel = require('tessel');
var accel = require('accel-mma84').use(tessel.port('A'));

// Define vars
var led1 = tessel.led[1].output();
var led2 = tessel.led[2].output();
var led3 = tessel.led[3].output();

var textOut = "";

accel.on('ready', function(){
  accel.on('data', function(xyz){
    // Refresh variables;
    var x = xyz[0];
    var y = xyz[1];
    var z = xyz[2];

    textOut = "";

    // light & print which axes are positive
    if(x > 0) {
      led1.high();
      textOut += "x: + | ";
    } else {
      led1.low();
      textOut += "x: - | ";
    }
    if(y > 0) {
      led2.high();
      textOut += "y: + | ";
    } else {
      led2.low();
      textOut += "y: - | ";
    }
    if(z > 0) {
      led3.high();
      textOut += "z: +";
    } else {
      led3.low();
      textOut += "z: -";
    }

    console.log(textOut);
  });
});
