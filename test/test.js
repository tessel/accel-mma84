/* script */

var test = require('tinytap');
var tessel = require('tessel');
var accel = require('../').use(tessel.port[process.argv[2] || 'A']);

test.count(5);

test('sample count', function (t) {
  accel.once('sample', function (xyz) {
    t.ok(Array.isArray(xyz), 'accelerometer data is array');
    t.ok(xyz.length == 3, 'three samples');
    t.ok(typeof xyz[0] == 'number', 'idx 0 is number');
    t.ok(typeof xyz[1] == 'number', 'idx 1 is number');
    t.ok(typeof xyz[2] == 'number', 'idx 2 is number');
    t.end();
  });
});
