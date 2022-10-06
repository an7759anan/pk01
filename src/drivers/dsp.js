const sp_params  = require('../config').serialport_dsp;
const { SerialPort } = require('serialport');
const fs = require('fs');
const crc16 = require('crc/crc16ccitt');
const slip = require('slip');
const { EventEmitter } = require('events');

const KF = { // Коды функций
    "M1": 0x41, // Установить параметры
    "S1": 0x42, // Начать измерение
    "S2": 0x43, // Остановить измерение
}

let serialport;
class DspEmitterClass extends EventEmitter {};
const dspEmitter = new DspEmitterClass();

const dsp_init = () => {
    return new Promise((resolve, reject) => {
        serialport = new SerialPort(sp_params);
        const rs = fs.createReadStream("./dsp.img", { highWaterMark: 16});
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

        serialport.on('data', (chunk) => {
            console.log(chunk);
        });

    });
}

const sendCommand = (cmd) => {
    if (serialport && serialport.isOpen){
        let outbuff = new ArrayBuffer(100);
        let viewbuf = new DataView(outbuff);
        let kf = cmd["kf"];
        let idx = 0;
        viewbuf.setUint8(idx++,kf);
        switch (kf){
            case KF.M1: // Установить параметры
                let p30 = cmd["p30"];
                viewbuf.setUint8(idx++,cmd["p30"]);
                switch (p30){
                    case 1:
                        viewbuf.setInt8(idx++,cmd["p2"]); 
                        viewbuf.setUint16(idx++,cmd["p3.1"]); idx++;
                        viewbuf.setUint16(idx++,0); idx++;
                        viewbuf.setUint8(idx++,cmd["p6"]);
                        viewbuf.setUint8(idx++,cmd["p7"]);
                        viewbuf.setUint8(idx++,0);
                        viewbuf.setUint8(idx++,0);
                        break;
                    case 2:
                        viewbuf.setInt8(idx++,0); 
                        viewbuf.setUint16(idx++,cmd["p3.1"]); idx++;
                        viewbuf.setUint16(idx++,0); idx++;
                        viewbuf.setUint8(idx++,0);
                        viewbuf.setUint8(idx++,0);
                        viewbuf.setUint8(idx++,cmd["p11"]);
                        viewbuf.setUint8(idx++,0);
                        break;
                    case 4:
                        viewbuf.setInt8(idx++,cmd["p2"]);
                        viewbuf.setUint16(idx++,cmd["p3.1"]); idx++;
                        viewbuf.setUint16(idx++,cmd["p3.2"]); idx++;
                        viewbuf.setUint8(idx++,0);
                        viewbuf.setUint8(idx++,0);
                        viewbuf.setUint8(idx++,0);
                        viewbuf.setUint8(idx++,cmd["p12"]);
                        break;
                    case 5:
                        viewbuf.setInt8(idx++,cmd["p2"]);
                        viewbuf.setUint16(idx++,0); idx++;
                        viewbuf.setUint16(idx++,0); idx++;
                        viewbuf.setUint8(idx++,0);
                        viewbuf.setUint8(idx++,0);
                        viewbuf.setUint8(idx++,cmd["p11"]);
                        viewbuf.setUint8(idx++,0);
                        break;
                    default:
                        viewbuf.setInt8(idx++,0);
                        viewbuf.setUint16(idx++,0); idx++;
                        viewbuf.setUint16(idx++,0); idx++;
                        viewbuf.setUint8(idx++,0);
                        viewbuf.setUint8(idx++,0);
                        viewbuf.setUint8(idx++,0);
                        viewbuf.setUint8(idx++,0);
                        break;
            }
                viewbuf.setUint8(idx++,cmd["TEST"]);
                viewbuf.setUint8(idx++,cmd["PSOF"]);
                viewbuf.setUint8(idx++,cmd["DB10"]);
                break;
        }
        let crc = crc16(new Uint8Array(outbuff, 0, idx));
        viewbuf.setUint16(idx++, crc); idx++;
        let slipEncoded = slip.encode(new Uint8Array(outbuff, 0, idx));
        return { success: serialport.write(slipEncoded, 'binary'), content:  Buffer.from(slipEncoded).toString('hex')};
    } else {

    }
    return { success: false };
}

const setPort = (sPort) => {
    serialport = sPort;
    serialport.on('data', (chunk) => {
//        console.log(chunk);
        dspEmitter.emit('dsp-response', { dataFromSerialPort: chunk, });
    });
}

module.exports = {
    "dsp_init": dsp_init,
    "KF": KF,
    "sendCommand": sendCommand,
    "setPort": setPort,
    "dspEmitter": dspEmitter,
}
