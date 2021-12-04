var settings = {
    "gen-freq-val": {val: 1020, unit: "Гц", type: "integer", range: {min: 200, max: 3500}, step: 10, next: {up: "gen-zero-val", down: "gen-tran-val", right: "mes-freq-val"}},
    "mes-freq-val": {val: 840, unit: "Гц", type: "integer", range: {min: 200, max: 3500}, step: 10, next: {up: "mes-psf-val", down: "mes-tran-val", left: "gen-freq-val"}},
    "gen-tran-val": {val: 0, unit: "дБм0", type: "float", range: {min: -55, max: 3}, step: 10, next: {up: "gen-freq-val", down: "gen-zero-val", right: "mes-tran-val"}}, // &pm; 00
    "mes-tran-val": {val: 0, unit: "дБм0", type: "float", range: {min: -55, max: 3}, step: 10, next: {up: "mes-freq-val", down: "mes-zero-val", left: "gen-tran-val"}}, // &pm; xx,x
    "gen-zero-val": {val: -13, unit: "дБм0", type: "float", range: {min: -55, max: 3}, step: 10, next: {up: "gen-tran-val", down: "gen-freq-val", right: "mes-zero-val"}},
    "mes-zero-val": {val: 4, unit: "дБм0", type: "float", range: {min: -55, max: 3}, step: 10, next: {up: "mes-tran-val", down: "mes-voice1-val", left: "gen-zero-val"}}, // + 4
    "mes-voice1-val": {val: 0, unit: "", type: "enum", values: [{val: 0, name: "Закрытый"}, {val: 1, name: "Открытый"}], next: {up: "mes-zero-val", down: "mes-voice2-val"}},
    "mes-voice2-val": {val: 0, unit: "&ohm;", type: "enum", values: [{val: 0, name: "600"}, {val: 1, name: "> 30"}], next: {up: "mes-voice1-val", down: "mes-psf-val"}}, // &ohm;
    "mes-psf-val": {val: 0, unit: "", type: "enum", values: [{val: 0, name: "Выключен"}, {val: 1, name: "Выключен"}], next: {up: "mes-voice2-val", down: "mes-freq-val"}}
};

exports.settings = settings;

exports.dataModels = {
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
                    {x: -45, y:  0},
                    {x: -45, y: 22},
                    {x: -40, y: 27},
                    {x: -30, y: 33},
                    {x:   0, y: 33},
                    {x:   0, y:  0},
                    {x: -45, y: 0} // round part
                ],
                shadow: [
                    {x: -44, y:  0},
                    {x: -44, y: 21.5},
                    {x: -40, y: 26},
                    {x: -30, y: 32},
                    {x:   -1, y: 32},
                    {x:   -1, y:  0},
                ]
            }
        ],
        data: [{x: -50, y: 15},{x: -40, y: 35},{x: -30, y: 15},{x: -10, y: 22},{x: 5, y: 15}]
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
                    {x: 300, y:  2},
                    {x: 300, y:  .5},
                    {x: 2400, y: .5},
                    {x: 2400, y: .9},
                    {x: 3000, y: .9},
                    {x: 3000, y: 1.8},
                    {x: 3400, y: 1.8},
                    {x: 3400, y: 2},
                    {x: 300,  y: 2} // round part
                ],
                shadow: [
                    {x: 350, y:  2},
                    {x: 350, y:  .5 + .080},
                    {x: 2350, y: .5 + .080},
                    {x: 2350, y: .9 + .080},
                    {x: 2950, y: .9 + .080},
                    {x: 2950, y: 1.8 + .080},
                    {x: 3350, y: 1.8 + .080},
                    {x: 3350, y: 2}
                ]
            },
            {
                type: 'bottom',
                line: [
                    {x: 0, y:  0},
                    {x: 200, y:  0},
                    {x: 200, y: -.5},
                    {x: 3600, y: -.5},
                    {x: 3600, y: 0},
                    {x: 3800, y: 0},
                    {x: 3800, y: -1},// round part
                    {x: 0,    y: -1},
                    {x: 0,    y: 0}
                ],
                shadow: [
                    {x: 0, y:  -.085},
                    {x: 150, y:  -.085},
                    {x: 150, y: -.585},
                    {x: 3650, y: -.585},
                    {x: 3650, y: -.085},
                    {x: 3800, y: -.085},
                ]
            }
        ],
        data: [{x: 100, y: 1.8},{x: 200, y: .25},{x: 1020, y: 0},{x: 1200, y: .7},{x: 2450, y: -.7},{x: 3200, y: 1},{x: 3600, y: 1.8}]
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
                    {x: -55, y:  3.5},
                    {x: -55, y:  3},
                    {x: -50, y:  3},
                    {x: -50, y:  1},
                    {x: -40, y:  1},
                    {x: -40, y:  .5},
                    {x: -10, y:  .5},
                    {x:   0, y:  .5},
                    {x:  3, y: .5},
                    {x:  3, y: 1},
                    {x:  3, y: 3.5},// round part
                    {x: -55,y: 3.5}
                ],
                shadow: [
                    {x: -55 + 1, y:  3.5},
                    {x: -55 + 1, y:  3 + .14},
                    {x: -50 + 1, y:  3 + .14},
                    {x: -50 + 1, y:  1 + .14},
                    {x: -40 + 1, y:  1 + .14},
                    {x: -40 + 1, y:  .5 + .14},
                    {x: -10, y:  .5 + .14},
                    {x:   0, y:  .5 + .14},
                    {x:  3 - 1, y: .5 + .14},
                    {x:  3 - 1, y: 1}
                ]
            },
            {
                type: 'bottom',
                line: [
                    {x: -55, y:  -3.5},
                    {x: -55, y:  -3},
                    {x: -50, y:  -3},
                    {x: -50, y:  -1},
                    {x: -40, y:  -1},
                    {x: -40, y:  -.5},
                    {x: -10, y:  -.5},
                    {x:   0, y:  -.5},
                    {x:  3, y: -.5},
                    {x:  3, y: -1},
                    {x:  3, y: -3.5},// round part
                    {x: -55,y: -3.5}

                ],
                shadow: [
                    {x: -55 + 1, y:  -3.5},
                    {x: -55 + 1, y:  -3 - .14},
                    {x: -50 + 1, y:  -3 - .14},
                    {x: -50 + 1, y:  -1 - .14},
                    {x: -40 + 1, y:  -1 - .14},
                    {x: -40 + 1, y:  -.5 - .14},
                    {x: -10, y:  -.5 - .14},
                    {x:   0, y:  -.5 - .14},
                    {x:  3 - 1, y: -.5 - .14},
                    {x:  3 - 1, y: -1}
                ]
            }
        ],
        data: [{x: -65, y: -3},{x: -60, y: 3},{x: -55, y: .7},{x: -45, y: -.6},{x: -35, y: .6},{x:-20,y:.4},{x:-9,y:.2}]
    }    
}