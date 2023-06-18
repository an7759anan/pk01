const { ipcMain } = require('electron');
const slip = require('slip');
const { EventEmitter } = require('events');

class DspEmitterClass extends EventEmitter { };
const dspEmitter = new DspEmitterClass();

let vDsp;
let vDm;
let vCmd = null;
let vStep = 0;

// vCmd["p2"] = vDm.settings["gen-tran-val"].val;   уровень выходного сигнала {min: -55, max: 3}, step: 1
// vCmd["p3.1"] = vDm.settings["gen-freq-val"].val; частота генератора
// vCmd["p6"] = vDm.settings["mes-voice1-val"].val; тип входа
// vCmd["p11"] = 5;                                шаг именения уровня

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

const sendStartCommand = (pScriptIdx) => {
  let mode_measurement_value = vDm.mode_measurement_values_table[pScriptIdx];
  vDm.clearData(mode_measurement_value);
  let p30 = pScriptIdx + 1;
  vCmd = { "kf": 0x41, "p30": p30 };
  switch (p30) {
    case 1: // (1) Измерение сигнала ТЧ вручную
      vCmd["p2"] = vDm.settings["gen-tran-val"].val;
      vCmd["p3.1"] = vDm.settings["gen-freq-val"].val;
      vCmd["p6"] = vDm.settings["mes-voice1-val"].val;
      vCmd["p7"] = vDm.settings["mes-voice2-val"].val;
      break;
    case 2: // (2) Измерение отношения Сигнал/Шум
      // vCmd["p2"] = vDm.settings["gen-tran-val"].val;
      vCmd["p2"] = -55;
      vCmd["p3.1"] = vDm.settings["gen-freq-val"].val;
      vCmd["p6"] = vDm.settings["mes-voice1-val"].val;
      vCmd["p11"] = 5;
      vStep = 0;
        break;
    case 3: // (3) Измерение шума свободного канала
      // vCmd["p2"] = vDm.settings["gen-tran-val"].val;
      // vCmd["p3.1"] = vDm.settings["gen-freq-val"].val;
      // vCmd["p6"] = vDm.settings["mes-voice1-val"].val;
      // vCmd["p11"] = 5;
      break;
    case 4: // (4) Измерение частотной характеристики
      vCmd["p2"] = vDm.settings["gen-tran-val"].val;
      vCmd["p3.1"] = vDm.settings["gen-freq-val"].val;
      vCmd["p3.2"] = 3600;
      vCmd["p12"] = 100;
      break;
    case 5: // (5) Измерение амплитудной характеристики
      vCmd["p2"] = vDm.settings["gen-tran-val"].val;
      vCmd["p11"] = 5;
      break;
    default:
      break;
  }
  vCmd["TEST"] = 1;
  vCmd["PSOF"] = vDm.settings["mes-psf-val"].val;
  vCmd["DB10"] = 0;
  vDsp.sendCommand({ ...vCmd });
  return { ...vCmd };
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
  "sendStartCommand": sendStartCommand
}

