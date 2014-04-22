/*********************************************
This is a more colorful accelerometer example.
*********************************************/

var tessel = require('tessel');
var accel = require('../').use(tessel.port("A"));

function pad (f) {
  return ("      +" + f.toFixed(2)).substr(-5);
}

function avg (avgs, j) {
  var v = 0;
  for (var i = 0; i < avgs.length; i++) {
    v += avgs[i][j];
  }
  return v / avgs.length;
}

function color (s, n) {
  return "\u001B[0;" + n + "m" + s + "\u001B[m"
}

function red (s) {
  return color(s, 31);
}

function green (s) {
  return color(s, 32);
}

function yellow (s) {
  return color(s, 33);
}

// Initialize the accelerometer.
accel.on('ready', function () {
  // Stream accelerometer data
  accel.on('data', function (xyz) {
    var avgs = [];
    for (var i = 0; i < 5; i++) {
      avgs.push(xyz);
    }

    var x = avg(avgs, 0), y = avg(avgs, 1), z = avg(avgs, 2);
    console.log("x:", red(pad(x)), "  y:", green(pad(y)), "  z:", yellow(pad(z)));
  });
});