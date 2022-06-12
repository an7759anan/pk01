const { init } = require('raspi');
const { Serial } = require('raspi-serial').Serial;

let serial;

const dsp_init = () => {
    serial = new Serial();
    serial.open(() => {
        serial.on('data', data => {
            process.stdout.write(data);
        });
        serial.write('Hello!');
    });
}

const dsp_load_image = () => {

}

module.exports = {
    "dsp_init": dsp_init,
    "dsp_load_image": dsp_load_image
}
