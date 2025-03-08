//Controller.js
const connectors = new Map();
const componentMap = new Map();
const probeMap = new Map();
let componentIdCounter = 0;
let componentPositions = {};
let groupCounter = 1;
let internalGrid = [];
let isDrawingWire = false;
//const connectors = [];
let ProbeOn = false;
let NegativeProbe = false;
let wireBlocker = false;
let currentProbeBool = false;
let currPosProbe = null;
let currNegProbe = null;
let groundWire = false;
const groupMap = new Map();
const connectionMap = new Map();

const circuitData = {
    components: [],
    connections: []
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loadButton').addEventListener('click', async () => {
        const { filePath, fileContent } = await window.electron.openFileDialog();
        if (filePath) {
            const fileName = filePath.split('\\').pop().split('/').pop();
            document.getElementById('fileHolder').textContent = fileName;
            loadCircuit(fileContent);
        }
    });
    document.getElementById('saveButton').addEventListener('click', saveCircuit);
    generateGrid();
});

function startDrawingWire(connectionId) {
    isDrawingWire = true;
    startConnection = connectionId;
}

function endDrawingWire(connectionId) {
    isDrawingWire = false;
    endConnection = connectionId;
    var startComponent = getComponentId(startConnection);
    var endComponent = getComponentId(endConnection);

    if (startComponent === endComponent) {
        console.log("Cannot connect a component to itself");
        return;
    }
    let wireID, goodWire = createWire(startConnection, endConnection);
    if(goodWire) {
        createGroup(startConnection, endConnection);
        updateEquations();
        //storeConnection(startConnection, endConnection);
        console.log("Created wire");
        console.log(groupMap);
    }
    else {
        console.log("Failed to create wire");
    }
    
}

// createGroup is called when a new connection is made.
// createGroup is called when a new connection is made.
function createGroup(startConnection, endConnection) {
    let sharedValue;
    let connections = [startConnection, endConnection];
  
    // Check if either connection is "Ground"
    const isGrounded = startConnection.startsWith("Ground") || endConnection.startsWith("Ground");
  
    if (isGrounded) {
      sharedValue = { value: 0 };
    } else if (groupMap.has(startConnection)) {
      sharedValue = groupMap.get(startConnection);
    } else if (groupMap.has(endConnection)) {
      sharedValue = groupMap.get(endConnection);
    } else {
      // Create a new shared integer reference for this group
      sharedValue = { value: groupCounter };
      groupCounter++;
    }
  
    // Save the shared reference in both groupMap and connectionMap.
    groupMap.set(startConnection, sharedValue);
    groupMap.set(endConnection, sharedValue);
    connectionMap.set(connections, sharedValue);
  
    // If grounding occurs, update connections and groups.
    if (isGrounded) {
      updateConnectionsForGround(connectionMap);
      updateGroupMapFromConnections(connectionMap, groupMap);
    }

    console.log(`Group created between ${startConnection} and ${endConnection}, shared value: ${sharedValue.value}`);
  }
  
  function updateConnectionsForGround(connectionMap) {
    // Pass 1: Identify all connectors that are directly connected to a ground.
    let groundedConnectors = new Set();
    for (let [connPair, _] of connectionMap.entries()) {
      if (connPair[0].includes("Ground") || connPair[1].includes("Ground")) {
        groundedConnectors.add(connPair[0]);
        groundedConnectors.add(connPair[1]);
      }
    }
  
    // Pass 2: Update every connection that involves a grounded connector.
    for (let [connPair, _] of connectionMap.entries()) {
      if (groundedConnectors.has(connPair[0]) || groundedConnectors.has(connPair[1])) {
        connectionMap.set(connPair, { value: 0 });
      }
    }
  }
  
  function updateGroupMapFromConnections(connectionMap, groupMap) {
    // Iterate over each connection in connectionMap.
    for (let [connPair, shared] of connectionMap.entries()) {
      // If the connection has a value of 0 (grounded)
      if (shared.value === 0) {
        // Update both connectors in groupMap to have a shared value of 0.
        groupMap.set(connPair[0], { value: 0 });
        groupMap.set(connPair[1], { value: 0 });
      }
    }
  }
  
  
  
// Helper function to find the class instance by its connection ID
function getClassInstanceByName(name) {
    for (let [key, value] of componentMap) {
        if (value.instance.name === name) {
            return value.instance;
        }
    }
    return null;
}
function fabListener(button, rotateButton, deleteButton, clearWiresButton, editButton, connectors, componentId) {
    let currentRotation = 0; // Variable to store the current rotation angle

    const componentData = componentMap.get(componentId);

    console.log("Component Map")
    console.log(componentMap)

    if (rotateButton) {
        rotateButton.addEventListener('click', () => {
            // Update the rotation angle
            currentRotation = (currentRotation + 90) % 360;
    
            // Rotate the button visually
            button.style.transform = `rotate(${currentRotation}deg)`;
    
            // Update connector positions based on new rotation
            updateConnectors(componentData.connectors);
            updateWires(componentId);

            console.log("Wires Updated");
        });
    }
    
    if(deleteButton) {
        deleteButton.addEventListener('click', () => {
            deleteComponent(componentId);
        });
    }

    if(clearWiresButton) {
        clearWiresButton.addEventListener('click', () => {
            clearWiresFromComponent(componentId);
        });
    }

    if (editButton) {
        editButton.addEventListener('click', () => {
            if (componentData) {
                const { instance, connectors } = componentData;
                instance.displayModifiableValues();
                console.log('instance post mods, ', instance);
                instance.updateInfoBox();
            } else {
                alert('Unable to edit component!');
                console.log(componentData)
            }
        })
    }
}

function deleteComponent(componentId) {
    // Retrieve the component and its connectors
    const componentData = componentMap.get(componentId);
    if (!componentData) return;

    const { Button, connectors } = componentData;
    clearWiresFromComponent(componentId);
    
    // Remove connectors from the DOM
    connectors.forEach(connector => {
        if (connector && connector.parentNode) {
            connector.parentNode.removeChild(connector);
        }
        document.getElementById(connector.id)?.remove();  // Ensure no duplicates
    });
    connectors.length = 0;

    // Remove the component button from the DOM
    const button = document.getElementById('component-button-' + componentId);
    removeFABForComponent(button);
    if (button && button.parentNode) {
        button.parentNode.removeChild(button);
    }

    // Remove the component holder (if any)
    const holder = button ? button.parentNode : null;
    if (holder && holder.parentNode) {
        holder.parentNode.removeChild(holder);
    }

    componentMap.delete(componentId); 
}

function clearWiresFromComponent(componentId) {
    // Retrieve component data (including its connectors) from componentMap.
    const componentData = componentMap.get(componentId);
    if (!componentData) return;
    
    const { connectors } = componentData;
    
    // Reset the background image for each connector of the deleted component.
    connectors.forEach(connector => {
      const connectorElement = document.getElementById(connector.id);
      if (connectorElement) {
        connectorElement.style.backgroundImage = "url('images/CONNECTOR.svg')";
      }
    });
    
    let keysToDelete = [];
    
    // Process connectionMap entries to find wires referencing any connector from this component.
    connectionMap.forEach((sharedValue, key) => {
      let keyStr = "";
      let connectorIds = [];
      
      // Handle keys that are arrays or strings.
      if (Array.isArray(key)) {
        connectorIds = key;
        keyStr = key.join(",");
      } else if (typeof key === "string") {
        keyStr = key.trim();
        connectorIds = keyStr.split(",").map(s => s.trim());
      } else {
        return;
      }
      
      // Check if any connector in this key belongs to the deleted component.
      const matchFound = connectorIds.some(connectorId => connectorId.includes(componentId));
      if (matchFound) {
        // Process explicit connections (comma-separated keys).
        if (connectorIds.length === 2) {
          const svgId = `wire-${connectorIds.join("-")}`;
          const wireElem = document.getElementById(svgId);
          if (wireElem) {
            wireElem.remove();
          }
          
          // Determine the remaining connector (the one not from the deleted component).
          let remainingConnectorId = connectorIds.find(id => !id.startsWith(componentId + "-"));
          if (remainingConnectorId) {
            // Check if this remaining connector is still connected to another wire.
            let stillConnected = false;
            connectionMap.forEach((val, otherKey) => {
              let otherKeyStr = "";
              if (Array.isArray(otherKey)) {
                otherKeyStr = otherKey.join(",");
              } else if (typeof otherKey === "string") {
                otherKeyStr = otherKey.trim();
              }
              if (otherKeyStr === keyStr) return;
              if (otherKeyStr.includes(remainingConnectorId)) {
                stillConnected = true;
              }
            });
            if (!stillConnected) {
              const remainingElem = document.getElementById(remainingConnectorId);
              if (remainingElem) {
                remainingElem.style.backgroundImage = "url('images/CONNECTOR.svg')";
              }
            }
          }
        } else {
          // For keys that are not comma-separated.
          const svgId = `wire-${keyStr}`;
          const wireElem = document.getElementById(svgId);
          if (wireElem) {
            wireElem.remove();
          }
        }
        
        keysToDelete.push(key);
      }
    });
    
    // Delete all marked keys from connectionMap.
    keysToDelete.forEach(key => {
      connectionMap.delete(key);
    });
  }
  
  
  
function attachBot(con) {
    con.style.bottom = "-7px"; // Adjust as needed to move it below the main button
    con.style.left = "50%";
    con.style.transform = "translateX(-45%)";
    con.classList.add("bot-connector");
}
function attachTop(con) {
    con.style.top = "-9px"; // Adjust as needed to move it above the main button
    con.style.left = "50%";
    con.style.transform = "translateX(-50%)";
    con.classList.add("top-connector");
}

function attachRight( button2) {
    button2.style.right = "-10px"; // Adjust as needed to move it to the right of the main button
    button2.style.top = "50%";
    button2.style.transform = "translateY(-50%)";
    button2.classList.add("right-connector");
}

function attachLeft(button) {
    button.style.left = "-10px"; // Adjust as needed to move it to the left of the main button
    button.style.top = "50%";
    button.style.transform = "translateY(-50%)";
    button.classList.add("left-connector");
}


function updateConnectors(connectors) {
    console.log("Connectors: ", connectors);
    connectors.forEach(connector => {
        // Store the current class and corresponding transformation
        let newClass = '';
        let transformFunction = null;
        // Determine the new position and transformation based on the current class
        if (connector.classList.contains('top-connector')) {
            newClass = 'right-connector';
            transformFunction = attachRight;
        } else if (connector.classList.contains('bot-connector')) {
            newClass = 'left-connector';
            transformFunction = attachLeft;
        } else if (connector.classList.contains('left-connector')) {
            newClass = 'top-connector';
            transformFunction = attachTop;
        } else if (connector.classList.contains('right-connector')) {
            newClass = 'bot-connector';
            transformFunction = attachBot;
        }

        // Remove previous positions and transformations
        connector.style.top = '';
        connector.style.bottom = '';
        connector.style.left = '';
        connector.style.right = '';
        connector.style.transform = '';

        // Apply the transformation and update the class
        if (transformFunction) {
            transformFunction(connector);
        
            // Define a regex pattern to match classes of the form 'dir-connector'
            const pattern = /^.*-connector$/;
        
            // Remove the class matching the pattern
            connector.classList.forEach(cls => {
                if (pattern.test(cls)) {
                    connector.classList.remove(cls);
                }
            });
        
            // Add the new class
            connector.classList.add(newClass);
        }

        console.log(`componentMap in updateConnectors: ${componentMap}`);
    });
}



function AddVoltageProbe() {
    ProbeOn = true;
    wireBlocker = true;
}
function AddCurrentProbe() {
    ProbeOn = true;
    wireBlocker = true;
    currentProbeBool = true;
}

// Function to get the component instance associated with a button
function getComponentFromButton(button) {
    const componentId = button.dataset.componentId;
    const componentData = componentMap.get(componentId);
    return componentData ? componentData.instance : null;
}

// Function to update the coordinates of a component
function updateComponentCoordinates(button, newX, newY) {
    const componentInstance = getComponentFromButton(button);
    if (componentInstance) {
        //console.log(componentInstance); // Check if this is the right instance
        instance = componentInstance.instance;
        instance.updateCoordinates(newX, newY);
    }
}

function dragElement(elmt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    elmt.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();

        pos3 = e.clientX;
        pos4 = e.clientY;

        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();

        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;

        pos3 = e.clientX;
        pos4 = e.clientY;

        elmt.style.top = (elmt.offsetTop - pos2) + "px";
        elmt.style.left = (elmt.offsetLeft - pos1) + "px";

        const button = elmt.querySelector('button[data-component-id]');
        if (button) {
            const componentId = button.dataset.componentId;
            const rect = button.getBoundingClientRect();
            updateComponentCoordinates(button, rect.left, rect.top);
            updateWires(componentId);
        }
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;

        // Snap to nearest grid position
        const currentLeft = parseFloat(elmt.style.left);
        const currentTop = parseFloat(elmt.style.top);
        const snappedPosition = snapToGrid(currentLeft, currentTop);

        elmt.style.left = snappedPosition.left + "px";
        elmt.style.top = snappedPosition.top + "px";

        const button = elmt.querySelector('button[data-component-id]');
        if (button) {
            const componentId = button.dataset.componentId;

            const rect = button.getBoundingClientRect();
            updateComponentCoordinates(button, rect.left, rect.top);
            updateWires(componentId);
        }
    }
}

function snapToGrid(left, top) {
    let nearestLeft = findNearest(left, internalGrid.map(pair => pair[0]));
    let nearestTop = findNearest(top, internalGrid.map(pair => pair[1]));

    return { left: nearestLeft, top: nearestTop };
}

function findNearest(value, array) {
    return array.reduce((prev, curr) => {
        return (Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev);
    });
}

function generateNetlist() {
    // Initialize the netlist string with '--partial' followed by a newline
    let netlist = '--partial\n';

    // Temporary array to hold all non-Voltage components
    const nonVoltageComponents = [];

    // Diode Models
    const models = []

    // Loop through each component in the componentMap
    componentMap.forEach((componentData, componentId) => {
        const componentInstance = componentData.instance;

        // Check if the instance has an 'equation' property and is not '0'
        if (componentInstance && componentInstance.equation && componentInstance.equation.trim() !== '0') {
            // If it's a Voltage component, prepend it to the netlist immediately
            if (componentInstance.name.startsWith("V")) {
                componentInstance.updateInfo();
                console.log(componentInstance.info);
                console.log(componentInstance.equation);
                netlist += " " + componentInstance.equation + ' ' + componentInstance.info + '\n';
            }
            else {
                // Otherwise, add it to the array of non-Voltage components
                nonVoltageComponents.push(componentInstance.equation);
            }

            // push models 
            if (componentInstance.hasModel) {
                models.push(componentInstance.model)
            }
        }
    });

    // Append the non-Voltage components to the netlist
    nonVoltageComponents.forEach(equation => {
        netlist += " " + equation + '\n';
    });

    models.forEach(model => {
        netlist += model + '\n';
    })

    // Now cycle through ProbeMap and grab all probe equations
    probeMap.forEach((probeInstance, probeName) => {
        // Check if the probe has an 'equation' property
        if (probeInstance && probeInstance.equation) {
            netlist += " " + probeInstance.equation + '\n';
        }
    });

    // Optionally, log the final netlist (for debugging purposes)
    console.log(netlist);

    // Return the netlist
    return netlist;
}
// Function to save the circuit
async function saveCircuit(SaveButton) {
    try {
        // Initialize a new structure for circuit data
        const circuitData = {
            components: [],
            connections: [],
            probes: {}, // To store probe-related data
        };

        // Iterate through componentMap to save components
        componentMap.forEach((componentData, id) => {
            const { instance, connectors, connections } = componentData;

           // Get rotation from the button
           const button = document.getElementById(`component-button-${id}`);
           const rotationValue = button ? getRotationAngle(button) : 0;

            // Serialize connectors
            const serializedConnectors = connectors.map(connector => ({
                id: connector.id,
                position: {
                    top: connector.style.top,
                    left: connector.style.left,
                    bottom: connector.style.bottom,
                    right: connector.style.right,
                    transform: connector.style.transform
                },
                classList: Array.from(connector.classList) // Serialize classes
            }));

            // Serialize the instance
            const serializedInstance = {
                name: instance.name,
                imgSrc: instance.imgSrc,
                x: instance.x,
                y: instance.y,
                intX: instance.intX,
                intY: instance.intY,
                info: instance.info,
                model: instance.model ? instance.model : null,
                equation: instance.equation,
                numInCons: instance.numInCons,
                numOutCons: instance.numOutCons,
                blockedNodes: instance.blockedNodes, // Serialize blocked nodes
                rotation: rotationValue
            };

            console.log("serialized instance: ", serializedInstance);

            // Add to components array
            circuitData.components.push({
                id,
                instance: serializedInstance,
                connectors: serializedConnectors,
                connections: connections || [] // Include connection information
            });
        });

        console.log("connectionMap:", connectionMap.entries());
        circuitData.connections = Object.fromEntries(connectionMap.entries());

        if(SaveButton){
        // Save using Electron
        const response = await window.electron.saveCircuit(circuitData);
        if (response && response.message) {
            alert(response.message);
        }
        }
        else{
            console.log(circuitData)
            const response = await window.electron.savetempFile(circuitData);
            if (response && response.message) {
                alert(response.message);
            }
        }

        console.log("map:", circuitData);
        
        console.log("Circuit saved successfully.");
    } catch (error) {
        console.error("Error saving circuit:", error);
        alert("An error occurred while saving the circuit.");
    }
}

function getRotationAngle(element) {
    const transform = window.getComputedStyle(element).transform;
    if (transform === "none") return 0;
    const matrix = new DOMMatrix(transform);
    const angle = Math.round(Math.atan2(matrix.b, matrix.a) * (180 / Math.PI));
    return (angle + 360) % 360; // Convert negative angles to positive
}

function loadCircuit(savedDataString) {
    try {
        // Parse the saved data
        const savedData = JSON.parse(savedDataString);

        // Validate saved data
        if (!savedData || !savedData.components) {
            console.error("Invalid circuit data:", savedData);
            return;
        }

        // Clear the current circuit
        clearCircuit();

        // Ensure grid or circuit canvas exists
        const grid = document.getElementById("grid");
        if (!grid) {
            throw new Error("Grid or circuit canvas element is missing in the DOM.");
        }

        // Loop through the components in the saved data
        savedData.components.forEach(componentData => {
            const { id, instance, connectors } = componentData;

            // Validate component structure
            if (!id || !instance || !connectors) {
                console.warn("Invalid component data:", componentData);
                return;
            }

            // Dynamically create the appropriate component instance
            const { name, imgSrc, x, y, numInCons, numOutCons, info, model, equation, blockedNodes, rotation } = instance;

            const componentClass = getComponentClass(name); // Dynamically resolve the class based on the name
            if (!componentClass) {
                console.warn(`Unknown component type: ${name}`);
                return;
            }

            const componentInstance = new componentClass(x, y);

            // Restore instance properties
            componentInstance.info = info;
            componentInstance.equation = equation;
            componentInstance.numInCons = numInCons;
            componentInstance.numOutCons = numOutCons;
            componentInstance.blockedNodes = blockedNodes;
            componentInstance.updateCoordinates(x, y);
            componentInstance.imgSrc = imgSrc;
            componentInstance.rotation = rotation || 0;

            // If we have a model, restore it
            if (componentInstance.model) {
                componentInstance.setModel(model)
            }

            // Build the component
            const componentID = componentInstance.name;
            componentMap.set(componentID, {
                instance: componentInstance,
                connectors: [], // Connectors will be rebuilt below
                connections: [], // Connections will be restored later
            });


            const button = document.getElementById(`component-button-${componentID}`);
            if (button) {
                const rotateButton = document.getElementById(`rotate-${componentID}`);
                for(let i = 0; i < 4; i++) {
                    if(rotation > (i * 90)) {
                            rotateButton.click(); // Simulate a click event to trigger the rotation fix
                        }
                }
            }

            connectors.forEach(connectorData => {
                const connector = document.createElement("button");
                connector.id = connectorData.id;
                const componentID = componentInstance.name;
                connectorData.classList.forEach(cls => connector.classList.add(cls));
                componentMap.get(componentID).connectors.push(connector);
            });
            console.log("componentMap in loadCircuit:", componentMap);

            componentInstance.updateInfoBox();
            
        });
       
        
        const processedConnections = new Set();
        const connectionPairs = []; // Store pairs for easier wire creation
        
        // First loop: Collect potential connections
        for (const [source, value] of Object.entries(savedData.connections)) {
            if (!value) continue;
        
            // Find corresponding target(s)
            for (const [potentialTarget, targetValue] of Object.entries(savedData.connections)) {
                if (source !== potentialTarget && targetValue && targetValue.value === value.value) {
                    connectionPairs.push([source, potentialTarget]);
                }
            }
        }
        
        // Second loop: Process and create wires
        if (savedData.connections) {
            const processedConnections = new Set();
            // Convert saved connections (an object) into an array of [key, value] pairs
            const savedEntries = Object.entries(savedData.connections);
          
            // Process connections with comma (explicit connection pairs)
            savedEntries.forEach(([key, valueObj]) => {
              if (key.includes(',')) {
                // Expecting key like "Ground1-connector0,V1-connector1"
                const connectors = key.split(',');
                if (connectors.length === 2) {
                  const [source, target] = connectors;
                  const connectionKey = `${source} -> ${target}`;
                  const reverseKey = `${target} -> ${source}`;
                  if (processedConnections.has(connectionKey) || processedConnections.has(reverseKey)) return;
                  processedConnections.add(connectionKey);
          
                  const sourceConnector = document.getElementById(source);
                  const targetConnector = document.getElementById(target);
                  if (sourceConnector && targetConnector) {
                    startDrawingWire(sourceConnector.id);
                    const targetRect = targetConnector.getBoundingClientRect();
                    const x = targetRect.left + targetRect.width / 2;
                    const y = targetRect.top + targetRect.height / 2;
                    endDrawingWire(targetConnector.id, x, y);
                  } else {
                    console.warn(`Invalid connection: ${source} -> ${target}`);
                  }
                }
              }
            });
          
            // Process connections without commas (normal connections)
            // Group them by the 'value' property stored in the connection object
            const groups = {};
            savedEntries.forEach(([key, valueObj]) => {
              if (!key.includes(',')) {
                const groupId = valueObj.value; // Assuming each valueObj is like { value: <groupNumber> }
                if (!groups[groupId]) {
                  groups[groupId] = [];
                }
                groups[groupId].push(key);
              }
            });
          }
          
        console.log("Circuit loaded successfully.");
        console.log(componentMap);
    } catch (error) {
        console.error("Error loading circuit data:", error);
    }
}

function getComponentClass(name) {
    console.log("Component Name in getComponentClass: ", name)

    if (name.includes("VD")) return DCVolt;
    if (name.startsWith("V")) return Volt;
    if (name.startsWith("R")) return Resistor;
    if (name.startsWith("L")) return Inductor;
    if (name.startsWith("C")) return Capacitor;
    if (name.startsWith("G")) return Gnd;

    // Diodes
    if (name.startsWith("D")) {
        if (name.includes("Zener")) return Zener;
        if (name.includes("LED")) return LED;
        return Diode;
    }

    // Transistors
    if (name.includes("NPN")) return NPN;
    if (name.includes("PNP")) return PNP;
    if (name.includes("NJFET")) return NJFET;
    if (name.includes("PJFET")) return PJFET;
    if (name.includes("NMOS")) return NMOS;
    if (name.includes("PMOS")) return PMOS;

    return null;
}


async function loadtempFile() {
    console.log("loadtempFile called");
    const data = await window.electron.loadtempFile();
    console.log("Received data:", data);

    if (typeof loadCircuit !== "function") {
        console.error("loadCircuit is not defined!");
        return;
    }

    if (data) {
        loadCircuit(data);
    }
}

// Function to clear the current circuit
function clearCircuit() {
    // Remove all wires using clearWiresFromComponent for each component
    componentMap.forEach((_, componentId) => {
        clearWiresFromComponent(componentId);
        deleteComponent(componentId);
    });

    // Remove all remaining wire elements from the DOM
    groupMap.forEach(wire => {
        if (wire.path) {
            wire.path.remove();
        }
    });
    groupMap.length = 0; // Clear the wires array

    // Remove all components from the DOM
    componentMap.forEach((component, componentId) => {
        // Remove component element
        const componentElement = document.getElementById('component-button-' + componentId);
        if (componentElement) {
            componentElement.remove();
        }
    });
    
    groupMap.clear();
    componentMap.clear(); // Clear the component map
    probeMap.clear();

    // Reset component positions
    componentPositions = {};
    window.Volt.resetID();
    window.Resistor.resetID();
    window.Inductor.resetID();
    window.Gnd.resetID();
    window.Diode.resetID();
    window.Capacitor.resetID();
    window.Zener.resetID();
    window.LED.resetID();
    window.Thyristor.resetID();
    Connector.resetID();
    wireClass.resetID()
    groupCounter = 1;

    console.log('Circuit cleared successfully.');
}

function SimulateCircuit() {
    // Check for ground in connectionMap:
    let hasGround = false;
    connectionMap.forEach((value, key) => {
      if (typeof key === "string") {
        if (key.includes("Ground")) {
          hasGround = true;
        }
      } else if (Array.isArray(key)) {
        if (key.some(conn => conn.includes("Ground"))) {
          hasGround = true;
        }
      }
    });
    
    // Check for a probe in probeMap:
    let hasProbe = probeMap.size > 0;
    
    // If missing either a ground connection or any probe, show an error alert.
    if (!hasGround || !hasProbe) {
      alert("Error: The circuit is missing a ground connection or a probe. Please add them before simulating.");
      return;
    }
    
    // Generate the netlist string and append additional info.
    let netlistString = generateNetlist();
    netlistString = appendInfo(netlistString);
    console.log(netlistString);
    
    // Save the circuit (temporary save).
    saveCircuit(false);
    
    // Define the netlist file path.
    const netlistPath = './Files/netlist.cir';
    
    // Save the netlist to file and, if successful, navigate to WaveForm.html.
    window.electron.saveNetlistToFile(netlistPath, netlistString)
      .then((saved) => {
        if (saved) {
          window.location.href = 'WaveForm.html';
        } else {
          alert('Failed to save netlist file.');
        }
      })
      .catch((err) => {
        console.error('Error saving netlist file:', err);
        alert('Error saving netlist file.');
      });
  }
  

function appendInfo(netlistString) {
    // Define regex patterns and their corresponding values to append

    console.log("Component Map: ", componentMap)

    componentMap.forEach((componentData, componentId) => {
        const componentInstance = componentData.instance;
        if(componentInstance.name.includes("V")) {
            //skip
            return;
        }
        let appendValue = componentInstance.info;
        console.log("Append Value: ", appendValue);
        console.log("Component Equation: ", componentInstance.equation);
        
        netlistString = netlistString.replace(componentInstance.equation, componentInstance.equation + ' ' + appendValue);
    });
    netlistString = netlistString.replace(/null/g, '');
    netlistString = netlistString.replace(/[^\S\r\n]+/g, ' ');
    netlistString = netlistString.trim();

    return netlistString;
}

function addmodels() {
    
}


function generateGrid() {
    //const grid = document.getElementById('grid');
    for (let i = 220; i < 1500; i += 10) {
        for (let j = 90; j < 1500; j += 10) {
            // Store the point (i, j) in internalGrid
            internalGrid.push([i, j]);
        }
    }
}

function placePosProbe(ConnectionID, connector) {
    //console.log(ConnectionID);
    return new VoltProbe(ConnectionID, connector, NegativeProbe);
}

function placeNegProbe(ConnectionID, connector) {
    //console.log(ConnectionID);
    return new VoltProbe(ConnectionID, connector, NegativeProbe);
}

function placeCurrentProbe(ConnectionID, connector) {
    //console.log(ConnectionID);
    return new CurrentProbe(ConnectionID, connector);
}

function extractComponentAndNode(probeName) {
    let ProbeString = '';
    const parts = probeName.split('-');
    console.log("Probe Name:", probeName);
    
    // Ensure we have at least three parts (component, connector, node)
    if (parts.length >= 3) {
        const componentId = parts[0]; // Component name (e.g., Resistor1)
        const connectorID = parts[1]; // Node number (e.g., connector1)

        let groupKey = `${componentId}-${connectorID}`;
        console.log("Group Key:", groupKey);

        const sharedVal = groupMap.get(groupKey);
        console.log("Shared Value:", sharedVal.value);
        if (sharedVal) {
            ProbeString = `.probe V(${sharedVal.value})`;;
        }
        
        console.log(ProbeString);
        
        // Return the equation in the desired format
        return ProbeString;
    } else {
        return ''; // Handle unexpected format
    }
}
// Function to update positive probe
function updatePosProbe(posProbe) {
    console.log("PosProbe Name:", posProbe.name);
    let equationString = extractComponentAndNode(posProbe.name);
    console.log(equationString);


    // Format the equation
    //console.log("PosProbe Equation:", probe);
    posProbe.equation = equationString; // Assuming Inductor1 is fixed for now
    console.log("PosProbe Equation:", posProbe.equation);
}

// Function to update negative probe
function updateNegProbe(negProbe) {
    console.log("NegProbe Name:", negProbe.name);
    
    // Extract component and node from the probe.name
    let equationString = extractComponentAndNode(negProbe.name);
    console.log(equationString);
    
    // Format the equation
    negProbe.equation = equationString; // Assuming Inductor1 is fixed for now
    console.log("NegProbe Equation:", negProbe.equation);
}

function updateEquations() {
    console.log("Updating Equations-Step 2");
    componentMap.forEach((componentData, componentId) => {
        const componentInstance = componentData.instance;
        componentInstance.updateEquation();
    });
}

function getComponentFromButton(button) {
    const componentId = button.dataset.componentId;
    return componentMap.get(componentId);
}

function getClassInstances() {
    const componentInstancesArray = Array.from(componentMap.values()).map(entry => {
        return entry.instance;
    });
    return componentInstancesArray;
}
function roundToNearestTen(value) {
    return Math.round(value / 10) * 10;
}

function getComponentIdByConnector(connectorId) {
    // Iterate over each component in the map
    for (let [componentId, componentData] of componentMap.entries()) {
        // Check if the connectorId exists in the component's connectors array
        if (componentData.connectors.some(connector => connector.id === connectorId)) {
            return componentId;
        }
    }
    return null;  // If no component has the connectorId
}

function getComponentId(fullId) {
    const parts = fullId.split('-');
    // Assuming the componentId is always the second part
    return parts[0];
}

