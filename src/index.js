const os = require('os');
const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const controller = require ('./controller/controller');
const webserver = require('./webserver/webserver');

const path = require('path');
let mainWindow;
let dspTestWindow;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createMainWindow = () => {
  // Create the browser window.
  let _window = new BrowserWindow({
    alwaysOnTop: true,
//    fullscreen: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, '/main_window/index.js'),
    }
  });
  _window.loadFile(path.join(__dirname, '/main_window/index.html'));
  // _window.webContents.openDevTools();
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
      preload: path.join(__dirname, '/dsp_test_window/preload.js'),      
    }
  });
  _window.loadFile(path.join(__dirname, '/dsp_test_window/index.html'));
  // _window.webContents.openDevTools();
  return _window;
};

app.allowRendererProcessReuse=false;

app.on('ready', () => {
  if (os.arch() == 'arm64'){
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