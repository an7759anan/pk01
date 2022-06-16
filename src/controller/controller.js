const { ipcMain } = require('electron');
const StormDB = require('stormdb');
const { tca8418_configure } = require('../drivers/tca8418/tca8418_driver');
let { settings, dataModels } = require('../model/data_model');
const dsp = require('./dsp')

const KEY_START = 129;
const KEY_GEN = 130;
const KEY_MEASURE = 131;
const KEY_SUN = 132;
const KEY_1 = 133;
const KEY_2 = 134;
const KEY_3 = 135;
const KEY_4 = 136;
const KEY_STOP = 139;
const KEY_UP = 141;
const KEY_5 = 143;
const KEY_6 = 144;
const KEY_7 = 145;
const KEY_HOLD = 149;
const KEY_LEFT = 150;
const KEY_DOWN = 151;
const KEY_RIGHT = 152;
const KEY_9 = 153;
const KEY_0 = 154;
const KEY_ENTER = 156;

const STATE_INITIAL = 1;
const STATE_MODE_DIALOG = 2;
const STATE_ERROR_DIALOG = 3;
const STATE_MEASUREMENT = 4;
const STATE_SETTINGS = 5;
const STATE_SETTINGS_EDIT_MODE = 6;
const STATE_MEASUREMENT_GRID = 7;

const MODE_SPLASH_SCREEN = 1;
const MODE_TEST_INFO = 2;
const MODE_MEASUREMENT_GRAPHIC = 3;
const MODE_MEASUREMENT_TABLE = 4;
const MODE_MEASUREMENT_NORMATIVE = 5;

const mode_transitions = [];
mode_transitions[MODE_MEASUREMENT_GRAPHIC] = [];
mode_transitions[MODE_MEASUREMENT_TABLE] = [];
mode_transitions[MODE_MEASUREMENT_NORMATIVE] = [];
mode_transitions[MODE_MEASUREMENT_GRAPHIC][KEY_LEFT] = MODE_MEASUREMENT_TABLE; mode_transitions[MODE_MEASUREMENT_GRAPHIC][KEY_RIGHT] = MODE_MEASUREMENT_NORMATIVE;
mode_transitions[MODE_MEASUREMENT_TABLE][KEY_LEFT] = MODE_MEASUREMENT_NORMATIVE; mode_transitions[MODE_MEASUREMENT_TABLE][KEY_RIGHT] = MODE_MEASUREMENT_GRAPHIC;
mode_transitions[MODE_MEASUREMENT_NORMATIVE][KEY_LEFT] = MODE_MEASUREMENT_GRAPHIC; mode_transitions[MODE_MEASUREMENT_NORMATIVE][KEY_RIGHT] = MODE_MEASUREMENT_TABLE;

const mode_measurement_values_table = [
    'TONE_SIGNAL_MEASUREMENT',
    'SIGNAL_TO_NOISE_MEASUREMENT',
    'FREE_CHANNEL_NOISE_MEASUREMENT',
    'FREQUENCY_RESPONSE_MEASUREMENT',
    'AMPLITUDE_RESPONSE_MEASUREMENT'
];
let stop_clicks = 0;
let sun_clicks = 0;
let view, mode, state;

const engine = new StormDB.localFileEngine("./db.stormdb");
const db = new StormDB(engine);

db.default({
    variables: {
        mode_measurement_index: 0,
        settings_prop: "gen-freq-val"
    },
    model_settings: settings
});
db.save();

mode_measurement_index = db.get("variables.mode_measurement_index").value();
settings_prop = db.get("variables.settings_prop").value();
settings = db.get("model_settings").value();

const eventLoop = (key) => {
    if (key == KEY_STOP) {
        if (++stop_clicks > 1) {
            db.get("variables.mode_measurement_index").set(mode_measurement_index);
            db.get("variables.settings_prop").set(settings_prop);
            db.get("model_settings").set(settings);
            db.save();
            view.close();
        }
    } else {
        stop_clicks = 0;
    }
    if (key == KEY_SUN) {
        if (++sun_clicks > 1) {
            if (view.webContents.isDevToolsOpened()) {
                view.webContents.closeDevTools();
            } else {
                view.webContents.openDevTools();
            }
            sun_clicks = 0;
        }
    } else {
        sun_clicks = 0;
    }
    switch (state) {
        case STATE_INITIAL:
            switch (key) {
                case KEY_MEASURE:
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'MODE_DIALOG', show: true, value: mode_measurement_values_table[mode_measurement_index] });
                    state = STATE_MODE_DIALOG;
                    break;
                case KEY_SUN:
                    settings_prop = "gen-freq-val";
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'SETTINGS_GRID', show: true, value: settings_prop, data: settings });
                    state = STATE_SETTINGS;
                    break;
            }
            break;
        case STATE_SETTINGS:
            switch (key) {
                case KEY_SUN:
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'MEASUREMENT_GRAPHIC', show: true, value: mode_measurement_values_table[mode_measurement_index] });
                    state = STATE_MEASUREMENT;
                    mode = MODE_MEASUREMENT_GRAPHIC;
                    break;
                case KEY_ENTER:
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'SETTINGS_GRID', value: settings_prop, edit: true });
                    state = STATE_SETTINGS_EDIT_MODE;
                    break;
                case KEY_MEASURE:
                    settings_prop = "mes-freq-val";
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'SETTINGS_GRID', value: settings_prop });
                    break;
                case KEY_GEN:
                    settings_prop = "gen-freq-val";
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'SETTINGS_GRID', value: settings_prop });
                    break;
                case KEY_UP:
                    if (settings[settings_prop].next.up) {
                        settings_prop = settings[settings_prop].next.up;
                        view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'SETTINGS_GRID', value: settings_prop });
                    }
                    break;
                case KEY_DOWN:
                    if (settings[settings_prop].next.down) {
                        settings_prop = settings[settings_prop].next.down;
                        view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'SETTINGS_GRID', value: settings_prop });
                    }
                    break;
                case KEY_LEFT:
                    if (settings[settings_prop].next.left) {
                        settings_prop = settings[settings_prop].next.left;
                        view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'SETTINGS_GRID', value: settings_prop });
                    }
                    break;
                case KEY_RIGHT:
                    if (settings[settings_prop].next.right) {
                        settings_prop = settings[settings_prop].next.right;
                        view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'SETTINGS_GRID', value: settings_prop });
                    }
                    break;
            }
            break;
        case STATE_SETTINGS_EDIT_MODE:
            switch (key) {
                case KEY_ENTER:
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'SETTINGS_GRID', value: settings_prop, edit: false });
                    state = STATE_SETTINGS;
                    break;
                case KEY_UP:
                    let prop = settings[settings_prop];
                    switch (prop.type) {
                        case "integer":
                        case "float":
                            prop.val = Math.min(prop.range.max, prop.val + prop.step);
                            break;
                        case "enum":
                            prop.val = Math.min(prop.values.length - 1, prop.val + 1);
                            break;
                    }
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'SETTINGS_GRID', value: settings_prop, edit: true, data: settings });
                    break;
                case KEY_DOWN:
                    let prop2 = settings[settings_prop];
                    switch (prop2.type) {
                        case "integer":
                        case "float":
                            prop2.val = Math.max(prop2.range.min, prop2.val - prop2.step);
                            break;
                        case "enum":
                            prop2.val = Math.max(0, prop2.val - 1);
                            break;
                    }
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'SETTINGS_GRID', value: settings_prop, edit: true, data: settings });
                    break;
            }
            break;
        case STATE_ERROR_DIALOG:
            if (key == KEY_0) {
                view.close();
            } else {
                initSettings();
                view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'ERROR_DIALOG', show: false });
                view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'MODE_DIALOG', show: true, value: mode_measurement_values_table[mode_measurement_index] });
                state = STATE_MODE_DIALOG;
                // if (['TONE_SIGNAL_MEASUREMENT','FREE_CHANNEL_NOISE_MEASUREMENT'].includes(mode_measurement_values_table[mode_measurement_index])) {
                //     view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {
                //         screen: 'MEASUREMENT_GRID', 
                //         show: true, 
                //         value: mode_measurement_values_table[mode_measurement_index],
                //         data: {}
                //     });
                //     state = STATE_MEASUREMENT_GRID;
                // } else {
                //     view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {
                //         screen: 'MEASUREMENT_GRAPHIC', 
                //         show: true, 
                //         value: mode_measurement_values_table[mode_measurement_index],
                //         data: dataModels[mode_measurement_values_table[mode_measurement_index]],
                //         action: 'draw-grid'
                //     });
                //     state = STATE_MEASUREMENT;
                //     mode = MODE_MEASUREMENT_GRAPHIC;
                // }
            }
            break;
        case STATE_MODE_DIALOG:
            switch (key) {
                case KEY_ENTER:
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'MODE_DIALOG', show: false });
                    if (['TONE_SIGNAL_MEASUREMENT', 'FREE_CHANNEL_NOISE_MEASUREMENT'].includes(mode_measurement_values_table[mode_measurement_index])) {
                        view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {
                            screen: 'MEASUREMENT_GRID',
                            show: true,
                            value: mode_measurement_values_table[mode_measurement_index],
                            data: {}
                        });
                        state = STATE_MEASUREMENT_GRID;
                    } else {
                        view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {
                            screen: 'MEASUREMENT_GRAPHIC',
                            show: true,
                            value: mode_measurement_values_table[mode_measurement_index],
                            data: dataModels[mode_measurement_values_table[mode_measurement_index]],
                            action: 'draw-grid'
                        });
                        state = STATE_MEASUREMENT;
                        mode = MODE_MEASUREMENT_GRAPHIC;
                    }
                    break;
                case KEY_UP:
                    mode_measurement_index = Math.max(0, --mode_measurement_index);
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'MODE_DIALOG', value: mode_measurement_values_table[mode_measurement_index] });
                    break;
                case KEY_DOWN:
                    mode_measurement_index = Math.min(mode_measurement_values_table.length - 1, ++mode_measurement_index);
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'MODE_DIALOG', value: mode_measurement_values_table[mode_measurement_index] });
                    break;
            }
            break;
        case STATE_MEASUREMENT_GRID:
            switch (key) {
                case KEY_MEASURE:
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'MODE_DIALOG', show: true, value: mode_measurement_values_table[mode_measurement_index] });
                    state = STATE_MODE_DIALOG;
                    break;
            }
            break;
        case STATE_MEASUREMENT:
            let mode_measurement_value = mode_measurement_values_table[mode_measurement_index];
            switch (key) {
                case KEY_SUN:
                    settings_prop = "gen-freq-val";
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'SETTINGS_GRID', show: true, value: settings_prop });
                    state = STATE_SETTINGS;
                    break;
                case KEY_MEASURE:
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'MODE_DIALOG', show: true, value: mode_measurement_values_table[mode_measurement_index] });
                    state = STATE_MODE_DIALOG;
                    break;
                case KEY_START:
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {
                        show: true,
                        screen: 'MEASUREMENT_GRAPHIC',
                        value: mode_measurement_value,
                        data: dataModels[mode_measurement_value],
                        action: 'draw-data'
                    });
                    break;
                case KEY_LEFT:
                case KEY_RIGHT:
                    mode = mode_transitions[mode][key]; // next mode to go
                    switch (mode) {
                        case MODE_MEASUREMENT_GRAPHIC:
                            view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {
                                show: true,
                                screen: 'MEASUREMENT_GRAPHIC',
                                value: mode_measurement_value,
                                data: dataModels[mode_measurement_value],
                                action: 'draw-data'
                            });
                            break;
                        case MODE_MEASUREMENT_TABLE:
                            view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {
                                show: true,
                                screen: 'MEASUREMENT_TABLE',
                                value: mode_measurement_value,
                                data: dataModels[mode_measurement_value],
                                action: 'draw-data'
                            });
                            break;
                        case MODE_MEASUREMENT_NORMATIVE:
                            view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {
                                show: true,
                                screen: 'NORMATIVE_TABLE',
                                value: mode_measurement_value,
                            });
                            break;
                    }
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

const load_dsp = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            dsp.dsp_init()
                .then(result => {
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {
                        screen: 'DSP_LOADING',
                        dsp_loading_result: result
                    });
                    setTimeout(() => {
                        resolve(true);
                    }, 3000);
                });
        }, 3000);
    });
}

//const ioHook = require('iohook');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

// initial set settings...
const initSettings = () => {
    for (let _setting_prop in settings) {
        if (settings.hasOwnProperty(_setting_prop)) {
            view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'SETTINGS_GRID', value: _setting_prop, edit: false, data: settings });
        }
    }
}

const init = (mainWindow) => {
    view = mainWindow;
    mode = MODE_SPLASH_SCREEN;
    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'SPLASH_SCREEN', show: true });
    setTimeout(() => {
        view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'DSP_LOADING', show: true });
        load_dsp()
            .then(dsp_loading_result => {
                view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'TEST_INFO', show: true });
                make_tests().then(data => {
                    console.log(data);
                    if (data.includes('error!')) {
                        view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'ERROR_DIALOG', show: true });
                        state = STATE_ERROR_DIALOG;
                    } else {
                        initSettings();
                        view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'MODE_DIALOG', show: true, value: mode_measurement_values_table[mode_measurement_index] });
                        state = STATE_MODE_DIALOG;
                        // if (['TONE_SIGNAL_MEASUREMENT','FREE_CHANNEL_NOISE_MEASUREMENT'].includes(mode_measurement_values_table[mode_measurement_index])) {
                        //     view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {
                        //         screen: 'MEASUREMENT_GRID', 
                        //         show: true, 
                        //         value: mode_measurement_values_table[mode_measurement_index],
                        //         data: {}
                        //     });
                        //     state = STATE_MEASUREMENT_GRID;
                        // } else {
                        //     view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {
                        //         screen: 'MEASUREMENT_GRAPHIC', 
                        //         show: true, 
                        //         value: mode_measurement_values_table[mode_measurement_index],
                        //         data: dataModels[mode_measurement_values_table[mode_measurement_index]],
                        //         action: 'draw-grid'
                        //     });
                        //     state = STATE_MEASUREMENT;
                        //     mode = MODE_MEASUREMENT_GRAPHIC;
                        // }
                    }
                    tca8418_configure(0x0007, 0x00ff, reg => {
                        eventLoop(reg);
                    }).
                        then(data => {
                            console.log(data);
                        }).
                        catch(data => console.log(data));
                    // console.log('...keyboard listening start...');
                    // let stdin = process.stdin;
                    // stdin.setRawMode(true);
                    // stdin.resume();
                    // stdin.setEncoding('utf8');
                    // stdin.on('data', key => {
                    //     if(key == '\u0003'){
                    //         process.exit();
                    //     }
                    //     console.log(`qqqq=>${key}<==`);
                    // });

                });
            })
            .catch(dsp_loading_error => {

            });
    }, 3000);
}

module.exports = {
    "init": init
}

