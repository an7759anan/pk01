const { filter } = require('./filter');

const process = (samples) => {
    // p8 - ср.кв.ур-нь сигнала, p9 - ср.кв.ур-нь шума, p89 - ср.кв.ур-нь сигнал + шум
    samples.forEach((s,i) => isNaN(s) && console.log('===isNaN===>', i));
    let p89 = samples.reduce((acc, cur) => acc + cur**2, 0) / samples.length;
    let p9 = filter(samples).reduce((acc, cur) => acc + cur**2, 0) / samples.length;
    console.log('===process===>',p89,p9)
    return { p8: p89, p9 };
}

module.exports = {
    "process": process
}

