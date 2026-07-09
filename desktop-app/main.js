const { app, BrowserWindow } = require('electron');
const path = require('path');

// Single Instance Lock: prevents opening multiple windows of the game simultaneously
const gotTheLock = app.requestSingleInstanceLock();
let mainWindow;

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  function createGameWindow() {
    mainWindow = new BrowserWindow({
      width: 1280,
      height: 720,
      fullscreen: true,          // Launch in borderless fullscreen mode by default
      frame: true,               // Native fullscreen will hide it automatically and prevent orange border
      autoHideMenuBar: true,     // Hide the Electron menu bar
      backgroundColor: '#050508', // Matches game HUD black canvas color to prevent white flashes
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        devTools: false           // Disable developer tools (Inspect Element / F12)
      }
    });

    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));

    // Disable standard reload/devtools shortcuts to keep it feeling like a native game
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.control && input.key.toLowerCase() === 'r') {
        event.preventDefault();
      }
      if (input.key === 'F12' || input.key === 'F5') {
        event.preventDefault();
      }
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  app.whenReady().then(createGameWindow);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (mainWindow === null) {
      createGameWindow();
    }
  });
}
