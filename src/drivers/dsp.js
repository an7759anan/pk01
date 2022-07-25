const sp_params  = require('../config').serialport_dsp;
const { SerialPort } = require('serialport');
const fs = require('fs');

let serialport;

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

module.exports = {
    "dsp_init": dsp_init,

}
