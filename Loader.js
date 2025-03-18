if (require('electron-squirrel-startup') === true) app.quit();

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const { updateElectronApp } = require('update-electron-app')

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preloader.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      devTools: true
    },
  });
  win.loadFile('index.html');
  win.maximize();
}

function loadBuildPage() {
  if (win) {
    win.loadFile(path.join(__dirname, 'Build.html'));
  }
}

function loadRunPage() {
  if (win) {
    win.loadFile(path.join(__dirname, 'Waveform.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('get-version', async () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json')));
  return packageJson.version;
});

ipcMain.handle('open-file-dialog', async () => {
  const mainWindow = BrowserWindow.getFocusedWindow();
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ extensions: ['cir', 'spice', 'txt'] }],
  });
  if (!result.canceled) {
    const filePath = result.filePaths[0];
    const fileContent = fs.readFileSync(filePath, 'utf-8'); // Read file content
    return { filePath, fileContent };
  } else {
    return { filePath: null, fileContent: null }; // Return null if dialog was canceled
  }
});

ipcMain.handle('simulate-circuit', async (event, filePath) => {
  return new Promise((resolve, reject) => {
    // Check the platform
    let ngspicePath;

    if (os.platform() === 'darwin') {
      // For macOS, use the Homebrew-installed ngspice
      ngspicePath = '/opt/homebrew/bin/ngspice'; // Adjust for Intel Macs if needed
    } else {
      // For other platforms, use the original ngspice_con.exe
      ngspicePath = path.join(__dirname, 'bin', 'Spice64', 'bin', 'ngspice_con.exe');
    }

    // Construct the command to run ngspice
    const command = `"${ngspicePath}" -b "${filePath}"`;

    console.log(`Executing command: ${command}`);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Execution error: ${error.message}`);
        reject(`Execution error: ${error.message}`);
      } else if (stderr && !stderr.includes('Using SPARSE 1.3 as Direct Linear Solver')) {
        console.error(`Standard error: ${stderr}`);
        reject(`Standard error: ${stderr}`);
      } else {
        resolve(stdout);
      }
    });
  });
});

ipcMain.handle('save-circuit', async (event, circuitData) => {
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: 'circuit.txt',
    filters: [{ name: 'Circuit Files', extensions: ['txt'] }],
  });

  if (filePath) {
    try {
      // Prepare circuit data to save
      const dataToSave = JSON.stringify(circuitData, null, 2);

      // Write data to file
      fs.writeFileSync(filePath, dataToSave);
      console.log(`File saved successfully at ${filePath}`);
      return { success: true, filePath };
    } catch (error) {
      console.error(`Failed to save file: ${error.message}`);
      return { success: false, error: error.message };
    }
  } else {
    return { success: false, error: 'File save operation cancelled.' };
  }
});

ipcMain.handle('read-file', (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return data;
  } catch (error) {
    throw new Error(`Error reading file: ${error.message}`);
  }
});

ipcMain.handle('write-file', (event, { filePath, data }) => {
  try {
    fs.writeFileSync(filePath, data, 'utf8');
  } catch (error) {
    throw new Error(`Error writing file: ${error.message}`);
  }
});

ipcMain.handle('generate-netlist', async (event, dataForNetlist) => {
  const win = BrowserWindow.getAllWindows()[0]; // Assuming there's only one window
  win.webContents.send('generate-netlist', dataForNetlist);
  return { success: true };
});

ipcMain.on('send-netlist-to-waveform', (event, netlistString) => {
  win.webContents.once('did-finish-load', () => {
    win.webContents.send('netlist-to-waveform', netlistString);
  });
  win.loadFile('WaveForm.html');
});

ipcMain.handle('save-netlist-to-file', (event, filePath, netlistString) => {
  try {
    fs.writeFileSync(filePath, netlistString);
    return true; // Successfully saved
  } catch (err) {
    console.error('Error saving netlist to file:', err);
    return false; // Failed to save
  }
});

ipcMain.handle('check-file-exists', (event, filePath) => {
  return fs.existsSync(filePath);
});

const tempFilePath = "Files/temp.txt";

ipcMain.handle('save-temp-circuit', async (event, circuitData) => {
  try {
    // Ensure the directory exists
    const dirPath = path.dirname(tempFilePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Ensure the temp file exists
    if (!fs.existsSync(tempFilePath)) {
      fs.writeFileSync(tempFilePath, '{}'); // Initialize with an empty JSON object
    }

    // Write circuit data
    const dataToSave = JSON.stringify(circuitData, null, 2);
    fs.writeFileSync(tempFilePath, dataToSave);
    console.log("Circuit saved automatically before simulation.");
    return { success: true };
  } catch (error) {
    console.error("Failed to save circuit:", error.message);
    return { success: false, error: error.message };
  }
});


ipcMain.handle('load-temp-circuit', async () => {
  try {
      const data = fs.readFileSync(tempFilePath, 'utf8');
      return data;
    } catch (error) {
      throw new Error(`Error reading file: ${error.message}`);
    }
});


// Zoom In functionality
ipcMain.handle('zoom-in', (event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    const webContents = win.webContents;
    let zoomLevel = webContents.getZoomLevel();
    zoomLevel += 0.5; // Increase zoom by 0.5
    webContents.setZoomLevel(zoomLevel);
  }
});

// Zoom Out functionality
ipcMain.handle('zoom-out', (event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    const webContents = win.webContents;
    let zoomLevel = webContents.getZoomLevel();
    zoomLevel -= 0.5; // Decrease zoom by 0.5
    webContents.setZoomLevel(zoomLevel);
  }
});

ipcMain.handle('load-build-page', async (event) => {
  console.log("Loading build page");
  // Load the Build page
  loadBuildPage();
});

ipcMain.handle('load-run-page', async (event) => {
  console.log("Loading run page");
  // Load the Run page
  loadRunPage();
});

updateElectronApp()