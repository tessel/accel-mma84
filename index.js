var util = require('util');
var EventEmitter = require('events').EventEmitter;


/**
 * Configuration
 */

// The SparkFun breakout board defaults to 1, set to 0 if SA0 jumper on the bottom of the board is set
var I2C_ADDRESS = 0x1D  // 0x1D if SA0 is high, 0x1C if low

// Sets full-scale range to +/-2, 4, or 8g. Used to calc real g values.
var GSCALE = 2

// See the many application notes for more info on setting all of these registers:
// http://www.freescale.com/webapp/sps/site/prod_summary.jsp?code=MMA8452Q
// MMA8452 registers
var OUT_X_MSB = 0x01;
var XYZ_DATA_CFG = 0x0E;
var WHO_AM_I = 0x0D;
var CTRL_REG1 = 0x2A;
var CTRL_REG4 = 0x2D;


/**
 * MMA
 */


function Accelerometer (hardware)
{
  var self = this;

  self.hardware = hardware;
  self.numListeners = 0;
  self.listening = false;
  self.outputRate = 12.5;
  self.dataInterrupt = self.hardware.gpio(2);

  self.i2c = hardware.I2C(I2C_ADDRESS);

  self._readRegister(WHO_AM_I, function (err, c) {
    if (c != 0x2A) { // WHO_AM_I should always return 0x2A
      self.emit('error', new Error("Could not connect to MMA8452Q, received" + c.toString()))
    } 
    // Must be in standby to change registers
    self.modeStandby(function () {
      // Set up the full scale range to 2, 4, or 8g.
      var fsr = GSCALE;
      if (fsr > 8) fsr = 8; //Easy error check
      fsr >>= 2; // Neat trick, see page 22. 00 = 2G, 01 = 4A, 10 = 8G
      self._writeRegister(XYZ_DATA_CFG, fsr, function () {
        self.setOutputRate(self.outputRate, function(err) {
          self.emit('ready');
        });
      });
    });

    self.dataInterrupt.watch('fall', self.dataReady);
  });
}

util.inherits(Accelerometer, EventEmitter)

Accelerometer.prototype._readRegisters = function (addressToRead, bytesToRead, next)
{
  this.i2c.transfer(new Buffer([addressToRead]), bytesToRead, next);
}

Accelerometer.prototype._readRegister = function (addressToRead, next)
{
  this._readRegisters(addressToRead, 1, function (err, regs) {
    next(err, regs && regs[0]);
  });
}

// Write a single byte to the register.
Accelerometer.prototype._writeRegister = function (addressToWrite, dataToWrite, next)
{
  this.i2c.send(new Buffer([addressToWrite, dataToWrite]), next);
}

Accelerometer.prototype.setListening = function () {
  var self = this;
  self.listening = true;
  // Loop until nothing is listening
  self.listeningLoop = setInterval (function () {
    if (self.numListeners) {
      self.getAcceleration(function (err, xyz) {
        if (err) throw err;
        self.emit('data', xyz);
      });
    } else {
      clearInterval(listeningLoop);
    }
  }, self.pollFrequency);
}

// Sets the MMA8452 to standby mode. It must be in standby to change most register settings
Accelerometer.prototype.modeStandby = function (next)
{
  var self = this;
  // Clear the active bit to go into standby
  self._readRegister(CTRL_REG1, function (err, c) {
    self._writeRegister(CTRL_REG1, c & ~(0x01), next);
  })
}

// Sets the MMA8452 to active mode. Needs to be in this mode to output data
Accelerometer.prototype.modeActive = function (next)
{
  var self = this;
  // Set the active bit to begin detection
  self._readRegister(CTRL_REG1, function (err, c) {
    self._writeRegister(CTRL_REG1, c | (0x01), next);
  });
}

Accelerometer.prototype.getAcceleration = function (next)
{
  var self = this;
  self._readRegisters(OUT_X_MSB, 6, function (err, rawData) {
    if (err) throw err;
    // Loop to calculate 12-bit ADC and g value for each axis
    var out = [];
    for (var i = 0; i < 3 ; i++) {
      var gCount = (rawData[i*2] << 8) | rawData[(i*2)+1];  //Combine the two 8 bit registers into one 12-bit number

      gCount = (gCount >> 4); //The registers are left align, here we right align the 12-bit integer

      // If the number is negative, we have to make it so manually (no 12-bit data type)
      if (rawData[i*2] > 0x7F) {
        gCount = -(1 + 0xFFF - gCount); // Transform into negative 2's complement
      }

      out[i] = gCount / ((1<<12)/(2*GSCALE));
    }

    next(null, out);
  });
}

// Sets the polling frequency for streamed data (default 100ms)
Accelerometer.prototype.setPollFrequency = function (milliseconds) {
  var self = this;
  self.pollFrequency = milliseconds;
  if (self.listening) {
    clearInterval(self.listeningLoop);
    self.setListening();
  }
}

Accelerometer.prototype.availableOutputRates = function() {
  return [800, 400, 200, 100, 50, 12.5, 6.25, 1.56];
}

Accelerometer.prototype._getClosestOutputRate = function(requestedRate, callback) {
  var available = this.availableOutputRates();
  console.log('vail', available);
  for (var i = 0; i < available.length; i++) {
    console.log('a', available[i], 'b', requestedRate);
    if (available[i] <= requestedRate) {
      if (callback) callback(null, available[i]);
      return;
    }
  }
  console.log('no good');
  if (callback) callback(new Error("Invalid requested rate."));
}

// Sets the polling frequency for streamed data (default 100ms)
Accelerometer.prototype.setOutputRate = function (hz, callback) {
  var self = this;

  // Put accel into standby
  self.modeStandby(function inStandby() {
    // Find the closest available rate (rounded down)
    self._getClosestOutputRate(hz, function gotRequested(err, closest) {
      if (err) {
        if (callback) callback(new Error("Rate must be >= 1.56Hz"));
        return;
      }
      console.log('closest should be 1.56. is', closest);
      // Set our property
      self.outputRate = closest;
      // Get the binary representation of the rate (for the register)
      var bin = self.availableOutputRates().indexOf(closest);
      console.log('index of closest should be 7. is', bin);
      // Read the current register value
      self._readRegister(CTRL_REG1, function readComplete(err, regVal) {
        console.log('control should be 0. is', regVal);
        // Clear the three bits of output rate control (0b11000111 = 199)
        regVal &= 199;
        // Move the binary rep into place (bits 3:5)
        regVal |= (bin << 3);
        console.log('new val is', regVal);
        // Write that value into the control register
        self._writeRegister(CTRL_REG1, regVal,  function writeComplete() {
          self._readRegister(CTRL_REG1, function(err, val) {
            console.log('reading value afterward', val);
             // Enable data interrupts
            self._writeRegister(CTRL_REG4, 1, function() {
              self._readRegister(CTRL_REG4, function(err, cntrl_val) {
                console.log('control val afterward', cntrl_val);
                // Put back into active mode
                self.modeActive(function activated() {
                  // Call callback
                  if (callback) callback();
                  return;
                });
              });
            });
          });
        });
      });
    });
  });
};

Accelerometer.prototype.setScale = function(scale, callback) {
  var self = this;

  var fsr = scale;
  if (fsr > 8) fsr = 8; //Easy error check
  fsr >>= 2; // Neat trick, see page 22. 00 = 2G, 01 = 4A, 10 = 8G

  // Set the scale
  self.modeStandby(function() {
    self._writeRegister(XYZ_DATA_CFG, fsr, function () {
      self.scale = scale;
      self.modeActive(function activated() {
        if (callback) callback();
      });
    });
  });
}

Accelerometer.prototype.dataReady = function() {
  var self = this;

  // Data is ready so grab the data
  self.getAcceleration(function(err, xyz) {
    // If we had an error, emit it
    if (err) {
      // Emitting error
      setImmediate(function errRead() {
        self.emit('error', err);
      });
    }
    // If there was no error
    else {
      // Emit the data
      setImmediate(function success() {
        self.emit('data', xyz);
      });
    }
  });
}

exports.Accelerometer = Accelerometer;
exports.use = function (hardware) {
  return new Accelerometer(hardware);
};