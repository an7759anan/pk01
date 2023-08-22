const { ipcMain } = require('electron');
const slip = require('slip');
const { EventEmitter } = require('events');

class DspEmitterClass extends EventEmitter { };
const dspEmitter = new DspEmitterClass();

let vDsp;
let vDm;
let vCmd = null;
let vStep = 0;
let vNominalValue = null;
const cGenTranValStep = 5;  // Шаг величины выходного сигнала генератора
const cGenTranVal = -55;    // Начальная величина выходного сигнала генератора для измерения Амплитудной характеристики
const cValDelta = 0.2;      // Отклонение входного сигнала для определения выходного сигнала генератора

// vCmd["p2"] = vDm.settings["gen-tran-val"].val;   уровень выходного сигнала {min: -55, max: 3}, step: 1
// vCmd["p3.1"] = vDm.settings["gen-freq-val"].val; частота генератора
// vCmd["p6"] = vDm.settings["mes-voice1-val"].val; тип входа
// vCmd["p11"] = 5;                                шаг именения уровня

const controller_dsp_init = (pDsp, pDm) => {
  vDsp = pDsp;
  vDm = pDm;
  vDsp.dspEmitter.on('dsp-response', args => {
    if (vCmd) performResponse(args);
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
      vCmd["p2"] = vDm.settings["gen-tran-val"].val + vDm.settings["gen-zero-val"].val;
      vCmd["p3.1"] = vDm.settings["gen-freq-val"].val;
      vCmd["p6"] = vDm.settings["mes-voice1-val"].val;
      vCmd["p7"] = vDm.settings["mes-voice2-val"].val;
      vCmd["PSOF"] = vDm.settings["mes-psf-val"].val;
      break;
    case 2: // (2) Измерение отношения Сигнал/Шум
      // vCmd["p2"] = vDm.settings["gen-tran-val"].val;
      vCmd["p2"] = vDm.settings["gen-tran-val"].range.min + vDm.settings["gen-zero-val"].val;
      vCmd["p3.1"] = vDm.settings["gen-freq-val"].val;
      vCmd["p6"] = vDm.settings["mes-voice1-val"].val;
      vCmd["p11"] = vDm.settings["gen-tran-val"].step;
      vCmd["PSOF"] = vDm.settings["mes-psf-val"].val;
      vStep = 0;
      break;
    case 3: // (3) Измерение шума свободного канала
      // vCmd["p2"] = vDm.settings["gen-tran-val"].val;
      // vCmd["p3.1"] = vDm.settings["gen-freq-val"].val;
      // vCmd["p6"] = vDm.settings["mes-voice1-val"].val;
      // vCmd["p11"] = cGenTranValStep;
      vCmd["PSOF"] = 1;
      break;
    case 4: // (4) Измерение частотной характеристики
      vCmd["p2"] = vDm.settings["gen-tran-val"].val + vDm.settings["gen-zero-val"].val;
      vCmd["p3.1"] = vDm.settings["gen-freq-val"].val;
      vCmd["p3.2"] = 3600;
      vCmd["p12"] = 100;
      vCmd["PSOF"] = vDm.settings["mes-psf-val"].val;
      vNominalValue = null;
      break;
    case 5: // (5) Измерение амплитудной характеристики
      // vCmd["p2"] = vDm.settings["gen-tran-val"].val + vDm.settings["gen-zero-val"].val;
      vCmd["p2"] = cGenTranVal;
      vCmd["p11"] = cGenTranValStep;
      vCmd["PSOF"] = vDm.settings["mes-psf-val"].val;
      break;
    default:
      break;
  }
  vCmd["TEST"] = 0;
  vCmd["DB10"] = 0;
  vDsp.sendCommand({ ...vCmd });
  return { ...vCmd };
}

const sendStopCommand = () => {
  vDsp.sendStopCommand();
  vCmd = null;
  vNominalValue = null;
}
/** Первичная обработка ответа DSP, компенсация переходных процессов...
 * 
 * @param {*} args 
 */
const performResponse = (args) => {
  switch (vCmd?.p30) {
    case 1: // (1) Измерение сигнала ТЧ вручную
      dspEmitter.emit('controller-dsp-response', args);
      break;
    case 2: // (2) Измерение отношения Сигнал/Шум
      if (++vStep > 5) {
        vStep = 0;
        args.dataFromDsp["p2"] = vCmd["p2"];
        dspEmitter.emit('controller-dsp-response', args);
        // vCmd["p2"] += vDm.settings["gen-tran-val"].step;
        vCmd["p2"] += cGenTranValStep;
        if (vCmd["p2"] <= vDm.settings["gen-tran-val"].range.max) {
          vDsp.sendCommand(vCmd);
        } else {
          vCmd = null;
        }
      }
      break;
    case 3: // (3) Измерение шума свободного канала
      dspEmitter.emit('controller-dsp-response', args);
      break;
    case 4: // (4) Измерение частотной характеристики
      // if (vNominalValue == null && args.dataFromDsp["p3.1"] === 1020){
      //   vNominalValue = args.dataFromDsp["p4"];
      //   args.dataFromDsp["p4"]
      // } else {
      //   args.dataFromDsp["p4"] - vNominalValue;
      // }
      dspEmitter.emit('controller-dsp-response', args);
      break;
    case 5: // (5) Измерение амплитудной характеристики
      let _val1 = args.dataFromDsp["p4"]/10;
      args.dataFromDsp["pp4"] = _val1;
      for (let _val0 = cGenTranVal; _val0 < 3; _val0 += cGenTranValStep){
        if (_val0 - cValDelta < _val1 && _val1 < _val0 + cValDelta){
          args.dataFromDsp["pp2"] = _val0;
          break;
        }
      }
      // if (args.dataFromDsp["pp2"] != undefined){
        dspEmitter.emit('controller-dsp-response', args);
      // }
      break;
    default:
      break;
  }
}

module.exports = {
  "controller_dsp_init": controller_dsp_init,
  "sendCommand": sendCommand,
  "dspEmitter": dspEmitter,
  "sendStopCommand": sendStopCommand,
  "sendStartCommand": sendStartCommand
}

