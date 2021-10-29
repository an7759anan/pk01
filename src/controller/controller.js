const { ipcMain } = require ('electron');
const { tca8418_configure } = require('../drivers/tca8418/tca8418_driver');
//const view = require ('../main_window/index.js');

const KEY_START = 129;
const KEY_GEN   = 130;
const KEY_MEASURE = 131;
const KEY_SUN   = 132;
const KEY_1     = 133;
const KEY_2     = 134;
const KEY_3     = 135;
const KEY_4     = 136;
const KEY_STOP  = 139;
const KEY_UP    = 141;
const KEY_5     = 143;
const KEY_6     = 144;
const KEY_7     = 145;
const KEY_HOLD  = 149;
const KEY_LEFT  = 150;
const KEY_DOWN  = 151;
const KEY_RIGHT = 152;
const KEY_9     = 153;
const KEY_0     = 154;
const KEY_ENTER = 156;

const STATE_INITIAL             = 1;
const STATE_MODE_DIALOG         = 2;
const STATE_ERROR_DIALOG        = 3;
const STATE_MEASUREMENT         = 4;
//const STATE_MEASUREMENT_STARTED = 4;

const MODE_SPLASH_SCREEN    = 1;
const MODE_TEST_INFO        = 2;
const MODE_MEASUREMENT      = 3;

const mode_measurement_values_table = [
    'TONE_SIGNAL_MEASUREMENT',
    'SIGNAL_TO_NOISE_MEASUREMENT',
    'FREE_CHANNEL_NOISE_MEASUREMENT',
    'FREQUENCY_RESPONSE_MEASUREMENT'
];
let mode_measurement_index = 0;
let stop_clicks = 0;
let sun_clicks = 0;
let view, mode, state;

const eventLoop = (key) => {
    if(key == KEY_STOP){
        if (++stop_clicks > 1){
            view.close();
        }
    } else {
        stop_clicks = 0;
    }
    if(key == KEY_SUN){
        if (++sun_clicks > 1){
            if (view.webContents.isDevToolsOpened()){
                view.webContents.closeDevTools();
            } else {
                view.webContents.openDevTools();
            }
            sun_clicks = 0;
        }   
    } else {
        sun_clicks = 0;
    }
    switch(state){
        case STATE_INITIAL:
            switch(key){
                case KEY_MEASURE: 
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {screen: 'MODE_DIALOG', show: true, value: mode_measurement_values_table[mode_measurement_index]});
                    state = STATE_MODE_DIALOG;
                break;
            }
        break;
        case STATE_ERROR_DIALOG:
            if(key == KEY_0){
                view.close();
            } else {
                view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {screen: 'ERROR_DIALOG', show: false});
                state = STATE_INITIAL;
            }
        break;
        case STATE_MODE_DIALOG:
            switch(key){
                case KEY_ENTER:
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {screen: 'MODE_DIALOG', show: false});
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {screen: 'MEASUREMENT', show: true, value: mode_measurement_values_table[mode_measurement_index]});
                    state = STATE_MEASUREMENT;
                break;
                case KEY_UP:
                    mode_measurement_index = Math.max(0, --mode_measurement_index);
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {screen: 'MODE_DIALOG', value: mode_measurement_values_table[mode_measurement_index]});
                break;
                case KEY_DOWN:
                    mode_measurement_index = Math.min(mode_measurement_values_table.length - 1, ++mode_measurement_index);
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {screen: 'MODE_DIALOG', value: mode_measurement_values_table[mode_measurement_index]});
                break;
            }
        break;
        case STATE_MEASUREMENT:
            switch(key){
                case KEY_MEASURE: 
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {screen: 'MODE_DIALOG', show: true, value: mode_measurement_values_table[mode_measurement_index]});
                    state = STATE_MODE_DIALOG;
                break;
                case KEY_START:
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {
                        screen: 'MEASUREMENT', 
                        value: mode_measurement_values_table[mode_measurement_index],
                        data: [{x: -50, y: 15},{x: -40, y: 35},{x: -30, y: 15},{x: -10, y: 22},{x: 5, y: 15},]
                    });
                break;
            }
        break;
    }
}

const make_test_OPK_soft_version = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('ok!');
        }, 1000);
    });
}

const make_test_switch_soft_version = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('ok!');
        }, 2000);
    });
}

const make_test_DSP_soft_version = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('error!');
        }, 3000);
    });
}

const make_test_channel = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('ok!');
        }, 4000);
    });
}

const make_tests = () => {
    return Promise.all([
        make_test_OPK_soft_version().then(data => {
            view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {
                screen: 'TEST_INFO',
                opk_soft_version: data
            });
            return data;
        }),
        make_test_switch_soft_version().then(data => {
            view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {
                screen: 'TEST_INFO',
                switch_soft_version: data
            });
            return data;
        }),
        make_test_DSP_soft_version().then(data => {
            view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {
                screen: 'TEST_INFO',
                dsp_soft_version: data
            });
            return data;
         }),
        make_test_channel().then(data => {
            view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {
                screen: 'TEST_INFO',
                channel: data
            });
            return data;
        })
    ]);
}

const init = (mainWindow) => {
    view = mainWindow;
    mode = MODE_SPLASH_SCREEN;
    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {screen: 'SPLASH_SCREEN', show: true});
    setTimeout(() => {
        view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {screen: 'TEST_INFO', show: true});
        make_tests().then(data => {
            console.log(data);
            if(data.includes('error!')){
                view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {screen: 'ERROR_DIALOG', show: true});
                state = STATE_ERROR_DIALOG;
            } else {
                state = STATE_INITIAL;
            }
            tca8418_configure(0x0007,0x00ff, reg => {
                eventLoop(reg);
            }).
            then(data => console.log(data)).
            catch(data => console.log(data));
        });
    }, 3000);
}

module.exports = {
    "init": init
} 

