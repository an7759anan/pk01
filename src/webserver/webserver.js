const express = require('express');
const os = require('os');
const fs = require('fs');
const bodyParser = require('body-parser');
const config = require('../config');

const app = express();
app.use(bodyParser.json());
const port = config.webserver.listen_port;
const interfaces = os.networkInterfaces();

function getIPAddress(){
    let addresses = [];
    for (let k in interfaces){
        for (let k2 in interfaces[k]){
            let address = interfaces[k][k2];
            if (address.family === 'IPv4' && address.address !== '127.0.0.1' && !address.internal){
                addresses.push(address.address);
            }
        }
    }
    console.log(addresses);
    return addresses.length? addresses[0] : '127.0.0.1';
}

module.exports = {
    init: () => {
        app.use(express.static(`${__dirname}/static`));
        app
        .route('/rest/dsp/soft')
        .get((req, res) => {
            return  res
                .status(200)
                .send({})
        })
        .put((req, res) => {
            let content = req.body.content;
            fs.writeFile('dsp.bin', content, (err, response) => {
                if (err)
                    return res
                        .status(500)
                        .send({message: "write file fail"})
                return res
                    .status(200)
                    .send({message: "file wrote"})
            })
        });
        let host = getIPAddress();
        app.listen(port, host, () => {
            console.log(`Server listens http://${host}:${port}`);
        })
    }
}