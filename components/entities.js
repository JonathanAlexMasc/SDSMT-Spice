class Entities {
    constructor() {
        this.name = "entity";            // Name of the entity
        this.numInCons = 0;               // Number of input connections
        this.numOutCons = 0;              // Number of output connections
        //this.imgSrc = "PathToImage";     // Path to the image of the entity
        this.x = '300px';                // X coordinate
        this.y = '500px';                // Y coordinate
        this.intX = parseInt(this.x, 10);
        this.intY = parseInt(this.y, 10);
        this.info = "null";
        this.unit = null;
        this.equation = "null";           // Equation representing the entity in netlist format
        this.connectors = [];
        this.blockedNodes = [];
        this.hasModel = false;            // Parameter for model presence, false default
        this.hasSubckt = false;
        //this.blockNodes();
        //this.buildComponent();
    }

    updateEquation() {

        // Iterate through the groupMap and find all mentions of the current component
        groupMap.forEach((sharedValue, connection) => {
            // Check if the component is mentioned in the connection
            if (connection.startsWith(this.name)) {
                // Append the shared value (group number) to the equation
                this.equation += " " + sharedValue.value;
            }
        });

        // Clean up equation (remove trailing space) and log the updated equation
        this.equation = this.equation.trim();
        console.log(`${this.id} equation updated to: ${this.equation}`);
    }

    buildComponent() {
        const componentID = this.name;
        componentMap.set(componentID, {
            name: this.name,
            instance: this,
            name: componentID,
            connectors: [],  // Stores connector-specific data (like pin numbers, connector types)
            connections: []  // Tracks connected component IDs (the actual connection relationships)
        });

        const grid = document.getElementById("grid");
        const holder = document.createElement("div");
        holder.id = `holder_${this.name}`;
        holder.className = 'ButtonDiv';
        holder.style.position = 'absolute';
        holder.style.top = this.y
        holder.style.left = this.x;

        // Create the button for the component
        const button = document.createElement("button");
        button.id = 'component-button-' + componentID;
        button.className = "b1 position";
        button.draggable = true;
        button.dataset.componentId = componentID;
        button.style.position = "relative";
        if (this.imgSrc) {
            button.style.backgroundImage = `url(${this.imgSrc})`;
        }
        button.style.border = "none";
        button.style.width = "60px";
        button.style.height = "60px";
        button.style.transform = 'rotate(0deg)';
        button.style.backgroundSize = "cover";
        button.style.backgroundPosition = "center";
        button.style.backgroundColor = "transparent";
        this.attachConnectors(this.numInCons, this.numOutCons, holder);
        componentMap.get(componentID).connectors = this.connectors;

        holder.appendChild(button);
        grid.appendChild(holder);

        this.updateInfoBox()

        dragElement(holder);

        // Create FAB buttons for the component
        createFABForComponent(button);

        // Grab the existing fab buttons
        const rotateButton = document.getElementById(`rotate-${componentID}`);
        const deleteButton = document.getElementById(`delete-${componentID}`);
        const clearWiresButton = document.getElementById(`clear-${componentID}`);
        const editButton = document.getElementById(`edit-${componentID}`);

        // Add listeners to them
        fabListener(button, rotateButton, deleteButton, clearWiresButton, editButton, connectors, componentID);

        this.updateCoordinates(this.x, this.y);
    }

    updateInfoBox() {
        const button = document.getElementById(`component-button-${this.name}`)
        const currBox = document.getElementById(`info-box-${this.name}`);
        
        if (currBox) {
            button.removeChild(currBox);
        }

        // Create the info box
        const infoBox = document.createElement("div");
        infoBox.id = `info-box-${this.name}`;
        infoBox.className = "info-box";
        infoBox.style.position = "absolute";
        infoBox.style.top = "-40px"; // Position it just above the button
        infoBox.style.left = "50%";
        infoBox.style.transform = "translateX(-50%)";
        infoBox.style.backgroundColor = "rgba(0, 0, 0, 0.5)"; // Transparent background
        infoBox.style.color = "white"; // Text color
        infoBox.style.padding = "5px";
        infoBox.style.borderRadius = "5px";
        infoBox.style.fontSize = "12px";
        infoBox.style.whiteSpace = "nowrap";
        infoBox.innerText = `${this.name}`; // Set the info text
        if (!this.hasModel && !this.hasSubckt && this.info) {
            infoBox.innerText += `, ${this.info}`;
        }
        if (this.unit) {
            infoBox.innerText += `${this.unit}`;
        }

        // Append the button and info box to the holder
        button.appendChild(infoBox);
    }

    updateCoordinates(x, y) {
        this.x = typeof x === 'string' && x.includes('px') ? x : `${x}px`;
        this.y = typeof y === 'string' && y.includes('px') ? y : `${y}px`;
        this.intX = parseInt(this.x, 10);
        this.intY = parseInt(this.y, 10);
        this.blockNodes();
    }

    blockNodes() {
        this.blockedNodes = [];
        for (let i = this.intX; i <= this.intX + 60; i += 10) {
            for (let j = this.intY; j <= this.intY + 60; j += 10) {
                this.blockedNodes.push([i, j]);
            }
        }
    }

    attachConnectors(numInCons, numOutCons, holderBtn) {
    }

    attachWireListener(con, conID) {
        if (typeof conID !== 'string') {
            console.error('Invalid connectionId type in attachClickListener:', conID);
            return;
        }
        con.addEventListener('click', function () {
            if (!wireBlocker) {
                if (!isDrawingWire) {
                    startDrawingWire(conID);
                } else {
                    endDrawingWire(conID);
                }
            }

        });

    }

    attachProbeListener(con, conID) {
        con.addEventListener('click', function () {
            if (ProbeOn) {
                if (currentProbeBool) {
                    placeCurrentProbe(conID, con);
                    currentProbeBool = false;
                    ProbeOn = false;
                    wireBlocker = false;
                    return;
                }
                if (NegativeProbe) {
                    currNegProbe = placeNegProbe(conID, con);
                    updateProbeEquations();
                    //updatePosProbe(currPosProbe);
                    //updateNegProbe(currNegProbe);
                }
                else {
                    //place positive probe
                    currPosProbe = placePosProbe(conID, con);
                }
            }
        })
    }


    Style(connector) { //basic styling for every connector, dont change unless required, if u do change, keep this
        connector.style.backgroundImage = `url("images/CONNECTOR.svg")`;
        connector.style.backgroundSize = 'cover';
        connector.style.backgroundPosition = 'center';
        connector.style.backgroundColor = "transparent";
        connector.style.border = "none";
        connector.style.position = "absolute";
        connector.style.width = "10px"; // Set width
        connector.style.height = "10px"; // Set height
    }
    //positional attachers, can change for each class, empty in parent (volt needs a left/right)
    //ground would need just a top etc.
    attachLeft(con) {
        con.style.left = "-10px"; // Adjust as needed to move it to the left of the main button
        con.style.top = "50%";
        con.style.transform = "translateY(-50%)";
        con.classList.add("left-connector");
    }
    attachRight(con) {
        con.style.right = "-10px"; // Adjust as needed to move it to the right of the main button
        con.style.top = "50%";
        con.style.transform = "translateY(-50%)";
        con.classList.add("right-connector");
    }
    attachTop(con) {
        con.style.top = "-9px"; // Adjust as needed to move it above the main button
        con.style.left = "50%";
        con.style.transform = "translateX(-50%)";
        con.classList.add("top-connector");
    }
    attachBot(con) {
        con.style.bottom = "-7px"; // Adjust as needed to move it below the main button
        con.style.left = "50%";
        con.style.transform = "translateX(-45%)";
        con.classList.add("bot-connector");
    }

    displayModifiableValues() {

    }

    updateEquation() {
        this.equation = this.name;
        groupMap.forEach((sharedValue, connection) => {
            // Check if the component is mentioned in the connection
            if (connection.includes(this.name)) {
                // Append the shared value (group number) to the equation
                this.equation += " " + sharedValue.value;
            }
        });

        // Clean up equation (remove trailing space) and log the updated equation
        this.equation = this.equation.trim();
        console.log(`${this.id} equation updated to: ${this.equation}`);
    }

    getModel() {

    }
    
    setModel() {

    }

}