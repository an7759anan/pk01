const { SerialPort } = require('serialport');
const fs = require('fs');

let serialport;

const dsp_init = () => {
    return new Promise((resolve, reject) => {
        serialport = new SerialPort({ path: '/dev/ttyAMA0', baudRate: 115200, dataBits: 8, stopBits: 1, parity: 'none' });
        //        serialport.write('Hello!');
        const rs = fs.createReadStream("./dsp.img");
        // const rs = fs.createReadStream("./Morning-Pictures.jpg");
        // const ws = fs.createWriteStream("./Morning-Pictures1.jpg");
        rs.on('error', (error) => {
            resolve(`error: ${error.message}`);
        });
        rs.on('data', (chunk) => {
            console.log(`chunk: ${chunk.length}`);
            serialport.write(chunk);
        });
        // rs.on('data', (chunk) => {
        //     ws.write(chunk);
        // });
        rs.on('end', () => {
            // ws.close();
            resolve('ok!!!');
        });
    });
}

module.exports = {
    "dsp_init": dsp_init,

}
