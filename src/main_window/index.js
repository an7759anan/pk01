const { ipcRenderer } = require('electron');
const { drawInit, drawData, drawPicture } = require('./drawings');

setTimeout(()=>{
    let dc = {};
    dc.DIAG_STROKE_WIDTH = 16;
    dc.canvas = $('#measurement-screen canvas')[0];
    dc.ctx = dc.canvas.getContext('2d');
    dc.gridX0 = 0.1 * dc.canvas.width;
    dc.gridY0 = 0.1 * dc.canvas.height;
    dc.gridWidth = 0.8 * dc.canvas.width;
    dc.gridHeight = 0.8 * dc.canvas.height;
    dc.gridX1 = dc.gridX0 + dc.gridWidth;
    dc.gridY1 = dc.gridY0 + dc.gridHeight;
    let img = new Image();
    img.onload = () => {
        dc.diagPattern = dc.ctx.createPattern(img,'repeat');
        drawInit(dc);
    };
    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAELSURBVDhPhZJLroMwDEXLHyT2v0kkmPBHkJdjYggp1bsDiE+v7drhY2V8FUVhoihy0Sk8IUPwR7YAV3Dfd3n7rG1b4dM0mbqu7wLjOJokSS4j2rZN4jiOHTkFL8vy8sqTv4dxWRaBFJTqzgSHIViWZZfXxrcRaWefqd74h1kQido5XBgcpsnDMNyNhFixGL8DBtUbVya0aZqHScWczKvc34MyeYbJ67rKO03Taxxlodee75n/u4WQoa8lIgrmeS5nFCbrEpFlH9P3vQSIRDWSiNlPVs3zfHIX/7yFMPn1FlgQnVma6jiOr2R8cEbUT1x+VaNW77pOYt0DHIbCovb8BOiNIVhVVS5CxvwBLOLdbHKhoSgAAAAASUVORK5CYII=';
}, 2000);


ipcRenderer.on('CONTROLLER_TO_VIEW_MESSAGE', (evt, message) => {
    if (message.screen == 'MODE_DIALOG'){
        if (message.show == true) $('#mode-select').show();
        if (message.value) $('#mode-select select').val(message.value);
    } else {
        if (message.show != undefined) $('.screens').hide();
        switch(message.screen){
            case 'SPLASH_SCREEN':
                if (message.show == true) $('#splash-screen').show();
            break;
            case 'TEST_INFO':
                if (message.show == true) $('#test-screen').show();
                if (message.opk_soft_version) $('#opk_soft_version').text($('#opk_soft_version').text() + message.opk_soft_version);
                if (message.switch_soft_version) $('#switch_soft_version').text($('#switch_soft_version').text() + message.switch_soft_version);
                if (message.dsp_soft_version) $('#dsp_soft_version').text($('#dsp_soft_version').text() + message.dsp_soft_version);
                if (message.channel) $('#channel').text($('#channel').text() + message.channel);
            break;
            case 'ERROR_DIALOG':
                if (message.show == true) $('#error-dialog').show();
            break;
            case 'MEASUREMENT':
                if (message.show == true) $('#measurement-screen').show();
                if (message.value){
                    switch(message.value){
                        case 'TONE_SIGNAL_MEASUREMENT':
    
                        break;
                        case 'FREE_CHANNEL_NOISE_MEASUREMENT':
                    
                        break;
                        case 'SIGNAL_TO_NOISE_MEASUREMENT':
                        case 'FREQUENCY_RESPONSE_MEASUREMENT':
                        case 'AMPLITUDE_RESPONSE_MEASUREMENT':
                            if(message.data){
                                drawData(dataModels[message.value], message.data);
                            } else {
                                drawPicture(dataModels[message.value]);
                            }
                        break;
                    }
                }
            break;
        }
    }
});

const dataModels = {
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
                    {x:  3, y: 1}
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
                    {x:  3, y: -1}
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
