
var numPoints = 500;
var valid = -1;
// Generate initial sine wave data
var xData = [];
var yData = [];
var dx = 2 * Math.PI / numPoints;
var plotType = 'ACSweep';
var VoltName = '';
const maxPoints = 7000;

let originalWaveForm = '';

// Variables for each analysis type
var startFreq = 1, endFreq = 10000, SimNumPoints = 500; // AC Sweep
var startVolt = 0, endVolt = 5, step = 0.1; // DC Sweep
var startTime = 0, stopTime = 5, timeStep = 0.01; // Transient


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
  window.location.href = "build.html";
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


async function ModifyNetlist(filePath) {
  try {
    // Read the file content
    const waveFormToggle = document.getElementById('toggleWaveform');
    let toggleWave = waveFormToggle.checked;
    let existingContent = await readFile(filePath);
    let updatedContent = existingContent;

    // Initialize the control section and find probes
    let controlSection = `.control\n`;
    let probeLines = [];
    const lines = existingContent.split('\n');


    console.log('plotType:', plotType);
    // Add control commands based on plotType
    switch (plotType) {
      case 'ACSweep':
        controlSection += `ac dec ${SimNumPoints} ${startFreq} ${endFreq} \n`;
        break;
      case 'DCSweep':
        controlSection += `dc ${VoltName} ${startVolt} ${endVolt} ${step}\n`;
        break;
      case 'Transient':
        controlSection += `tran ${timeStep} ${stopTime}\n`;
        break;
      case 'DC OP':
        controlSection += `op\n`;
        controlSection += `print all\n`;
        break;
    }

    // Remove --partial line
    existingContent = existingContent.replace(/^\s*--partial\s*[\r\n]*/m, 'Modified Netlist \n');


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


// Pair up voltage probes and format as vdb pairs
for (let i = 0; i < vProbes.length; i += 2) {
  if (vProbes[i] == 0) {
    printString += `print vdb(${vProbes[i + 1]})\n`;
  } else if (vProbes[i + 1] == 0) {
    printString += `print vdb(${vProbes[i]})\n`;
  } else if (vProbes[i] != 0 && vProbes[i + 1] != 0) {
    printString += `print vdb(${vProbes[i]},${vProbes[i + 1]})\n`;
  }
}

// Add current probes as individual .print lines
if (!controlSection.includes('ac')) {
  iProbes.forEach(probe => {
    printString += `print ${probe}\n`;
  });
  console.log("No AC sweep. Adding current probes as individual .print lines.");
}

    existingContent = existingContent.replace(/^\s*\.probe.*$/gm, '');
    controlSection += printString + "\n";
    let finalContent = removeAndReplaceControlSection(existingContent, controlSection);
    console.log("Final Content:", finalContent);
    finalContent = finalContent.trim();

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

  document.getElementById('viewData').addEventListener('click', async () => {
    if (rawOutput !== null) {
      const tableBody = document.querySelector('#dataTable tbody');
      tableBody.innerHTML = ''; // Clear any existing rows

      // Parse the rawOutput
      const lines = rawOutput.split('\n'); // Split by lines
      const dataStartIndex = lines.findIndex(line => line.startsWith('Index')); // Locate data start
      const dataLines = lines.slice(dataStartIndex + 2, dataStartIndex + 52); // Extract the first 50 rows

      // Populate the table
      dataLines.forEach(line => {
        const columns = line.trim().split(/\s+/); // Split by whitespace
        if (columns.length === 3) {
          const row = document.createElement('tr');
          row.innerHTML = `
                    <td>${columns[0]}</td>
                    <td>${columns[1]}</td>
                    <td>${columns[2]}</td>
                `;
          tableBody.appendChild(row);
        }
      });

      // Open the modal
      openModal();
    } else {
      console.error('No raw output data available');
    }
  });

  // Function to open the modal
  function openModal() {
    document.getElementById('dataModal').style.display = 'block';
  }

  document.querySelector('.close-button').addEventListener('click', closeModal);

  // Function to close the modal
  function closeModal() {
    document.getElementById('dataModal').style.display = 'none';
  }

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

      if (validNetlist === 1) {
        try {
          ModifyNetlist(filePath);
          let cleanedOutput = '';
          const output = await window.electron.simulateCircuit(filePath);
          let rawOutput = output
          console.log(rawOutput);
          switch (plotType) {
            case 'Transient':
              //restoreGraph();
              cleanedOutput = parseTransData(rawOutput);
              plotTransient(cleanedOutput); //graph
              break;
            case 'ACSweep':
              //restoreGraph();
              cleanedOutput = parseACSweepData(rawOutput);
              plotACSweep(cleanedOutput); //graph
              break;
            case 'DC OP':
              cleanedOutput = parseDCOPData(rawOutput);
              plotDCOP(cleanedOutput); //table
              break;
            case 'DCSweep':
              //restoreGraph();
              cleanedOutput = parseDCData(rawOutput);
              plotDCSweep(cleanedOutput); //unknown
              break;
          }
          //plotFromNgspiceOutput(output);
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
          switch (plotType) {
            case 'Transient':
              cleanedOutput = parseTransData(rawOutput);
              plotTransient(cleanedOutput); //graph
              break;
            case 'ACSweep':
              cleanedOutput = parseACSweepData(rawOutput);
              plotACSweep(cleanedOutput); //graph
              break;
            case 'DC OP':
              cleanedOutput = parseDCOPData(rawOutput);
              plotDCOP(cleanedOutput); //table
              break;
            case 'DCSweep':
              cleanedOutput = parseDCSweepData(rawOutput);
              plotDCSweep(cleanedOutput); //unknown
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



function parseTransData(output) { }

function parseDCData(output) { }

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

function plotDCSweep(cleanedOutput) { }

function plotTransient(cleanedOutput) { }



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



function removeAndReplaceControlSection(existingContent, controlSection) {
  // Regex to find print lines (e.g., print vdb(1,2) or print all)
  const printRegex = /^\s*print.*$/gm;
  const printLines = [];
  let match;

  // Find all print lines and store them
  while ((match = printRegex.exec(existingContent)) !== null) {
      printLines.push(match[0]);
  }

  // Remove the print lines from the existing content
  existingContent = existingContent.replace(printRegex, '');

  // Add the print lines to the control section
  //if print line exsists in control section, skip

  printLines.forEach(line => {
      if (controlSection.includes(line)) {
        return;
      }
      controlSection += `${line}\n`;
  });

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
