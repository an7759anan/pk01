const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const controller = require ('./controller/controller');

const path = require('path');
let mainWindow;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createMainWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    alwaysOnTop: true,
//    fullscreen: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, '/main_window/index.js'),
    }
  });
  mainWindow.loadFile(path.join(__dirname, '/main_window/index.html'));
};

app.allowRendererProcessReuse=false;

app.on('ready', () => {
  createMainWindow();
  mainWindow.once('ready-to-show', () => {
    controller.init(mainWindow);
  })
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
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
    controller.init();
  }
});
