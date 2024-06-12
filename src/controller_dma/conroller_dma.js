
const { exec } = require('child_process');

const readSamples = (fileName) => {
    return new Promise((resolve, reject) => {
        exec(`echo pk01 | sudo -S ./pk01_dma -N 16383 -R 32000 -F ${fileName}`, (err, stdout, stderr) => {
            if (err) {
                // node couldn't execute the command
                console.log(`err: ${err}`);
                reject();
                return;
            }
            const result = stdout.split('\n').map(s => { 
                const a = s.split(' ');
                return {
                    status: a[3],
                    cycle: +a[2],
                    value: +a[5]
                }
            }).splice(3); // Первые три отсчет стабильно отбрасываем...
            result.pop(); // Последний - тоже лишний
            resolve(result.map(r => r.value));
        })

    });
}

module.exports = {
    "readSamples": readSamples,
}
