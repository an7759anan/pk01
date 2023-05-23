const os = require('os');
const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const controller = require ('./controller/controller');
const webserver = require('./webserver/webserver');
const path = require('path');

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const DSP_TEST_WINDOW_WEBPACK_ENTRY: string;
declare const DSP_TEST_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let mainWindow;
let dspTestWindow;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createMainWindow = (): void => {
  // Create the browser window.
  let _window = new BrowserWindow({
    alwaysOnTop: true,
//    fullscreen: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    }
  });
  // and load the index.html of the app.
  _window.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  _window.webContents.openDevTools();
  return _window;
};

const createDspTestWindow = () => {
  let _window = new BrowserWindow({
//    alwaysOnTop: true,
    fullscreen: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: DSP_TEST_WINDOW_PRELOAD_WEBPACK_ENTRY,      
    }
  });
  _window.loadURL(DSP_TEST_WINDOW_WEBPACK_ENTRY);
  _window.webContents.openDevTools();
  return _window;
};

app.allowRendererProcessReuse=false;

app.on('ready', () => {
  if (false && os.arch() == 'arm64'){
    mainWindow = createMainWindow();
    mainWindow.once('ready-to-show', () => {
      controller.init(mainWindow);
    })
  } else {
//    dspTestWindow = createDspTestWindow();
    dspTestWindow = createMainWindow();
    dspTestWindow.once('ready-to-show', () => {
      controller.initTest(dspTestWindow);
    })
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    if (os.arch() == 'arm64'){
      createMainWindow();
        controller.init();
    } else {
      createDspTestWindow();
    }
  }
});

webserver.init();