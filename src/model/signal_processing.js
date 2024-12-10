const { filter } = require('./filter');
const fs = require('fs');

const process = (level, samples) => {
    // p8 - ср.кв.ур-нь сигнала, p9 - ср.кв.ур-нь шума, p89 - ср.кв.ур-нь сигнал + шум
    samples.forEach((s,i) => isNaN(s) && console.log('===isNaN===>', i));
    const filtered = filter(samples);
    samples.splice(0,500);
    filtered.splice(0,500);
    writeFile(level,samples,filtered);
    let p89 = Math.sqrt(samples.reduce((acc, cur) => acc + cur**2, 0) / samples.length);
    let p9 = Math.sqrt(filtered.reduce((acc, cur) => acc + cur**2, 0) / filtered.length);
    console.log('===process===>',p89,p9)
    return { p8: p89 - p9, p9 };
}

const writeFile = (level, samples, filtered) => {
    return new Promise((resolve,reject) => {
        const fileIdx = level < 0 ? `m${-level}.txt` : `p${level}.txt`;
        const content = samples.map((sample,idx) => `${idx} ${sample} ${filtered[idx]}`).join('\n');
        fs.writeFile(`sss_${fileIdx}`, content, (err, response) => {
            if (err) reject();               
            else resolve();
        })
    });
}

module.exports = {
    "process": process
}

