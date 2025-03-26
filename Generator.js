
var numPoints = 500;
var valid = -1;
// Generate initial sine wave data
var xData = [];
var yData = [];
var dx = 2 * Math.PI / numPoints;
var plotType = 'ACSweep';
let controlSwitch = false;
let RawData = '';
var VoltName = '';
const maxPoints = 7000;

let originalWaveForm = '';
let nodeValMap = new Map();
let nodeValCurrMap = new Map();

// Variables for each analysis type
var startFreq = 1, endFreq = 10000, SimNumPoints = 500; // AC Sweep
var startVolt = 0, endVolt = 5, step = 0.1; // DC Sweep
var startTime = 1, stopTime = 5, timeStep = 0.1; // Transient


const controlSection = '';

const chartOptions = {
  responsive: true,
  scales: {
    x: {
      type: 'linear', // Main chart x-axis is linear
      position: 'bottom',
      title: {
        display: true,
        text: 'Frequency (Hz)'
      }
    },
    'x-axis-2': {
      type: 'logarithmic', // Logarithmic scale for the new datasets
      position: 'bottom',
      title: {
        display: true,
        text: 'Frequency (Hz)'
      },
      ticks: {
        callback: function(value) {
          return value.toExponential(1); // Optional: format ticks as scientific notation
        }
      }
    },
    y: {
      type: 'linear', // Linear scale for the Y-axis
      position: 'left',
      title: {
        display: true,
        text: 'Amplitude (V)'
      }
    }
  }
};



for (var i = 0; i < numPoints; i++) {
    xData.push(i * dx);
    yData.push(Math.sin(i * dx));
}

var amplitude = 1;
var frequency = 1;
var dcOff = 0;
var selectedShape = 'SINE';

let existingChart;
let chartinitializer = false;

var ctx = document.getElementById('chartCanvas').getContext('2d');

var chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [], // Start empty
      datasets: [{
          label: 'Signal In',
          data: [],
          borderColor: 'blue',
          fill: false
      }]
  },
    options: {
      maintainAspectRatio: false,
        scales: {
            x: {
                type: 'linear',
                title: {
                    display: true,
                    text: 'Frequency (Hz)'
                }
            },
            y: {
                type: 'linear',
                title: {
                    display: true,
                    text: 'Amplitude (V)'
                }
            }
        }
    }
  });


function addPlotOption(plotname) {
  var plotSelect = document.getElementById("plotSelect");
  var newOption = document.createElement("option");
  newOption.value = plotname;
  newOption.text = plotname;
  plotSelect.appendChild(newOption);
}

function updateAxisScale(selectedPlot, selectedAxis, selectedScale) {
  // Find the dataset configuration for the selected plot
  var dataset = selectedPlot;
  if(selectedPlot === 'Signal In') {
    dataset = chart.data.datasets[0];
  }
  if(selectedPlot === 'ngspice Output') {
    dataset = chart.data.datasets[1];
  }

  // Update the axis type based on selected axis (x or y)
  if (selectedAxis === 'x') {
      dataset.xAxisType = selectedScale;
  } else if (selectedAxis === 'y') {
      dataset.yAxisType = selectedScale;
  }

  // Update the chart's axis scale options
  if (chart && chart.options && chart.options.scales) {
      if (selectedAxis === 'x') {
          chart.options.scales.x.type = selectedScale;
      } else if (selectedAxis === 'y') {
          chart.options.scales.y.type = selectedScale;
      }

      // Update the chart
      chart.update();
  }
}

// Utility function to generate random color for each dataset
function getRandomColor(index) {
  const colors = [
    'rgb(255, 99, 132)',
    'rgb(54, 162, 235)',
    'rgb(255, 206, 86)',
    'rgb(75, 192, 192)',
    'rgb(153, 102, 255)',
    'rgb(255, 159, 64)',
    'rgb(255, 99, 71)', 
    'rgb(34, 193, 195)', 
    'rgb(253, 187, 45)',
    'rgb(255, 99, 132)'
  ];
  return colors[index % colors.length];
}


function syncSliderAndInput(slider, input) {
    slider.addEventListener('input', () => {
        input.value = slider.value;
    });
    input.addEventListener('input', () => {
        slider.value = input.value;
    });
}

function updateGraphVals() {
  if (!chart || !chart.data.datasets.length) {
      console.warn("Chart not initialized or datasets missing.");
      return;
  }

  yData = xData.map(function(x) {
      switch (selectedShape) {
          case 'SINE':
              return amplitude * Math.sin(x * frequency + dcOff);
          case 'SQUARE':
              return amplitude * (x % (2 * Math.PI) < Math.PI ? 1 : -1);
          case 'TRIANGLE':
              var phase = (x * frequency + dcOff) * Math.PI / (frequency / 2);
              return 2 * amplitude / Math.PI * Math.abs((((phase % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI)) - Math.PI) - amplitude;
          case 'SAWTOOTH':
              var phase = (x * frequency + dcOff) / (2 * frequency);
              return amplitude * (phase - Math.floor(phase));
          default:
              return amplitude * Math.sin(x * frequency + dcOff);
      }
      
  });
  chart.data.datasets[0].data = yData;
  chart.update();
}
function LinkAmplitude(slider, input) {

  slider.addEventListener('input', function() {
    amplitude = this.value;
  });

  input.addEventListener('input', function() {
    amplitude = this.value;
  })
  updateGraphVals();
}

function EditCircuit() {
  sessionStorage.setItem("loadCircuit", "true");
  window.location.href = "Build.html";
}

function linkFrequency(slider, input) {

  slider.addEventListener('input', function() {
    frequency = this.value;
  });

  input.addEventListener('input', function() {
    frequency = this.value;
  })
  updateGraphVals();
}

function linkDCoffset(slider, input) {

  slider.addEventListener('input', function() {
    dcOff = this.value;
  });

  input.addEventListener('input', function() {
    dcOff = this.value;
  })
  updateGraphVals();
}

function validateNetlist(netlist) {
  netlist = netlist.trim();
  // Check for --partial at the start of the netlist
  console.log(netlist);
  if (netlist.startsWith('--partial')) {
    console.log("Partial netlist detected");
    return 0;
  }

  // Check for the presence of .control, .endc, and .end lines in the netlist
  const controlPresent = netlist.includes('.control');
  const endcPresent = netlist.includes('.endc');
  const endPresent = netlist.includes('.end');

  if (controlPresent && endcPresent && endPresent) {
    console.log("Netlist is valid.");
    return 1;
  }

  // If none of the conditions match, return -1 for invalid
  console.log("Netlist is not valid.");
  return -1;
}

async function readFile(filePath) {
  try {
    const data = await window.electron.readFile(filePath);
    return data;
  } catch (error) {
    throw new Error(`Error reading file: ${error.message}`);
  }
}

async function writeFile(filePath, data) {
  try {
    await window.electron.writeFile(filePath, data);
  } catch (error) {
    throw new Error(`Error writing file: ${error.message}`);
  }
}

function makeControlSection() {
  let ctrlSection = '';
  ctrlSection += '.control\n';

  switch (plotType) {
    case 'ACSweep':
      ctrlSection += `ac dec ${SimNumPoints} ${startFreq} ${endFreq} \n`;
      break;
    case 'DCSweep':
      ctrlSection += `dc ${VoltName} ${startVolt} ${endVolt} ${step}\n`;
      break;
    case 'Transient':
      ctrlSection += `tran ${timeStep} ${stopTime} ${startTime}\n`;
      break;
    case 'DC OP':
      ctrlSection += `op\n`;
      ctrlSection += `print all\n`;
      break;
  }

  return ctrlSection;
}

function makePrintLines(voltProbes, currentProbes, controlSectionSwitch) {
  let printLines = '';
  if (controlSectionSwitch) {
    
    nodeValMap.forEach((_, nodeVal) => {  // We don't need the value, just the key (nodeVal)
      switch (plotType) {
        case 'ACSweep':
          printLines += `print vdb(${nodeVal})\n`;
          break;
        case 'DCSweep':
          printLines += `print v(${nodeVal})\n`;
          break;
        case 'Transient':
          printLines += `print v(${nodeVal})\n`;
          break;
        case 'DC OP':
          printLines += `print all\n`;
          break;
      }
    });

    nodeValCurrMap.forEach((_, nodeVal) => {  // We don't need the value, just the key (nodeVal)
      printLines += `print i(${nodeVal})\n`;
    });
    return printLines;
  }
  else if (!controlSectionSwitch) {
    switch (plotType) {
      case 'ACSweep':
        //volt probes
        for (let i = 0; i < voltProbes.length; i += 2) {
          if (voltProbes[i] == 0) {
            printLines += `print vdb(${voltProbes[i + 1]})\n`;
          } else if (voltProbes[i + 1] == 0) {
            printLines += `print vdb(${voltProbes[i]})\n`;
          } else if (voltProbes[i] != 0 && voltProbes[i + 1] != 0) {
            printLines += `print vdb(${voltProbes[i]})\n`;
            printLines += `print vdb(${voltProbes[i + 1]})\n`;
          }
        }
        //current probes
        for (let i = 0; i < currentProbes.length; i += 2) {
          if (currentProbes[i] == 0) {
            //cant be 0
            console.log("Current probe is 0, do not add");
          }
          else {
            printLines += `print i(${currentProbes[i]})\n`;
          }
        }
        break;
      case 'DCSweep':
        for (let i = 0; i < voltProbes.length; i += 2) {
          if (voltProbes[i] == 0) {
            printLines += `print v(${voltProbes[i + 1]})\n`;
          } else if (vProbes[i + 1] == 0) {
            printLines += `print v(${voltProbes[i]})\n`;
          } else if (voltProbes[i] != 0 && voltProbes[i + 1] != 0) {
            printLines += `print v(${voltProbes[i]})\n`;
            printLines += `print v(${voltProbes[i + 1]})\n`;
          }
        }
        //console.log("DC SWEEP.");
        break;
      case 'Transient':
        for (let i = 0; i < voltProbes.length; i += 2) {
          if (voltProbes[i] == 0) {
            printLines += `print v(${voltProbes[i + 1]})\n`;
          } else if (voltProbes[i + 1] == 0) {
            printLines += `print v(${voltProbes[i]})\n`;
          } else if (voltProbes[i] != 0 && voltProbes[i + 1] != 0) {
            printLines += `print v(${voltProbes[i]})\n`;
            printLines += `print v(${voltProbes[i + 1]})\n`;
          }
        } 
        //console.log("Transient, add volt probes as v() or vr()");
        break;
      case 'DC OP':
        printLines += `print all\n`;
        //console.log("DC OP");
        break;
    }
    return printLines;
  }
  
}


async function ModifyNetlist(filePath) {
  try {
    // Read the file content
    const waveFormToggle = document.getElementById('toggleWaveform');
    let toggleWave = waveFormToggle.checked;
    let existingContent = await readFile(filePath);

    let probeLines = [];

    if(existingContent.includes('.control')){
      //control section already made
      //save nodes inside print lines
      //remove control section

      // Regex to find print lines (e.g., print vdb(1,2), print v(3,4) or print all)
      const printRegex = /^\s*print.*$/gm;  
      const printLines = existingContent.match(printRegex);

      // Find all print lines and store them in a map called nodeValMap
      printLines.forEach(line => {
        if (line.startsWith('print v')) {
          let nodeVal = line.split('(')[1].split(')')[0];
          nodeValMap.set(nodeVal, line);
        }
      });

      printLines.forEach(line => {
        if (line.startsWith('print vdb')) {
          let nodeVal = line.split('(')[1].split(')')[0];
          nodeValMap.set(nodeVal, line);
        }
      });

      printLines.forEach(line => {
        if (line.startsWith('print i')) {
          let nodeVal = line.split('(')[1].split(')')[0];
          nodeValCurrMap.set(nodeVal, line);
        }
      })

      existingContent = existingContent.replace(/\.control[\s\S]*/m, '');




      controlSwitch = true;
    }

    


    const lines = existingContent.split('\n');

    for (let line of lines) {
      let parts = line.trim().split(/\s+/); // Split by spaces/tabs
      if (parts.length > 1 && parts[0].match(/^[Vv][A-Za-z0-9]*$/)) {
          VoltName = parts[0]; // The first part is the voltage source name
          break;
      }
  }

  //This gives us .control
  //+ simulation type
  let controlSection = makeControlSection();


  // Remove --partial line, replace it with modified netlist
  existingContent = existingContent.replace(/^\s*--partial\s*[\r\n]*/m, 'Modified Netlist \n');

  //==========================================================================================================
  //FOR WAVEFORM INPUT, DO NOT TOUCH UNTIL READY
  //==========================================================================================================
  if (toggleWave) {
    const waveformRegex = /(SINE|SQUARE|TRIANGLE|SAWTOOTH)\s*\(\s*[\d.+-]+\s+[\d.+-]+\s+[\d.+-]+k\s*\)/;
    if (originalWaveForm == '') {
      const match = updatedContent.match(waveformRegex);
      originalWaveForm = match ? match[0] : "";  // Save original if found, otherwise empty
      console.log("Original Waveform:", originalWaveForm);
    }

    let newWaveform = toggleWave ? `${selectedShape} (${dcOff} ${amplitude} ${frequency}k)` : originalWaveForm;
    existingContent = existingContent.replace(waveformRegex, newWaveform);
    existingContent = existingContent.trim();
  }
  //==========================================================================================================

  // Extract probe lines
  lines.forEach(line => {
    if (line.trim().startsWith('.probe')) {
      // Extract the probe target and add to probeLines array
      const probeContent = line.trim().replace(".probe", "").trim();
      probeLines.push(probeContent);
    }
  });

  let vProbes = [];
  let iProbes = [];
  let printString = "";

// Separate voltage (V) and current (I) probes
    probeLines.forEach(probe => {
    if (probe.startsWith("V(")) {
      vProbes.push(probe.match(/\d+/g)[0]); // Extract just the number
    } else if (probe.startsWith("I(")) {
      iProbes.push(probe);
    }
  });

printString = makePrintLines(vProbes, iProbes, controlSwitch);

// Add current probes as individual .print lines

// Remove existing .probe lines
existingContent = existingContent.replace(/^\s*\.probe.*$/gm, '');

//append print lines to control section
controlSection += printString + "\n";

controlSection += '\n.endc\n';
let finalContent = existingContent + controlSection;

finalContent += '\n.end\n';

finalContent = finalContent.trim();

console.log(finalContent);


// Change the file extension to .cir
const newFilePath = filePath.replace(/\.[^/.]+$/, ".cir");

// Write the modified content back to the new file
await writeFile(newFilePath, finalContent);
return newFilePath;
} catch (error) {
  console.error('Error modifying netlist:', error);
}   
}

function showWaveform() {
  chart.data.labels = xData;
  chart.data.datasets[0].data = yData;
  chart.update();
}

// Function to hide waveform
function hideWaveform() {
  chart.data.labels = [];
  chart.data.datasets[0].data = [];
  chart.update();
}


// Initialize syncing for each slider and input pair
document.addEventListener('DOMContentLoaded', async () => {

  const toggleWaveform = document.getElementById('toggleWaveform');
  

  let waveFormEnable = toggleWaveform.checked; // Initialize with current state 

  toggleWaveform.addEventListener('change', () => {

    const FP = document.getElementById('simulateButton').dataset.filePath;
    ModifyNetlist(FP);
      waveFormEnable = toggleWaveform.checked; // Update the variable

      if (waveFormEnable) {
          showWaveform();
      } else {
          hideWaveform();
      }

      console.log("Waveform Enabled:", waveFormEnable); // Debugging log
  });


  const outputChooser = document.getElementById('OutType');
  const customContainer = document.getElementById('Custom_Container');


  function updateFields(selectedOutput) {
    customContainer.innerHTML = ''; // Clear previous content

    switch (selectedOutput) {
      case 'ACSweep':
        customContainer.innerHTML = `
          <label for="startFreq">Start Frequency:</label>
          <input type="number" id="startFreq" value="${startFreq}" placeholder="Enter start frequency">
          <label for="stopFreq">Stop Frequency:</label>
          <input type="number" id="stopFreq" value="${endFreq}" placeholder="Enter stop frequency">
          <label for="points">Points:</label>
          <input type="number" id="points" value="${SimNumPoints}" placeholder="Enter points">
        `;
        document.getElementById('startFreq').addEventListener('input', (e) => startFreq = parseFloat(e.target.value));
        document.getElementById('stopFreq').addEventListener('input', (e) => endFreq = parseFloat(e.target.value));
        document.getElementById('points').addEventListener('input', (e) => numPoints = parseInt(e.target.value));
        plotType = 'ACSweep';
        break;

      case 'DCSweep':
        customContainer.innerHTML = `
          <label for="startVolt">Start Voltage:</label>
          <input type="number" id="startVolt" value="${startVolt}" placeholder="Enter start voltage">
          <label for="stopVolt">Stop Voltage:</label>
          <input type="number" id="stopVolt" value="${endVolt}" placeholder="Enter stop voltage">
          <label for="step">Step Size:</label>
          <input type="number" id="step" value="${step}" placeholder="Enter step size">
        `;
        document.getElementById('startVolt').addEventListener('input', (e) => startVolt = parseFloat(e.target.value));
        document.getElementById('stopVolt').addEventListener('input', (e) => endVolt = parseFloat(e.target.value));
        document.getElementById('step').addEventListener('input', (e) => step = parseFloat(e.target.value));
        plotType = 'DCSweep';
        break;

      case 'Transient':
        customContainer.innerHTML = `
          <label for="startTime">Start Time:</label>
          <input type="number" id="startTime" value="${startTime}" placeholder="Enter start time">
          <label for="stopTime">Stop Time:</label>
          <input type="number" id="stopTime" value="${stopTime}" placeholder="Enter stop time">
          <label for="timeStep">Time Step:</label>
          <input type="number" id="timeStep" value="${timeStep}" placeholder="Enter time step">
        `;
        document.getElementById('startTime').addEventListener('input', (e) => startTime = parseFloat(e.target.value));
        document.getElementById('stopTime').addEventListener('input', (e) => stopTime = parseFloat(e.target.value));
        document.getElementById('timeStep').addEventListener('input', (e) => timeStep = parseFloat(e.target.value));
        plotType = 'Transient';
        break;

      case 'DC OP':
        customContainer.innerHTML = `<p>No additional fields are required for DC OP.</p>`;
        plotType = 'DC OP';
        break;
    }
  }

  // Update fields when the selection changes
  outputChooser.addEventListener('change', function () {
    const selectedOutput = this.value;
    updateFields(selectedOutput);
  });

  // Simulate a change event to initialize fields for the default option
  updateFields(outputChooser.value);
  
  /**
   * Adds input fields dynamically to the Custom_Container.
   * @param {Array} fields - Array of objects with label, name, and placeholder for each field.
   */
  function addInputFields(fields) {
    fields.forEach(field => {
      const fieldContainer = document.createElement('div');
      fieldContainer.className = 'field-container';
  
      const label = document.createElement('label');
      label.textContent = field.label;
      label.htmlFor = field.name;
  
      const input = document.createElement('input');
      input.type = 'text';
      input.name = field.name;
      input.placeholder = field.placeholder;
  
      fieldContainer.appendChild(label);
      fieldContainer.appendChild(input);
      customContainer.appendChild(fieldContainer);
    });
  }
  

  var validSim = document.getElementById('simulateButton');
  validSim.classList.remove('valid');
  validSim.classList.add('invalid');
  validSim.disabled = true;

  const netlistPath = './Files/netlist.cir';
  
  const fileExists = window.electron.checkFileExists(netlistPath);
  
  if (fileExists) { // File exists
    const netlistContent = await readFile(netlistPath);
    let isValidNetlist = validateNetlist(netlistContent);
    document.getElementById('fileHolder').textContent = 'netlist.cir';
    document.getElementById('simulateButton').dataset.filePath = netlistPath;
    if (isValidNetlist == 1) {

      //console.log('Netlist is valid.');
      valid = 1;
      simulateButton.classList.remove('invalid');
      simulateButton.classList.add('valid');
      simulateButton.disabled = false;
      // Proceed with further actions if needed
    } else if(isValidNetlist == -1) {
      //console.log('Netlist is not valid.');
      simulateButton.classList.remove('valid');
      simulateButton.classList.add('invalid');
      simulateButton.disabled = true;
      valid = -1;
      // Handle invalid netlist case
    }
    else if(isValidNetlist == 0) {
      //console.log('Netlist is partial.');
      simulateButton.classList.remove('invalid');
      simulateButton.classList.add('valid');
      simulateButton.disabled = false;
      valid = 0;
      // Handle partial netlist case
    }
  } else {
    console.log('Netlist file does not exist, skipping initialization.');
  }

  document.getElementById('viewData').addEventListener('click', saveOutput);

  document.getElementById('loadButton').addEventListener('click', async () => {

    const { filePath, fileContent } = await window.electron.openFileDialog();
    if (filePath) {

      const fileName = filePath ? filePath.split('\\').pop().split('/').pop() : 'No file selected';
      document.getElementById('fileHolder').textContent = fileName;
      document.getElementById('simulateButton').dataset.filePath = filePath;
      var isValidNetlist = validateNetlist(fileContent);

      const simulateButton = document.getElementById('simulateButton');

      if (isValidNetlist === 1) {

            //console.log('Netlist is valid.');
        valid = 1;
        simulateButton.classList.remove('invalid');
        simulateButton.classList.add('valid');
        simulateButton.disabled = false;
            // Proceed with further actions if needed
      } else if(isValidNetlist === -1) {
            //console.log('Netlist is not valid.');
        simulateButton.classList.remove('valid');
        simulateButton.classList.add('invalid');
        simulateButton.disabled = true;
        valid = -1;
            // Handle invalid netlist case
      }
      else if(isValidNetlist === 0) {
            //console.log('Netlist is partial.');
        simulateButton.classList.remove('invalid');
        simulateButton.classList.add('valid');
        simulateButton.disabled = false;
        valid = 0;
            // Handle partial netlist case
      }
    }
  });
      
  document.getElementById('simulateButton').addEventListener('click', async () => {
    const filePath = document.getElementById('simulateButton').dataset.filePath;
    if (filePath) {
      const content = await readFile(filePath);

      const validNetlist = validateNetlist(content); // Call the validateNetlist function to check the validity of the netlist

      let outPutType = document.getElementById('OutSelector').value;

      if (validNetlist === 1) {
        try {
          ModifyNetlist(filePath);
          let cleanedOutput = '';
          const output = await window.electron.simulateCircuit(filePath);
          let rawOutput = output
          RawData = rawOutput;
          console.log(rawOutput);
          switch (plotType) {
            case 'Transient':
              cleanedOutput = parseTransData(rawOutput);
              if(outPutType == 'Table') {
                console.log('Table');
                GenerateTransientTable(cleanedOutput);
              }
              else if(outPutType == 'Graph') {
                console.log('Graph');
                plotTransient(cleanedOutput); //graph
              }
              break;
            case 'ACSweep':
              //restoreGraph();
              cleanedOutput = parseACSweepData(rawOutput);
              if(outPutType == 'Table') {
                console.log('Table');
                GenerateACSweepTable(cleanedOutput);
              }
              else if(outPutType == 'Graph') {
                console.log('Graph');
                plotACSweep(cleanedOutput); //graph
              }
              break;
            case 'DC OP':
              cleanedOutput = parseDCOPData(rawOutput);
              if(outPutType == 'Table') {
                console.log('Table');
                plotDCOP(cleanedOutput); //table
              }
              else if(outPutType == 'Graph') {
                alert("DC OP Graph not supported, please use table output instead");
              }
              break;
            case 'DCSweep':
              //restoreGraph();
              cleanedOutput = parseDCData(rawOutput);
              if(outPutType == 'Table') {
                console.log('Table');
                GenerateDCSweepTable(cleanedOutput);
              }
              else if(outPutType == 'Graph') {
                console.log('Graph');
                plotDCSweep(cleanedOutput); //unknown
              }
              break;
          }
        } catch (error) {
          // Display the error in a popup
          alert(`Error from ngspice: ${error.message || error}`);
        }
        return;
      } else if (validNetlist === 0) {
        ModifyNetlist(filePath);
        try {
          let cleanedOutput = '';
          const output = await window.electron.simulateCircuit(filePath);
          let rawOutput = output
          RawData = rawOutput;
          switch (plotType) {
            case 'Transient':
              cleanedOutput = parseTransData(rawOutput);
              if(outPutType == 'Table') {
                console.log('Table');
                //MakeTranTable(cleanedOutput);
              }
              else if(outPutType == 'Graph') {
                console.log('Graph');
                plotTransient(cleanedOutput); //graph
              }
              break;
            case 'ACSweep':
              //restoreGraph();
              cleanedOutput = parseACSweepData(rawOutput);
              if(outPutType == 'Table') {
                console.log('Table');
                //MakeACTable(cleanedOutput);
              }
              else if(outPutType == 'Graph') {
                console.log('Graph');
                plotACSweep(cleanedOutput); //graph
              }
              break;
            case 'DC OP':
              cleanedOutput = parseDCOPData(rawOutput);
              if(outPutType == 'Table') {
                console.log('Table');
                plotDCOP(cleanedOutput); //table
                //MakeDCOPTable(cleanedOutput);
              }
              else if(outPutType == 'Graph') {
                alert("DC OP Graph not supported, please use table output instead");
              }
              break;
            case 'DCSweep':
              //restoreGraph();
              cleanedOutput = parseDCData(rawOutput);
              if(outPutType == 'Table') {
                console.log('Table');
                //MakeDCSweepTable(cleanedOutput);
              }
              else if(outPutType == 'Graph') {
                console.log('Graph');
                plotDCSweep(cleanedOutput); //unknown
              }
              break;
          }
        } catch (error) {
          // Display the error in a popup
          alert(`Error from ngspice: ${error.message || error}`);
        }

        return;
      } else {
        alert('Netlist is not valid. Please load a valid file.');
      }
    } else {
      alert('Please load a file first.');
    }
  });


  var axisRadios = document.querySelectorAll('input[type=radio][name=axisSelector]');
  axisRadios.forEach(function(radio) {
    radio.addEventListener('change', function() {
        var selectedAxis = this.value; // 'x' or 'y'
        var selectedScale = document.querySelector('input[type=radio][name=scaleSelector]:checked').value; // Get selected scale
        var selectedPlot = document.getElementById('plotSelect').value;
        // Update axis scale on chart (you need to implement this)
        updateAxisScale(selectedPlot,selectedAxis, selectedScale);
    });
    });

    document.getElementById('plotSelect').addEventListener('change', function() {
      var selectedPlot = this.value;
  });

    // Event listener for scale selection (radio buttons)
    var scaleRadios = document.querySelectorAll('input[type=radio][name=scaleSelector]');
    scaleRadios.forEach(function(radio) {
        radio.addEventListener('change', function() {

          var selectedAxis = document.querySelector('input[type=radio][name=axisSelector]:checked').value; // Get selected axis
          var selectedScale = this.value; // 'linear' or 'log'
          var selectedPlot = document.getElementById('plotSelect').value;
            // Update axis scale on chart (you need to implement this)
          updateAxisScale(selectedPlot,selectedAxis, selectedScale);
        });
        });

    const slider1 = document.getElementById('slider1');
    const input1 = document.getElementById('input1');
    syncSliderAndInput(slider1, input1);
    LinkAmplitude(slider1, input1);

    const slider2 = document.getElementById('slider2');
    const input2 = document.getElementById('input2');
    syncSliderAndInput(slider2, input2);
    linkFrequency(slider2, input2);

    const slider3 = document.getElementById('slider3');
    const input3 = document.getElementById('input3');
    syncSliderAndInput(slider3, input3);
    linkDCoffset(slider3, input3);

    document.getElementById('waveSelect').addEventListener('change', function() {
      selectedShape = this.value;
      updateGraphVals();
    })
    
});

async function saveOutput(SaveBtn) {
  try {
    let outputToFile = RawData;
    if(SaveBtn) {
      const response = await window.electron.SaveRawOutput(outputToFile);
      if (response && response.message) {
        alert(response.message);
      }
    }
  } catch (error) {
    console.error("Error saving circuit:", error);
    alert("An error occurred while saving the circuit.");
  }

}


function restoreGraph() {
  const outputDiv = document.getElementById("output");

  // Clear any existing table
  outputDiv.innerHTML = "";

  // Recreate the graph container and canvas
  const graphContainer = document.createElement("div");
  graphContainer.className = "graph-container";

  const canvas = document.createElement("canvas");
  canvas.id = "chartCanvas";

  graphContainer.appendChild(canvas);
  outputDiv.appendChild(graphContainer);
}



function parseTransData(output) {
  console.log(output);
  const lines = output.split('\n');
  let parseData = false;
  let headers = []; // Store column labels
  let dataStore = []; // Store all parsed sections
  let infoStorage = {
      'time': [],
      'value': []
  }; // Store data dynamically

  for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Start parsing after "Transient Analysis"
      if (line.startsWith('Transient Analysis')) {
          parseData = true;
          continue;
      }

      // Skip irrelevant lines
      if (!parseData || line === "" || line.startsWith('Warning') || line.startsWith('---')) {
          continue;
      }

      // Detect header row (line with "Index" and signal names)
      if (line.startsWith("Index")) {
          const newHeaders = line.split(/\s+/).slice(1).filter(header => header.toLowerCase() !== 'time');
          newHeaders.forEach(header => {
              if (!headers.includes(header)) {
                  headers.push(header);
              }
          });
          continue;
      }

      // Parse numerical data
      const parts = line.split(/\s+/).filter(part => part !== ''); 

      if (parts.length === 3) { // Ensure sufficient data in the line
          const index = parseInt(parts[0], 10); // First column is index
          const time = parseFloat(parts[1]); // Second column is time
          const value = parseFloat(parts[2]); // Third column is value

          if (!isNaN(index) && !isNaN(time) && !isNaN(value)) {
              if (index === 0 && infoStorage.time.length > 0) {
                  // Assign header to the section before storing
                  let assignedHeader = headers[dataStore.length] || `Unknown-${dataStore.length}`;
                  dataStore.push({ header: assignedHeader, data: { ...infoStorage } });

                  console.log("Stored Section:", assignedHeader, infoStorage);
                  
                  // Reset infoStorage for the next section
                  infoStorage = { 'time': [], 'value': [] };
              }

              infoStorage.time.push(time);
              infoStorage.value.push(value);
          }
          continue;
      }

      // If a 'Note' line is found, store the last section
      if (line.startsWith('Note')) {
          if (infoStorage.time.length > 0) {
              let assignedHeader = headers[dataStore.length] || `Unknown-${dataStore.length}`;
              dataStore.push({ header: assignedHeader, data: { ...infoStorage } });

              console.log("Stored Section:", assignedHeader, infoStorage);
          }
          infoStorage = { 'time': [], 'value': [] };
          continue;
      }
  }

  // Ensure the last section is stored
  if (infoStorage.time.length > 0) {
      let assignedHeader = headers[dataStore.length] || `Unknown-${dataStore.length}`;
      dataStore.push({ header: assignedHeader, data: { ...infoStorage } });

      console.log("Stored Final Section:", assignedHeader, infoStorage);
  }

  //console.log("Final Parsed Data:", dataStore);
  return dataStore;
}


function parseDCData(output) {
  console.log(output);
  const lines = output.split('\n');
  let parseData = false;
  let headers = []; // Store column labels
  let dataStore = []; // Store all parsed sections
  let infoStorage = {
      'v-sweep': [],
      'value': []
  }; // Store data dynamically

  for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Start parsing after detecting "DC transfer characteristic"
      if (line.includes('DC transfer characteristic')) {
          parseData = true;
          continue;
      }

      // Skip irrelevant lines
      if (!parseData || line === "" || line.startsWith('Warning') || line.startsWith('---') || line.startsWith('No. of Data Rows')) {
          continue;
      }

      // Detect header row (line with "Index" and signal names)
      if (line.startsWith("Index")) {
          const newHeaders = line.split(/\s+/).slice(1); // Exclude "Index"
          headers = newHeaders;
          continue;
      }

      // Parse numerical data
      const parts = line.split(/\s+/).filter(part => part !== ''); 

      if (parts.length === headers.length + 1) { // Ensure it matches column count
          const index = parseInt(parts[0], 10); // First column is index
          const vSweep = parseFloat(parts[1]); // Second column is sweep voltage
          const value = parseFloat(parts[2]); // Third column is value

          if (!isNaN(index) && !isNaN(vSweep) && !isNaN(value)) {
              if (index === 0 && infoStorage['v-sweep'].length > 0) {
                  // Assign header to the section before storing
                  let assignedHeader = headers[dataStore.length] || `Unknown-${dataStore.length}`;
                  dataStore.push({ header: assignedHeader, data: { ...infoStorage } });

                  console.log("Stored Section:", assignedHeader, infoStorage);
                  
                  // Reset infoStorage for the next section
                  infoStorage = { 'v-sweep': [], 'value': [] };
              }

              infoStorage['v-sweep'].push(vSweep);
              infoStorage['value'].push(value);
          }
          continue;
      }

      // If a 'Note' or circuit name line is found, store the last section
      if (line.startsWith('Note') || line.includes('Circuit:')) {
          if (infoStorage['v-sweep'].length > 0) {
              let assignedHeader = headers[dataStore.length] || `Unknown-${dataStore.length}`;
              dataStore.push({ header: assignedHeader, data: { ...infoStorage } });

              console.log("Stored Section:", assignedHeader, infoStorage);
          }
          infoStorage = { 'v-sweep': [], 'value': [] };
          continue;
      }
  }

  // Ensure the last section is stored
  if (infoStorage['v-sweep'].length > 0) {
      let assignedHeader = headers[dataStore.length] || `Unknown-${dataStore.length}`;
      dataStore.push({ header: assignedHeader, data: { ...infoStorage } });

      console.log("Stored Final Section:", assignedHeader, infoStorage);
  }

  return dataStore;
}

function parseDCOPData(output) {
    const lines = output.split("\n");
    const data = [];

    lines.forEach(line => {
        const match = line.match(/(v\(\d+\))\s*=\s*([\d.e+-]+)/);
        if (match) {
            const node = match[1];  // e.g., v(1)
            const value = parseFloat(match[2]); // Convert to number
            data.push({ Node: node, Value: value });
        }
    });

    return data;
 }

 function plotDCOP(cleanedOutput) {
  const newWindow = window.open("", "_blank");
  newWindow.document.write(generateTable(cleanedOutput));
}


function parseACSweepData(output) {
  console.log(output);
    const lines = output.split('\n');
    let parseData = false;
    let headers = []; // Store column labels
    let datatStore = []; // Store all parsed sections
    let InfoStorage = {
        'frequency': [],
        'dB': []
    }; // Store data dynamically

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Start parsing after "AC Analysis"
        if (line.startsWith('AC Analysis')) {
            parseData = true;
            continue;
        }

        // Skip irrelevant lines
        if (!parseData || line === "" || line.startsWith('Warning') || line.startsWith('---')) {
            continue;
        }

        // Detect header row (line with "Index" and signal names)
        if (line.startsWith("Index")) {
            const newHeaders = line.split(/\s+/).slice(1).filter(header => header.toLowerCase() !== 'frequency');
            newHeaders.forEach(header => {
                if (!headers.includes(header)) {
                    headers.push(header);
                }
            });
            continue;
        }

        // Parse numerical data
        const parts = line.split(/\s+/).filter(part => part !== ''); 

        if (parts.length === 3) {  // Ensure sufficient data in the line
            const index = parseInt(parts[0], 10); // First column is index
            const frequency = parseFloat(parts[1]);
            const value = parseFloat(parts[2]);

            if (!isNaN(index) && !isNaN(frequency) && !isNaN(value)) {
                if (index === 0 && InfoStorage.frequency.length > 0) {
                    // Assign header to the section before storing
                    let assignedHeader = headers[datatStore.length] || `Unknown-${datatStore.length}`;
                    datatStore.push({ header: assignedHeader, data: { ...InfoStorage } });

                    console.log("Stored Section:", assignedHeader, InfoStorage);
                    
                    // Reset InfoStorage for the next section
                    InfoStorage = { 'frequency': [], 'dB': [] };
                }

                InfoStorage.frequency.push(frequency);
                InfoStorage.dB.push(value);
            }
            continue;
        }

        // If a 'Note' line is found, store the last section
        if (line.startsWith('Note')) {
            if (InfoStorage.frequency.length > 0) {
                let assignedHeader = headers[datatStore.length] || `Unknown-${datatStore.length}`;
                datatStore.push({ header: assignedHeader, data: { ...InfoStorage } });

                console.log("Stored Section:", assignedHeader, InfoStorage);
            }
            InfoStorage = { 'frequency': [], 'dB': [] };
            continue;
        }
    }

    // Ensure the last section is stored
    if (InfoStorage.frequency.length > 0) {
        let assignedHeader = headers[datatStore.length] || `Unknown-${datatStore.length}`;
        datatStore.push({ header: assignedHeader, data: { ...InfoStorage } });

        console.log("Stored Final Section:", assignedHeader, InfoStorage);
    }

    console.log("Final Parsed Data:", datatStore);
    return datatStore;
}

function plotACSweep(parsedData) {
  parsedData.forEach((entry, index) => {
    if (!entry.data || !entry.data.frequency || !entry.data.dB) {
      console.warn(`Skipping dataset "${index}" due to missing data.`);
      return;
    }

    const dataset = {
      label: entry.header, // Use the header as the dataset name
      data: entry.data.frequency.map((freq, i) => ({
        x: freq,  // Logarithmic scale on frequency
        y: entry.data.dB[i]
      })),
      borderColor: getRandomColor(index),
      borderWidth: 0.5,
      fill: false,
      xAxisID: 'x-axis-2',
      yAxisID: 'y-axis-1'
    };

    chart.options.scales['x-axis-2'] = {
      title: {
        display: true,
        text: 'Frequency (Hz)'
      },
      type: 'logarithmic',
      position: 'top'
    };

    chart.data.datasets.push(dataset);
  });

  // Update the chart to render new datasets
  chart.update();
 }

 function plotDCSweep(cleanedOutput) {
  console.log(cleanedOutput);
  cleanedOutput.forEach((entry, index) => {
      if (!entry.data || !entry.data['v-sweep'] || !entry.data.value) {
          console.warn(`Skipping dataset "${index}" due to missing data.`);
          return;
      }

      const dataset = {
          label: entry.header, // Use the header as the dataset name
          data: entry.data['v-sweep'].map((v, i) => ({
              x: v, // Use voltage sweep values for X
              y: entry.data.value[i]
          })),
          borderColor: getRandomColor(index),
          borderWidth: 0.5,
          fill: false,
          xAxisID: 'x-axis-2',
          yAxisID: 'y-axis-1'
      };

      chart.options.scales['x-axis-2'] = {
          title: {
              display: true,
              text: 'V-Sweep (V)' // Updated to reflect voltage sweep
          },
          type: 'linear',
          position: 'bottom' // Keep x-axis at the bottom
      };

      chart.data.datasets.push(dataset);
  });

  // Update the chart to render new datasets
  chart.update();
}


function plotTransient(cleanedOutput) {
  cleanedOutput.forEach((entry, index) => {
    if (!entry.data || !entry.data.time || !entry.data.value) {
        console.warn(`Skipping dataset "${index}" due to missing data.`);
        return;
    }

    const dataset = {
        label: entry.header, // Use the header as the dataset name
        data: entry.data.time.map((time, i) => ({
            x: time, // Linear scale on time
            y: entry.data.value[i]
        })),
        borderColor: getRandomColor(index),
        borderWidth: 0.5,
        fill: false,
        xAxisID: 'x-axis-2',
        yAxisID: 'y-axis-1'
    };

    chart.options.scales['x-axis-2'] = {
        title: {
            display: true,
            text: 'Time (s)' // Updated to reflect time data
        },
        type: 'linear',
        position: 'bottom' // Time axis at the bottom
    };

    chart.data.datasets.push(dataset);
});

// Update the chart to render new datasets
chart.update();
}


function generateTable(data) {
    let tableHtml = `
        <table border="1">
            <tr><th>Node</th><th>Value</th></tr>
    `;

    data.forEach(row => {
        tableHtml += `<tr><td>${row.Node}</td><td>${row.Value} V</td></tr>`;
    });

    tableHtml += `</table>`;
    return tableHtml;
}

function GenerateACSweepTable(parsedData) {
  const tableWindow = window.open("", "_blank", "width=600,height=400");
  
  if (!tableWindow) {
      console.error("Popup blocked! Allow popups for this site.");
      return;
  }

  tableWindow.document.write(`
      <html>
      <head>
          <title>AC Sweep Data</title>
          <style>
              body { font-family: Arial, sans-serif; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid black; padding: 8px; text-align: center; }
              th { background-color: #f2f2f2; }
          </style>
      </head>
      <body>
          <h2>AC Sweep Data</h2>
          <table>
              <thead>
                  <tr>
                      <th>Dataset</th>
                      <th>Frequency (Hz)</th>
                      <th>Magnitude (dB)</th>
                  </tr>
              </thead>
              <tbody id="data-table-body">
              </tbody>
          </table>
      </body>
      </html>
  `);

  const tableBody = tableWindow.document.getElementById("data-table-body");

  parsedData.forEach((entry, index) => {
      if (!entry.data || !entry.data.frequency || !entry.data.dB) {
          console.warn(`Skipping dataset "${index}" due to missing data.`);
          return;
      }

      entry.data.frequency.forEach((freq, i) => {
          const row = tableWindow.document.createElement("tr");
          row.innerHTML = `
              <td>${entry.header}</td>
              <td>${freq}</td>
              <td>${entry.data.dB[i]}</td>
          `;
          tableBody.appendChild(row);
      });
  });
}


function GenerateDCSweepTable(cleanedOutput) {
  const tableWindow = window.open("", "_blank", "width=600,height=400");
  
  if (!tableWindow) {
      console.error("Popup blocked! Allow popups for this site.");
      return;
  }

  tableWindow.document.write(`
      <html>
      <head>
          <title>DC Sweep Data</title>
          <style>
              body { font-family: Arial, sans-serif; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid black; padding: 8px; text-align: center; }
              th { background-color: #f2f2f2; }
          </style>
      </head>
      <body>
          <h2>DC Sweep Data</h2>
          <table>
              <thead>
                  <tr>
                      <th>Dataset</th>
                      <th>V-Sweep (V)</th>
                      <th>Value</th>
                  </tr>
              </thead>
              <tbody id="data-table-body">
              </tbody>
          </table>
      </body>
      </html>
  `);

  const tableBody = tableWindow.document.getElementById("data-table-body");

  cleanedOutput.forEach((entry, index) => {
      if (!entry.data || !entry.data['v-sweep'] || !entry.data.value) {
          console.warn(`Skipping dataset "${index}" due to missing data.`);
          return;
      }

      entry.data['v-sweep'].forEach((v, i) => {
          const row = tableWindow.document.createElement("tr");
          row.innerHTML = `
              <td>${entry.header}</td>
              <td>${v}</td>
              <td>${entry.data.value[i]}</td>
          `;
          tableBody.appendChild(row);
      });
  });
}

function GenerateTransientTable(cleanedOutput) {
  const tableWindow = window.open("", "_blank", "width=600,height=400");
  
  if (!tableWindow) {
      console.error("Popup blocked! Allow popups for this site.");
      return;
  }

  tableWindow.document.write(`
      <html>
      <head>
          <title>Transient Data</title>
          <style>
              body { font-family: Arial, sans-serif; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid black; padding: 8px; text-align: center; }
              th { background-color: #f2f2f2; }
          </style>
      </head>
      <body>
          <h2>Transient Data</h2>
          <table>
              <thead>
                  <tr>
                      <th>Dataset</th>
                      <th>Time (s)</th>
                      <th>Value</th>
                  </tr>
              </thead>
              <tbody id="data-table-body">
              </tbody>
          </table>
      </body>
      </html>
  `);

  const tableBody = tableWindow.document.getElementById("data-table-body");

  cleanedOutput.forEach((entry, index) => {
      if (!entry.data || !entry.data.time || !entry.data.value) {
          console.warn(`Skipping dataset "${index}" due to missing data.`);
          return;
      }

      entry.data.time.forEach((time, i) => {
          const row = tableWindow.document.createElement("tr");
          row.innerHTML = `
              <td>${entry.header}</td>
              <td>${time}</td>
              <td>${entry.data.value[i]}</td>
          `;
          tableBody.appendChild(row);
      });
  });
}

function printLineHandler(existContent) {

}
function removeAndReplaceControlSection(existingContent, controlSection) {
  // Regex to find print lines (e.g., print vdb(1,2), print v(3,4) or print all)
  nodeValMap.clear();
  const printRegex = /^\s*print.*$/gm;
  const printLines = [];
  let match;

  // Find all print lines and store them
  while ((match = printRegex.exec(existingContent)) !== null) {
      printLines.push(match[0]);
  }
  //for each printline
  //store the node at the end of print v/vdb(node)
  //remove the print line
  printLines.forEach(line => {
    if (line.startsWith('print v')) {
      let nodeVal = line.split('(')[1].split(')')[0];
      nodeValMap.set(nodeVal);
    }
  })

  // Remove the print lines from the existing content
  existingContent = existingContent.replace(printRegex, '');

  switch (plotType) {
    case 'ACSweep':
      break;
    case 'DCSweep':
      break;
    case 'Transient':
      break;
    case 'DCOP':
      break;
  }

  // Add .endc to the control section
  controlSection += `.endc`;

  existingContent = `\n${existingContent.trim()}\n`;

  // Check if there's an existing .control section
  const controlRegex = /\.control[\s\S]*?\.endc/;

  if (existingContent.includes('.control')) {
      // Replace the existing .control section with the new one
      existingContent = existingContent.replace(controlRegex, controlSection);
  } else {
      // If no .control section exists, append the new control section
      existingContent += `\n${controlSection}\n.end`;
  }

  return existingContent;
}
