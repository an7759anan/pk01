
let tca8418_configure = null;
const os = require('os');
const fs = require('fs');

if (os.arch() == 'arm64' ){
    tca8418_configure = require('../drivers/tca8418/tca8418_driver').tca8418_configure;
}
//  i2c = require('i2c-bus')
// else
//   console.warn "Not using I2C", os.arch()
//   i2c = require('./i2c.mock.js')

const { ipcMain, dialog } = require('electron');
const StormDB = require('stormdb');

const dm = require('../model/data_model');
const dsp = require('../drivers/dsp');
const controllerDsp = require('../controller/controller_dsp');
const { SerialPort } = require('serialport');

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
const KEY_8 = 146;
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
let view, mode, state, viewTest;

const engine = new StormDB.localFileEngine("./db.stormdb");
const db = new StormDB(engine);

let serialPort;

db.default({
    variables: {
        mode_measurement_index: 0,
        settings_prop: "gen-freq-val"
    },
    model_settings: dm.settings
});
db.save();

mode_measurement_index = db.get("variables.mode_measurement_index").value();
settings_prop = db.get("variables.settings_prop").value();
Object.assign(dm.settings, db.get("model_settings").value());
let mode_measurement_value;

const eventLoop = (key) => {
    if (key == KEY_STOP) {
        if (++stop_clicks > 1) {
            db.get("variables.mode_measurement_index").set(mode_measurement_index);
            db.get("variables.settings_prop").set(settings_prop);
            db.get("model_settings").set(dm.settings);
            db.save();
            view.close();
        } 
        dsp.sendStopCommand();
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
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'SETTINGS_GRID', show: true, value: settings_prop, data: dm.settings });
                    state = STATE_SETTINGS;
                    break;
            }
            break;
        case STATE_SETTINGS:
            switch (key) {
                case KEY_SUN:
                    if (['TONE_SIGNAL_MEASUREMENT', 'FREE_CHANNEL_NOISE_MEASUREMENT'].includes(mode_measurement_values_table[mode_measurement_index])) {
                        view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'MEASUREMENT_GRID', show: true, value: mode_measurement_values_table[mode_measurement_index] });
                        state = STATE_MEASUREMENT_GRID;
                    } else {
                        view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'MEASUREMENT_GRAPHIC', show: true, value: mode_measurement_values_table[mode_measurement_index] });
                        state = STATE_MEASUREMENT;
                        mode = MODE_MEASUREMENT_GRAPHIC;
                    }
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
                    if (dm.settings[settings_prop].next.up) {
                        settings_prop = dm.settings[settings_prop].next.up;
                        view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'SETTINGS_GRID', value: settings_prop });
                    }
                    break;
                case KEY_DOWN:
                    if (dm.settings[settings_prop].next.down) {
                        settings_prop = dm.settings[settings_prop].next.down;
                        view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'SETTINGS_GRID', value: settings_prop });
                    }
                    break;
                case KEY_LEFT:
                    if (dm.settings[settings_prop].next.left) {
                        settings_prop = dm.settings[settings_prop].next.left;
                        view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'SETTINGS_GRID', value: settings_prop });
                    }
                    break;
                case KEY_RIGHT:
                    if (dm.settings[settings_prop].next.right) {
                        settings_prop = dm.settings[settings_prop].next.right;
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
                    let prop = dm.settings[settings_prop];
                    switch (prop.type) {
                        case "integer":
                        case "float":
                            prop.val = Math.min(prop.range.max, prop.val + prop.step);
                            break;
                        case "enum":
                            prop.val = Math.min(prop.values.length - 1, prop.val + 1);
                            break;
                    }
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'SETTINGS_GRID', value: settings_prop, edit: true, data: dm.settings });
                    break;
                case KEY_DOWN:
                    let prop2 = dm.settings[settings_prop];
                    switch (prop2.type) {
                        case "integer":
                        case "float":
                            prop2.val = Math.max(prop2.range.min, prop2.val - prop2.step);
                            break;
                        case "enum":
                            prop2.val = Math.max(0, prop2.val - 1);
                            break;
                    }
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'SETTINGS_GRID', value: settings_prop, edit: true, data: dm.settings });
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
                            data: dm.dataModels[mode_measurement_values_table[mode_measurement_index]],
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
        /**
         * Состояние для (1) Измерение сигнала ТЧ вручную и (3) Измерение шума свободного канала
         */
        case STATE_MEASUREMENT_GRID:
            mode_measurement_value = mode_measurement_values_table[mode_measurement_index];
            switch (key) {
                case KEY_MEASURE:
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'MODE_DIALOG', show: true, value: mode_measurement_value });
                    state = STATE_MODE_DIALOG;
                    break;
                case KEY_SUN:
                        settings_prop = "gen-freq-val";
                        view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'SETTINGS_GRID', show: true, value: settings_prop });
                        state = STATE_SETTINGS;
                        break;
                case KEY_START:
                    dm.clearData(mode_measurement_value);
                    let p30 = mode_measurement_index + 1;
                    let cmd = { "kf": 0x41, "p30": p30 };
                    switch (p30){
                        case 1:
                            cmd["p2"] = dm.settings["gen-tran-val"].val;
                            cmd["p3.1"] = dm.settings["gen-freq-val"].val;
                            // cmd["p6"] = dm.settings["mes-voice1-val"].val;
                            // cmd["p7"] = dm.settings["mes-voice2-val"].val;
                            break;
                        case 3:
                            // cmd["p2"] = dm.settings["gen-tran-val"].val;
                            // cmd["p3.1"] = dm.settings["gen-freq-val"].val;
                            // cmd["p6"] = dm.settings["mes-voice1-val"].val;
                            // cmd["p11"] = 5;
                            break;
                        default:
                            break;
                    }
                    cmd["TEST"] = 1;
                    cmd["PSOF"] = dm.settings["mes-psf-val"].val;
                    cmd["DB10"] = 0;
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { 
                        show: true,
                        screen: 'DSP_TEST_SCREEN',
                        value: 'DATA_TO_SERIALPORT',
                        data: cmd
                    });
                    // dsp.sendCommand(cmd);
                    controllerDsp.startCommand(cmd);
                    break;
            }
            break;
        /**
         * Состояние для (2) Измерение отношения Сигнал/Шум, (4) Измерение частотной характеристики и (5) Измерение амплитудной характеристики
         */
        case STATE_MEASUREMENT:
            mode_measurement_value = mode_measurement_values_table[mode_measurement_index];
            switch (key) {
                case KEY_SUN:
                    settings_prop = "gen-freq-val";
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'SETTINGS_GRID', show: true, value: settings_prop });
                    state = STATE_SETTINGS;
                    break;
                case KEY_MEASURE:
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'MODE_DIALOG', show: true, value: mode_measurement_value });
                    state = STATE_MODE_DIALOG;
                    break;
                case KEY_START:
                /**
                 * TODO
                 * - обнулить данные в модели
                 * - вместо 'draw-data' послать 'draw-grid'
                 * - послать команду с выбранным сценарием в DSP
                 */
                    dm.clearData(mode_measurement_value);
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {
                        screen: 'MEASUREMENT_GRAPHIC',
                        show: true,
                        value: mode_measurement_value,
                        data: dm.dataModels[mode_measurement_value], 
                        action: 'draw-grid'
                    });
                    let p30 = mode_measurement_index + 1;
                    let cmd = { "kf": 0x41, "p30": p30 };
                    switch (p30){
                        case 1:
                            cmd["p2"] = dm.settings["gen-tran-val"].val;
                            cmd["p3.1"] = dm.settings["gen-freq-val"].val;
                            cmd["p6"] = dm.settings["mes-voice1-val"].val;
                            cmd["p7"] = dm.settings["mes-voice2-val"].val;
                            break;
                        case 2:
                            cmd["p2"] = dm.settings["gen-tran-val"].val;
                            cmd["p3.1"] = dm.settings["gen-freq-val"].val;
                            cmd["p6"] = dm.settings["mes-voice1-val"].val;
                            cmd["p11"] = 5;
                            break;
                        case 4:
                            cmd["p2"] = dm.settings["gen-tran-val"].val;
                            cmd["p3.1"] = dm.settings["gen-freq-val"].val;
                            cmd["p3.2"] = 3600;
                            cmd["p12"] = 100;
                            break;
                        case 5:
                            cmd["p2"] = dm.settings["gen-tran-val"].val;
                            cmd["p11"] = 5;
                            break;
                        default:
                            break;
                    }
                    cmd["TEST"] = 1;
                    cmd["PSOF"] = dm.settings["mes-psf-val"].val;
                    cmd["DB10"] = 0;
                    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { 
                        show: true,
                        screen: 'DSP_TEST_SCREEN',
                        value: 'DATA_TO_SERIALPORT',
                        data: cmd
                    });
                    dsp.sendCommand(cmd);
                    // view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {
                    //     show: true,
                    //     screen: 'MEASUREMENT_GRAPHIC',
                    //     value: mode_measurement_value,
                    //     data: dm.dataModels[mode_measurement_value], 
                    //     action: 'draw-data'
                    // });
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
                                data: dm.dataModels[mode_measurement_value],
                                action: 'draw-data'
                            });
                            break;
                        case MODE_MEASUREMENT_TABLE:
                            view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {
                                show: true,
                                screen: 'MEASUREMENT_TABLE',
                                value: mode_measurement_value,
                                data: dm.dataModels[mode_measurement_value],
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
            dsp.dsp_init(dm)
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
    for (let _setting_prop in dm.settings) {
        if (dm.settings.hasOwnProperty(_setting_prop)) {
            view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'SETTINGS_GRID', value: _setting_prop, edit: false, data: dm.settings });
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
                        //         data: dm.dataModels[mode_measurement_values_table[mode_measurement_index]],
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

ipcMain.handle('VIEW_TO_CONTROLLER_MESSAGE', async (event, args) => {
    switch (args.command){
        case 'SERIAL_PORT_LIST':
            let portList = await SerialPort.list();
            return portList;
            break;
        case 'SERIAL_PORT_OPEN':
            return new Promise((resolve, reject) => {
                if (serialPort && serialPort.isOpen){
                    serialPort.close(error => {
                        serialPort = null;
                        serialPort = new SerialPort({ path: args.path, baudRate: 115200 });
                    });
                } else {
                    serialPort = new SerialPort({ path: args.path, baudRate: 115200 });
                }
                serialPort.on('open', () => {
                    dsp.setPort(serialPort);
                    resolve(true);
                });
            });
            break;
        case 'SEND_COMMAND_TO_DSP':
            mode_measurement_value = mode_measurement_values_table[mode_measurement_index];
            dm.clearData(mode_measurement_value);
            view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {
                screen: 'MEASUREMENT_GRAPHIC',
                show: true,
                value: mode_measurement_value,
                data: dm.dataModels[mode_measurement_value], 
                action: 'draw-grid'
            });
            return new Promise((resolve, reject) => {
                resolve(dsp.sendCommand(args.cmd));
            });
            break;
        case 'SEND_COMMAND_FROM_DSP':
            /**
             * а сейчас надо перенаправить в DSP (упаковать в SLIP)
             */
            return new Promise((resolve, reject) => {
                dm.addDataFromDsp(mode_measurement_values_table[mode_measurement_index], args.cmd);
                view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {
                    show: true,
                    screen: 'MEASUREMENT_GRAPHIC',
                    value: mode_measurement_values_table[mode_measurement_index],
                    data: dm.dataModels[mode_measurement_values_table[mode_measurement_index]], 
                    action: 'draw-data'
                });
                resolve(dsp.sendCommand(args.cmd));
            });
            break;
        case 'LOAD_DSP_SOFT':
            return new Promise((resolve, reject) => {
                dialog.showOpenDialog(view, 
                    { properties: ['openFile', 'multiSelections'], 
                    filters: [{ name: 'Бинарные файлы', extensions: ['bin'] }, { name: 'Все файлы', extensions: ['*'] }] 
                }).then(result => {
                    if (result.filePaths.length){
                        const rs = fs.createReadStream(result.filePaths[0], { highWaterMark: 16});
                        rs.on('error', (error) => {
                            resolve(`error: ${error.message}`);
                        });
                        rs.on('data', (chunk) => {
                            console.log(`chunk: ${chunk.length}`);
                            serialPort.write(chunk);
                        });
                        rs.on('end', () => {
                            // ws.close();
                            resolve('ok!!!');
                        });
                        // serialPort.on('data', (chunk) => {
                        //     console.log(chunk);
                        // });
                    } else {
                        resolve('Файл не выбран');
                    }
                }).catch(err => {
                    console.log(err);
                    reject('Файл не выбран');
                });
            });
            break;
        case 'EVENT_LOOP':
            eventLoop(args.key);
            break;
        default:
            break;
    }
    return args;
});

const initTest = (dspTestWindow) => {
//    viewTest = dspTestWindow;
    view = dspTestWindow;
    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'DSP_TEST_SCREEN', show: true });
    initSettings();
    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'MODE_DIALOG', show: true, value: mode_measurement_values_table[mode_measurement_index] });
    state = STATE_MODE_DIALOG;


//    view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { screen: 'MODE_DIALOG', show: true, value: mode_measurement_values_table[mode_measurement_index] });
    // state = STATE_MODE_DIALOG;
    // setTimeout(() => {
    //     view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {
    //         screen: 'MEASUREMENT_GRAPHIC',
    //         show: true,
    //         value: mode_measurement_values_table[1],
    //         data: dm.dataModels[mode_measurement_values_table[1]],
    //         action: 'draw-grid'
    //     });
    // }, 3000);
    // state = STATE_MEASUREMENT;
    // mode = MODE_MEASUREMENT_GRAPHIC;

    dsp.dsp_init_test(dm);

    
// События от dsp драйвера
    dsp.dspEmitter.on('dsp-response', args => {
/**
 * TODO
 * - обработать SLIP и CRC - это должен сделать драйвер dsp
 * - эхо на команду - пока распознать и погасить в драйвере dsp
 * - данные измерения. Если совпадает сценарий, то а). добавить данные в модель, б). послать на отрисовку 
 */
        view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', { 
            show: true,
            screen: 'DSP_TEST_SCREEN',
            value: 'DATA_FROM_SERIALPORT',
            data: args
        });
        if (args.dataFromDsp.kf == 0x42){
            // if (['TONE_SIGNAL_MEASUREMENT', 'FREE_CHANNEL_NOISE_MEASUREMENT'].includes(mode_measurement_values_table[mode_measurement_index])) {
            // } else {
                
            // }
            dm.addDataFromDsp(mode_measurement_values_table[mode_measurement_index], args.dataFromDsp);
            if (state === STATE_MEASUREMENT && [MODE_MEASUREMENT_GRAPHIC, MODE_MEASUREMENT_TABLE].includes(mode)){
                view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {
                    show: true,
                    screen: ['MEASUREMENT_GRAPHIC', 'MEASUREMENT_TABLE'][[MODE_MEASUREMENT_GRAPHIC, MODE_MEASUREMENT_TABLE].indexOf(mode)],
                    value: mode_measurement_values_table[mode_measurement_index],
                    data: dm.dataModels[mode_measurement_values_table[mode_measurement_index]], 
                    action: 'draw-data'
                });
            } else if (state == STATE_MEASUREMENT_GRID) {
                view.webContents.send('CONTROLLER_TO_VIEW_MESSAGE', {
                    screen: 'MEASUREMENT_GRID',
                    show: true,
                    value: mode_measurement_values_table[mode_measurement_index],
                    data: dm.dataModels[mode_measurement_values_table[mode_measurement_index]], 
                });
            }
        }
    });
}

module.exports = {
    "init": init,
    "initTest": initTest,
}

