import { SerialPort } from 'serialport';

//view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {screen: 'MODE_DIALOG', show: true, value: mode_measurement_values_table[mode_measurement_index]});

const dsp_port_list = () => {
  SerialPort.list().then(function (ports) {
    ports.forEach(function (port) {
      console.log("Port: ", port);
    })
  });
}

export const init = () => {

}

export const startCommand = () => {

}

export const stopCommand = () => {

}

export const getState = () => {
  return StaticRange;
}


