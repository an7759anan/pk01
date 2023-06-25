module.exports = {
    webserver: {
        host: '192.168.0.8',
        listen_port: 8080
    },
    serialport_dsp: {
        path: '/dev/ttyS0', 
        baudRate: 115200, 
        dataBits: 8, 
        stopBits: 1, 
        parity: 'none',
        flowControl: false
    }
}