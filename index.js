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
var OUT_X_MSB = 0x01
var XYZ_DATA_CFG = 0x0E
var WHO_AM_I = 0x0D
var CTRL_REG1 = 0x2A


/**
 * MMA
 */


function Accelerometer (hardware)
{
  var self = this;

  this.hardware = hardware;

  self.i2c = new hardware.I2C(I2C_ADDRESS);
  self.i2c.initialize();

  self._readRegister(WHO_AM_I, function (err, c) {
    if (c == 0x2A) { // WHO_AM_I should always return 0x2A
      console.log("MMA8452Q is online...");
    } else {
      console.log("Could not connect to MMA8452Q, received", c);
      while (1) { continue; } // Loop forever if communication doesn't happen
    }

    // Must be in standby to change registers
    self.modeStandby(function () {
      // Set up the full scale range to 2, 4, or 8g.
      var fsr = GSCALE;
      if (fsr > 8) fsr = 8; //Easy error check
      fsr >>= 2; // Neat trick, see page 22. 00 = 2G, 01 = 4A, 10 = 8G
      self._writeRegister(XYZ_DATA_CFG, fsr, function () {
        // The default data rate is 800Hz and we don't modify it in this example code
        self.modeActive(function () {
          self.emit('connected');
        });  // Set to active to start reading
      });
    });
  })
}

util.inherits(Accelerometer, EventEmitter)

Accelerometer.prototype._readRegisters = function (addressToRead, bytesToRead, next)
{
  this.i2c.transfer([addressToRead], bytesToRead, next);
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
  this.i2c.send([addressToWrite, dataToWrite], next);
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

exports.Accelerometer = Accelerometer;
exports.connect = function (hardware) {
  return new Accelerometer(hardware);
};