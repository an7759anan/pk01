const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
let mainWindow, generatorWindow, debugWindow;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createMainWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();
};

const createGeneratorWindow = () => {
  // Create the browser window.
  generatorWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
  });

  // and load the index.html of the app.
  generatorWindow.loadFile(path.join(__dirname, '/generator/index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

const createDebugWindow = () => {
  debugWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
	nodeIntegration: true,
	contextIsolation: false,
	preload: path.join(__dirname, '/debug_window/index.js'),
    }
  });
  debugWindow.loadFile(path.join(__dirname, '/debug_window/index.html'));

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
//app.on('ready', createWindow);

const createWindows = ()  => {
  createMainWindow();
  createGeneratorWindow();
  createDebugWindow();
}

let template = [{
  label: 'Окно',
  submenu: [{
    label: 'Главное',
    accelerator: 'F1',
    role: 'main',
    click: () => {
      generatorWindow.hide();
      mainWindow.show();
    }
  }, {
    label: 'Генератор и Измеритель',
    accelerator: 'F2',
    role: 'generator',
    click: () => {
      mainWindow.hide();
      generatorWindow.show();
    }
  }, {
    label: 'Служебная связь',
    accelerator: 'F3',
    role: 'service-comm'
  }, {
    label: 'Debugg window',
    accelerator: 'F4',
    role: 'debugg',
    click: () => {
      mainWindow.hide();
      debugWindow.show();
    }
  }]
}];

app.on('ready', () => {
  createWindows();
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
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
 //   createWindow();
    createWindows();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
