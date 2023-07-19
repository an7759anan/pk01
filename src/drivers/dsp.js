const sp_params = require('../config').serialport_dsp;
const { SerialPort } = require('serialport');
const { SlipDecoder } = require('@serialport/parser-slip-encoder');
const fs = require('fs');
const crc16 = require('crc/crc16ccitt');
const slip = require('slip');
const { EventEmitter } = require('events');
var dm;
var loadMode = true;

const KF = { // Коды функций
    "M1": 0x41, // Установить параметры
    "S1": 0x42, // Начать измерение
    "S2": 0x43, // Остановить измерение
}

let serialport;
class DspEmitterClass extends EventEmitter { };
const dspEmitter = new DspEmitterClass();

const dsp_init_test = (dataModel) => {
    dm = dataModel;
}

const dsp_init = (dataModel) => {
    console.log('dsp_init');
    dm = dataModel;
    return new Promise((resolve, reject) => {
        serialport = new SerialPort(sp_params);
        // const parser = serialport.pipe(new SlipDecoder());
        const rs = fs.createReadStream("./takt.bin", { highWaterMark: 16 });
        rs.on('error', (error) => {
            resolve(`error: ${error.message}`);
        });
        rs.on('data', (chunk) => {
            console.log(`chunk: ${chunk.length}`);
            serialport.write(chunk);
        });
        rs.on('end', () => {
            // ws.close();
            resolve('ok!!!');
        });

        serialport.on('data', (msg) => {
        // parser.on('data', (msg) => {
                // serialport.resume();
            console.log('from serial port2', msg);
            if (!loadMode) {
                slipDecoder.decode(msg);
                // console.log('from slipDecoder2');
                // dspEmitter.emit('dsp-response', { dataFromSerialPort: msg, dataFromDsp: processResponce(msg) });
        
            };
        });
        serialport.on('error', (err) => {
            console.log('serialport error', err);
        });
        serialport.on('close', (err) => {
            console.log('serialport close', err);
        });

    });
}

const prepareSlip = (cmd) => {
    let outbuff = new ArrayBuffer(100);
    let viewbuf = new DataView(outbuff);
    let kf = cmd["kf"];
    let idx = 0;
    viewbuf.setUint8(idx++, kf);
    switch (kf) {
        case KF.M1: // Установить параметры
            let p30 = cmd["p30"];
            viewbuf.setUint8(idx++, cmd["p30"]);
            switch (p30) {
                case 0:
                    viewbuf.setInt8(idx++, 0);
                    viewbuf.setUint16(idx++, 0); idx++;
                    viewbuf.setUint16(idx++, 0); idx++;
                    viewbuf.setUint8(idx++, 0);
                    viewbuf.setUint8(idx++, 0);
                    viewbuf.setUint8(idx++, 0);
                    viewbuf.setUint8(idx++, 0);
                case 1:
                    viewbuf.setInt8(idx++, cmd["p2"]);
                    viewbuf.setUint16(idx++, cmd["p3.1"]); idx++;
                    viewbuf.setUint16(idx++, 0); idx++;
                    viewbuf.setUint8(idx++, cmd["p6"]);
                    viewbuf.setUint8(idx++, cmd["p7"]);
                    viewbuf.setUint8(idx++, 0);
                    viewbuf.setUint8(idx++, 0);
                    break;
                case 2:
                    viewbuf.setInt8(idx++, cmd["p2"]);
                    viewbuf.setUint16(idx++, cmd["p3.1"]); idx++;
                    viewbuf.setUint16(idx++, 0); idx++;
                    viewbuf.setUint8(idx++, cmd["p6"]);
                    viewbuf.setUint8(idx++, 0);
                    viewbuf.setUint8(idx++, cmd["p11"]);
                    viewbuf.setUint8(idx++, 0);
                    break;
                case 4:
                    viewbuf.setInt8(idx++, cmd["p2"]);
                    viewbuf.setUint16(idx++, cmd["p3.1"]); idx++;
                    viewbuf.setUint16(idx++, cmd["p3.2"]); idx++;
                    viewbuf.setUint8(idx++, 0);
                    viewbuf.setUint8(idx++, 0);
                    viewbuf.setUint8(idx++, 0);
                    viewbuf.setUint8(idx++, cmd["p12"]);
                    break;
                case 5:
                    viewbuf.setInt8(idx++, cmd["p2"]);
                    viewbuf.setUint16(idx++, 0); idx++;
                    viewbuf.setUint16(idx++, 0); idx++;
                    viewbuf.setUint8(idx++, 0);
                    viewbuf.setUint8(idx++, 0);
                    viewbuf.setUint8(idx++, cmd["p11"]);
                    viewbuf.setUint8(idx++, 0);
                    break;
                default:
                    viewbuf.setInt8(idx++, 0);
                    viewbuf.setUint16(idx++, 0); idx++;
                    viewbuf.setUint16(idx++, 0); idx++;
                    viewbuf.setUint8(idx++, 0);
                    viewbuf.setUint8(idx++, 0);
                    viewbuf.setUint8(idx++, 0);
                    viewbuf.setUint8(idx++, 0);
                    break;
            }
            viewbuf.setUint8(idx++, cmd["TEST"]);
            viewbuf.setUint8(idx++, cmd["PSOF"]);
            viewbuf.setUint8(idx++, cmd["DB10"]);
            break;
    }
    let crc = crc16(new Uint8Array(outbuff, 0, idx));
    viewbuf.setUint16(idx++, crc); idx++;
    return slip.encode(new Uint8Array(outbuff, 0, idx));
}

const sendCommand = (cmd) => {
    if (serialport && serialport.isOpen) {
        loadMode = false;
        let slipEncoded = prepareSlip(cmd);
        return { success: serialport.write(slipEncoded, 'binary'), content: Buffer.from(slipEncoded).toString('hex') };
    } else {

    }
    return { success: false };
    /**
     * ниже код - только для внутренней отладки
     */
    // let slipEncoded = prepareSlip(cmd);
    // slipDecoder.decode(slipEncoded);
    // return { success: 'success', content:  Buffer.from(slipEncoded).toString('hex')};
}

const sendStopCommand = () => {
    sendCommand({ "kf": 0x41, "p30": 0 });
}

const setPort = (sPort) => {
    serialport = sPort;
    serialport.on('data', (chunk) => {
        console.log('from serial port1', chunk);
        /**
         * - обработать SLIP и CRC - это должен сделать драйвер dsp
         * - эхо на команду - пока распознать и погасить в драйвере dsp
         * - данные измерения - их и отдать по событию в контроллер
         */
        if (!loadMode) {
            slipDecoder.decode(chunk);
        }
        // dspEmitter.emit('dsp-response', { dataFromSerialPort: chunk, });
    });
}

let slipDecoder = new slip.Decoder({
    onMessage: (msg) => {
        /**
         * - проверить CRC
         * - разобрать по параметрам
         * - отдать контроллеру
         */
        console.log('from slipDecoder');
        dspEmitter.emit('dsp-response', { dataFromSerialPort: msg, dataFromDsp: processResponce(msg) });
    }
});

const prepareRequest = (cmd) => {

}

const processResponce = (msg) => {
    let res = {};
    let viewbuf = new DataView(msg.buffer);
    let idx = 0;
    res["kf"] = viewbuf.getUint8(idx++);
    res["p30"] = viewbuf.getUint8(idx++);
    if (res["kf"] === 0x41) {
        res["p2"] = viewbuf.getInt8(idx++);
        res["p3.1"] = viewbuf.getUint16(idx++); idx++;
        res["p3.2"] = viewbuf.getUint16(idx++); idx++;
        res["p6"] = viewbuf.getUint8(idx++);
        res["p7"] = viewbuf.getUint8(idx++);
        res["p11"] = viewbuf.getUint8(idx++);
        res["p12"] = viewbuf.getUint8(idx++);
        res["TEST"] = viewbuf.getUint8(idx++);
        res["PSOF"] = viewbuf.getUint8(idx++);
        res["DB10"] = viewbuf.getUint8(idx++);
    } else if (res["kf"] === 0x42) {
        if ([1, 4, 5].includes(res["p30"])) {
            res["p4"] = viewbuf.getInt16(idx++); idx++;
            res["p3.1"] = viewbuf.getUint16(idx++); idx++;
        } else if ([2, 3].includes(res["p30"])) {
            res["p8"] = viewbuf.getUint16(idx++); idx++;
            res["p9"] = viewbuf.getUint16(idx++); idx++;
        }
    }
    return res;
}

const loadDspSoft = () => {

}

const dsp_stop = () => {
    if (serialport && serialport.isOpen){
        serialport.close();
    }
}

module.exports = {
    "dsp_init": dsp_init,
    "dsp_init_test": dsp_init_test,
    "KF": KF,
    "sendCommand": sendCommand,
    "setPort": setPort,
    "dspEmitter": dspEmitter,
    "sendStopCommand": sendStopCommand,
    "dsp_stop": dsp_stop
}
