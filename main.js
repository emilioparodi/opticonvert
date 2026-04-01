const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

if (process.platform === 'darwin') {
  const iconPath = path.join(__dirname, 'build-assets', 'icon.icns');
  if (fs.existsSync(iconPath)) {
    app.dock.setIcon(iconPath);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    icon: path.join(__dirname, 'build-assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, 
    },
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    backgroundColor: '#00000000'
  });

  win.loadFile(path.join(__dirname, 'dist/app/browser/index.html'));
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(createWindow);
}

ipcMain.handle('select-folder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Seleziona cartella di destinazione',
    properties: ['openDirectory', 'createDirectory'],
    buttonLabel: 'Seleziona Cartella'
  });
  
  if (canceled) return null;
  return filePaths[0];
});

ipcMain.handle('convert-image', async (event, { filePath, format, quality, targetFolder }) => {
  try {
    if (!filePath) throw new Error("File path not received");

    let outputPath;

    if (targetFolder) {
      const fileName = path.basename(filePath, path.extname(filePath));
      outputPath = path.join(targetFolder, `${fileName}_optimized.${format}`);
    } 
    else {
      const originalExt = path.extname(filePath);
      const fileName = path.basename(filePath, originalExt);

      const { filePath: selectedPath, canceled } = await dialog.showSaveDialog({
        title: 'Save optimized image',
        defaultPath: path.join(app.getPath('downloads'), `${fileName}_optimized.${format}`),
        filters: [{ name: 'Images', extensions: [format] }],
        buttonLabel: 'Convert and Save'
      });

      if (canceled || !selectedPath) {
        return { success: false, error: 'Save cancelled by user' };
      }
      outputPath = selectedPath;
    }

    await sharp(filePath)
      [format]({ quality: parseInt(quality) })
      .toFile(outputPath);

    const stats = fs.statSync(outputPath);

    return {
      success: true,
      outputPath: outputPath,
      fileName: path.basename(outputPath),
      size: stats.size
    };
  } catch (error) {
    console.error('Conversion error in Main Process:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.on('open-folder', (event, filePath) => {
  if (filePath) {
    shell.showItemInFolder(filePath);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});