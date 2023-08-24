const os = require('os');
const { app, BrowserWindow, screen, Menu, ipcMain } = require('electron');
const controller = require ('./controller/controller');
const webserver = require('./webserver/webserver');

const path = require('path');
let mainWindow;
let dspTestWindow;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createMainWindow = (display) => {
  // Create the browser window.
  let _window = new BrowserWindow({
    alwaysOnTop: true,
   fullscreen: true,
   x: display.bounds.x,
   y: display.bounds.y,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, '/main_window/index.js'),
      // zoomFactor: 1.2
    }
  });
  _window.loadFile(path.join(__dirname, '/main_window/index.html'));
  _window.webContents.openDevTools();
  // console.log('======>',_window.webContents.getZoomFactor(),_window.webContents.getZoomLevel())
  // _window.webContents.setZoomFactor(0.5);
  // _window.webContents.setZoomLevel(1);
  // _window.webContents.getZoomFactor();
  // _window.webContents.zoomFactor = 2.0;
  // _window.webContents.setVisualZoomLevelLimits(1, 5);

  return _window;
};

const createDspTestWindow = (display) => {
  let _window = new BrowserWindow({
//    alwaysOnTop: true,
    fullscreen: false,
    x: display.bounds.x,
    y: display.bounds.y,
     titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, '/dsp_test_window/preload.js'),      
    }
  });
  _window.loadFile(path.join(__dirname, '/dsp_test_window/index.html'));
  // _window.webContents.openDevTools();
  // _window.webContents.setZoomFactor(1.0);
  // _window.webContents.setVisualZoomLevelLimits(1, 5);
  return _window;
};

app.allowRendererProcessReuse=false;

app.on('ready', () => {
  if (os.arch() == 'arm64'){
    const displays = screen.getAllDisplays();
    const mainDisplay = displays.find(d => d.size.width === 800 && d.size.height === 480);
    const testDisplay = displays.find(d => d.size.width !== 800 || d.size.height !== 480);
    mainWindow = createMainWindow(mainDisplay);
    if (testDisplay) dspTestWindow = createDspTestWindow(testDisplay);
    mainWindow.once('ready-to-show', () => {
      // dspTestWindow.once('ready-to-show', () => {
        controller.init(mainWindow, dspTestWindow);
      // });
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