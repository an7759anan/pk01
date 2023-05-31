const { ipcMain } = require('electron');
const slip = require('slip');
const { EventEmitter } = require('events');

class DspEmitterClass extends EventEmitter { };
const dspEmitter = new DspEmitterClass();

let vDsp;
let vDm;
let vCmd = null;
let vStep = 0;

// cmd["p2"] = dm.settings["gen-tran-val"].val;   уровень выходного сигнала {min: -55, max: 3}, step: 1
// cmd["p3.1"] = dm.settings["gen-freq-val"].val; частота генератора
// cmd["p6"] = dm.settings["mes-voice1-val"].val; тип входа
// cmd["p11"] = 5;                                шаг именения уровня

const controller_dsp_init = (pDsp, pDm) => {
  vDsp = pDsp;
  vDm = pDm;
  vDsp.dspEmitter.on('dsp-response', args => {
    if (vCmd) {
      if (vCmd?.p30 == 2) {
        if (++vStep > 5) {
          vStep = 0;
          args.dataFromDsp["p2"] = vCmd["p2"];
          dspEmitter.emit('controller-dsp-response', args);
          vCmd["p2"] += 5;
          if (vCmd["p2"] < 3) {
            vDsp.sendCommand(vCmd);
          } else {
            vCmd = null;
          }
        }
      } else {
        dspEmitter.emit('controller-dsp-response', args);
      }
    }
  });

}

const sendCommand = (pCmd) => {
  vCmd = pCmd;
  if (vCmd?.p30 == 2) {
    vCmd["p2"] = -55;
    vStep = 0;
  }
  return vDsp.sendCommand(vCmd);
}

const sendStopCommand = () => {
  vDsp.sendStopCommand();
  vCmd = null;
}

module.exports = {
  "controller_dsp_init": controller_dsp_init,
  "sendCommand": sendCommand,
  "dspEmitter": dspEmitter,
  "sendStopCommand": sendStopCommand,
}

