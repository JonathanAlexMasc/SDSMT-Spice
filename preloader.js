const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getAppVersion: () => ipcRenderer.invoke('get-version'),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveCircuit: (data) => ipcRenderer.invoke('save-circuit', data),
  simulateCircuit: (filePath) => ipcRenderer.invoke('simulate-circuit', filePath),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', { filePath, data }),
  saveNetlistToFile: (filePath, netlistString) => ipcRenderer.invoke('save-netlist-to-file', filePath, netlistString),
  checkFileExists: (filePath) => ipcRenderer.invoke('check-file-exists', filePath),
  generateNetlist: (dataForNetlist) => ipcRenderer.invoke('generate-netlist', dataForNetlist),
  savetempFile: (data) => ipcRenderer.invoke('save-temp-circuit', data ),
  loadtempFile: () => ipcRenderer.invoke('load-temp-circuit'),
  sendNetlistToWaveForm: (netlistString) => {
    ipcRenderer.send('send-netlist-to-waveform', netlistString);
  },
  receive: (channel, func) => {
    let validChannels = ['netlist-to-waveform'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  loadBuildPage: () => {
    ipcRenderer.invoke('load-build-page') 
  },
  loadRunPage: () => {
    ipcRenderer.invoke('load-run-page')
  }
});

contextBridge.exposeInMainWorld('electronAPI', {
  zoomIn: () => ipcRenderer.invoke('zoom-in'),
  zoomOut: () => ipcRenderer.invoke('zoom-out'),
})
