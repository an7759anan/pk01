const { ipcMain } = require('electron');
let { settings, dataModels } = require('../model/data_model');
const slip = require('slip');
const { serialPort } = require('serialport');

//view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {screen: 'MODE_DIALOG', show: true, value: mode_measurement_values_table[mode_measurement_index]});

const dsp_port_list = () => {
  serialPort.list().then(function (ports) {
    ports.forEach(function (port) {
      console.log("Port: ", port);
    })
  });
}

const init = () => {

}

const startCommand = () => {

}

const stopCommand = () => {

}

const getState = () => {
  return StaticRange;
}

module.exports = {
  "init": init,
  "startCommand": startCommand,
  "stopCommand": stopCommand,
  "getState": this.getState
}

