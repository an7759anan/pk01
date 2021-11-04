exports.dataModels = {
    "SIGNAL_TO_NOISE_MEASUREMENT": {
        axisX: {
            name: 'Input level',
            units: 'dBm0',
            min: -60,
            max: 10,
            step: 10,
            marks: []
        },
        axisY: {
            name: 'Signal-to-total distortion ratio',
            units: 'dB',
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
        ]
    },
    "FREQUENCY_RESPONSE_MEASUREMENT": {
        axisX: {
            name: 'Frequency (f)',
            units: 'Hz',
            min: 0,
            max: 3800,
            marks: []
        },
        axisY: {
            name: 'Loss',
            units: 'dB',
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
        ]
    },
    "AMPLITUDE_RESPONSE_MEASUREMENT": {
        axisX: {
            name: 'Input level',
            units: 'dBm0',
            min: -70,
            max: 3,
            marks: []
        },
        axisY: {
            name: 'Gain variation',
            units: 'dB',
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
        ]
    }    
}