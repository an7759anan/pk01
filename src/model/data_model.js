const mode_measurement_values_table = [
    'TONE_SIGNAL_MEASUREMENT',
    'SIGNAL_TO_NOISE_MEASUREMENT',
    'FREE_CHANNEL_NOISE_MEASUREMENT',
    'FREQUENCY_RESPONSE_MEASUREMENT',
    'AMPLITUDE_RESPONSE_MEASUREMENT'
];

var settings = {
    // Частота генератора
    "gen-freq-val": { val: 1020, unit: "Гц", type: "integer", range: { min: 200, max: 3500 }, step: 10, next: { up: "gen-zero-val", down: "gen-tran-val", right: "mes-freq-val" } },
    // Частота измеренная
    "mes-freq-val": { val: 840, unit: "Гц", type: "integer", range: { min: 200, max: 3500 }, step: 10, next: { up: "mes-psf-val", down: "mes-tran-val", left: "gen-freq-val" } },
    // Номинальный уровень передачи
    "gen-zero-val": { val: -13, unit: "дБм", type: "float", range: { min: -55, max: 3 }, step: 1, next: { up: "gen-tran-val", down: "gen-freq-val", right: "mes-zero-val" } },
    // Относительный уровень передачи
    "gen-tran-val": { val: 0, unit: "дБмO", type: "float", range: { min: -55, max: 3 }, step: 1, next: { up: "gen-freq-val", down: "gen-zero-val", right: "mes-tran-val" } }, // &pm; 00
    // Номинальный уровень приема
    "mes-zero-val": { val: 4, unit: "дБм", type: "float", range: { min: -55, max: 3 }, step: 1, next: { up: "mes-tran-val", down: "mes-voice1-val", left: "gen-zero-val" } }, // + 4
    // Относительный уровень приема (измеренный)
    "mes-tran-val": { val: 0, unit: "дБмO", type: "float", range: { min: -55, max: 3 }, step: 1, next: { up: "mes-freq-val", down: "mes-zero-val", left: "gen-tran-val" } }, // &pm; xx,x
    // Вход Открытый - Закрытый
    "mes-voice1-val": { val: 0, unit: "", type: "enum", values: [{ val: 0, name: "Закрытый" }, { val: 1, name: "Открытый" }], next: { up: "mes-zero-val", down: "mes-voice2-val" } },
    // Rвх
    "mes-voice2-val": { val: 0, unit: "&ohm;", type: "enum", values: [{ val: 0, name: "600" }, { val: 1, name: "> 30" }], next: { up: "mes-voice1-val", down: "mes-psf-val" } }, // &ohm;
    // ПСОФ Включен - Выключен
    "mes-psf-val": { val: 0, unit: "", type: "enum", values: [{ val: 0, name: "Выключен" }, { val: 1, name: "Включен" }], next: { up: "mes-voice2-val", down: "mes-freq-val" } }
};

const clearData = (script) => {
    dataModels[script].data.length = 0;
}

const DATA_MAX_LENGTH = 200;

const addDataFromDsp = (script, data) => {
    let dataModel = dataModels[script];
    if (!dataModel) return false;
    let dataModelData = dataModel.data;
    let x, y; //{x: -30, y: 15, isBad: true};
    /**
     * TODO
     * - учесть settings
     * - определиться с хорошой/плохой
     * - потом вообще сделать через Observable 
     * - ...
     * - проверка переполнения массива данных - по всем режимам!
     */
    switch (script) {
        case 'TONE_SIGNAL_MEASUREMENT':
            x = data["p3.1"];
            y = data.p4 / 10 - settings["mes-zero-val"].val;
            if (dataModel.data.length >= DATA_MAX_LENGTH) {
                dataModel.data.shift();
            }
            dataModel.data.push({ "genx": settings["gen-freq-val"].val, "x": x, "geny": settings["gen-tran-val"].val, "y": y });
            return true;
            break;
        case 'FREE_CHANNEL_NOISE_MEASUREMENT':
            if (dataModel.data.length >= DATA_MAX_LENGTH) {
                dataModel.data.shift();
            }
            try {
                x = 20 * Math.log10(data["p8"] / 10158);
                if (isFinite(x) && !isNaN(x)) {
                    dataModel.data.push({ "x": x, "y": 0 });
                    return true;
                }
                return false;
            } catch (error) {
                console.log(error);
                return false;
            }
            break;
        case 'SIGNAL_TO_NOISE_MEASUREMENT':
            try {
                x = 20 * Math.log10(data["p8"] / 10158);
                y = 20 * Math.log10(data["p8"] / data["p9"]);
                if (isFinite(x) && isFinite(y) && !isNaN(x) && !isNaN(y)) {
                    dataModel.data.push({ "x": x, "y": y });
                    return true;
                }
                return false;
            } catch (error) {
                console.log(error);
                return false;
            }
            break;
        case 'FREQUENCY_RESPONSE_MEASUREMENT':
            x = data["p3.1"];
            y = settings["gen-tran-val"].val - data.p4 / 10;
            console.log(`gen-tran-val=${settings["gen-tran-val"].val}; data.p4=${data.p4}; x=${x}; y=${y}`);
            if (x != undefined) {
                let res = putFrequencyResponseMark(x, y, dataModel);
                if (res) {
                    nominalizeFrequencyResponseMarks(dataModel);
                }
                return res;
            }
            return false;
            break;
        case 'AMPLITUDE_RESPONSE_MEASUREMENT':
            if (data["pp2"] != undefined && data["pp4"] != undefined) {
                x = data["pp2"];
                y = data["pp4"] - data["pp2"];
                dataModel.data.push({ "x": x, "y": y });
            }
            break;
    }
}

const nominalizeFrequencyResponseMarks = (dataModel) => {
    let nominalMark = dataModel.buffer.find(mark => mark.x === 1020);
    if (nominalMark && nominalMark.y) {
        for (let mark of dataModel.buffer) {
            mark.y -= nominalMark;
        }
    }
}

const putFrequencyResponseMark = (x, y, dataModel) => {
    /*
    * отфильтровать только одно значение из ряда для одних и тех же значений x
    */
    let buffer = dataModel.buffer ?? [];
    if (buffer.length) {
        if (buffer[buffer.length - 1].x !== x) {
            dataModel.data.push(buffer[Math.floor(buffer.length / 2)]);
            buffer.length = 0;
            buffer.push({ "x": x, "y": y });
            dataModel.buffer = buffer;
            return true;
        } else if (buffer.length == 4) {
            buffer.push({ "x": x, "y": y });
            dataModel.buffer = buffer;
            dataModel.data.push(buffer[Math.floor(buffer.length / 2)]);
            return true;
        } else if (buffer.length < 4) {
            buffer.push({ "x": x, "y": y });
            dataModel.buffer = buffer;
            return true;
        }
        return false;
    }
    buffer.push({ "x": x, "y": y });
    dataModel.buffer = buffer;
    return true;
}

var dataModels = {
    "TONE_SIGNAL_MEASUREMENT": {
        data: []
    },
    "FREE_CHANNEL_NOISE_MEASUREMENT": {
        data: []
    },
    "SIGNAL_TO_NOISE_MEASUREMENT": {
        axisX: {
            name: 'Входной уровень',
            units: 'дБм0',
            min: -60,
            max: 10,
            step: 10,
            marks: []
        },
        axisY: {
            name: 'Отношение сигнал/шум квантования',
            units: 'дБ',
            min: 0,
            max: 40,
            step: 10,
            marks: []
        },
        boundaries: [
            {
                type: 'bottom',
                line: [
                    { x: -45, y: 0 },
                    { x: -45, y: 22 },
                    { x: -40, y: 27 },
                    { x: -30, y: 33 },
                    { x: 0, y: 33 },
                    { x: 0, y: 0 },
                    { x: -45, y: 0 } // round part
                ],
                shadow: [
                    { x: -44, y: 0 },
                    { x: -44, y: 21.5 },
                    { x: -40, y: 26 },
                    { x: -30, y: 32 },
                    { x: -1, y: 32 },
                    { x: -1, y: 0 },
                ]
            }
        ],
        data: [{ x: -50, y: 15 }, { x: -40, y: 35 }, { x: -30, y: 15, isBad: true }, { x: -10, y: 22, isBad: true }, { x: 5, y: 15 }]
    },
    "FREQUENCY_RESPONSE_MEASUREMENT": {
        axisX: {
            name: 'Частота',
            units: 'Гц',
            min: 0,
            max: 3800,
            marks: []
        },
        axisY: {
            name: 'Затухание',
            units: 'дБ',
            min: -1,
            max: 2,
            marks: []
        },
        boundaries: [
            {
                type: 'top',
                line: [
                    { x: 300, y: 2 },
                    { x: 300, y: .5 },
                    { x: 2400, y: .5 },
                    { x: 2400, y: .9 },
                    { x: 3000, y: .9 },
                    { x: 3000, y: 1.8 },
                    { x: 3400, y: 1.8 },
                    { x: 3400, y: 2 },
                    { x: 300, y: 2 } // round part
                ],
                shadow: [
                    { x: 350, y: 2 },
                    { x: 350, y: .5 + .080 },
                    { x: 2350, y: .5 + .080 },
                    { x: 2350, y: .9 + .080 },
                    { x: 2950, y: .9 + .080 },
                    { x: 2950, y: 1.8 + .080 },
                    { x: 3350, y: 1.8 + .080 },
                    { x: 3350, y: 2 }
                ]
            },
            {
                type: 'bottom',
                line: [
                    { x: 0, y: 0 },
                    { x: 200, y: 0 },
                    { x: 200, y: -.5 },
                    { x: 3600, y: -.5 },
                    { x: 3600, y: 0 },
                    { x: 3800, y: 0 },
                    { x: 3800, y: -1 },// round part
                    { x: 0, y: -1 },
                    { x: 0, y: 0 }
                ],
                shadow: [
                    { x: 0, y: -.085 },
                    { x: 150, y: -.085 },
                    { x: 150, y: -.585 },
                    { x: 3650, y: -.585 },
                    { x: 3650, y: -.085 },
                    { x: 3800, y: -.085 },
                ]
            }
        ],
        data: [{ x: 100, y: 1.8 }, { x: 200, y: .25 }, { x: 1020, y: 0 }, { x: 1200, y: .7, isBad: true }, { x: 2450, y: -.7, isBad: true }, { x: 3200, y: 1 }, { x: 3600, y: 1.8 }]
    },
    "AMPLITUDE_RESPONSE_MEASUREMENT": {
        axisX: {
            name: 'Входной уровень',
            units: 'дБм0',
            min: -70,
            max: 3,
            marks: []
        },
        axisY: {
            name: 'Затухание',
            units: 'дБ',
            min: -3.5,
            max: 3.5,
            marks: []
        },
        boundaries: [
            {
                type: 'top',
                line: [
                    { x: -55, y: 3.5 },
                    { x: -55, y: 3 },
                    { x: -50, y: 3 },
                    { x: -50, y: 1 },
                    { x: -40, y: 1 },
                    { x: -40, y: .5 },
                    { x: -10, y: .5 },
                    { x: 0, y: .5 },
                    { x: 3, y: .5 },
                    { x: 3, y: 1 },
                    { x: 3, y: 3.5 },// round part
                    { x: -55, y: 3.5 }
                ],
                shadow: [
                    { x: -55 + 1, y: 3.5 },
                    { x: -55 + 1, y: 3 + .14 },
                    { x: -50 + 1, y: 3 + .14 },
                    { x: -50 + 1, y: 1 + .14 },
                    { x: -40 + 1, y: 1 + .14 },
                    { x: -40 + 1, y: .5 + .14 },
                    { x: -10, y: .5 + .14 },
                    { x: 0, y: .5 + .14 },
                    { x: 3 - 1, y: .5 + .14 },
                    { x: 3 - 1, y: 1 }
                ]
            },
            {
                type: 'bottom',
                line: [
                    { x: -55, y: -3.5 },
                    { x: -55, y: -3 },
                    { x: -50, y: -3 },
                    { x: -50, y: -1 },
                    { x: -40, y: -1 },
                    { x: -40, y: -.5 },
                    { x: -10, y: -.5 },
                    { x: 0, y: -.5 },
                    { x: 3, y: -.5 },
                    { x: 3, y: -1 },
                    { x: 3, y: -3.5 },// round part
                    { x: -55, y: -3.5 }

                ],
                shadow: [
                    { x: -55 + 1, y: -3.5 },
                    { x: -55 + 1, y: -3 - .14 },
                    { x: -50 + 1, y: -3 - .14 },
                    { x: -50 + 1, y: -1 - .14 },
                    { x: -40 + 1, y: -1 - .14 },
                    { x: -40 + 1, y: -.5 - .14 },
                    { x: -10, y: -.5 - .14 },
                    { x: 0, y: -.5 - .14 },
                    { x: 3 - 1, y: -.5 - .14 },
                    { x: 3 - 1, y: -1 }
                ]
            }
        ],
        data: [{ x: -65, y: -3 }, { x: -60, y: 3 }, { x: -55, y: .7 }, { x: -45, y: -.6 }, { x: -35, y: .6, isBad: true }, { x: -20, y: .4 }, { x: -9, y: .2 }]
    }
}

module.exports = {
    "settings": settings,
    "clearData": clearData,
    "addDataFromDsp": addDataFromDsp,
    "dataModels": dataModels,
    "mode_measurement_values_table": mode_measurement_values_table
}
