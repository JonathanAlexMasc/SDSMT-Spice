class Connector {
    static connectorID = 0;

    constructor() {
        this.connected = false;
        this.name = "Connector" + ++Connector.connectorID; // Unique name for each Connector instance
    }
    
    static resetID() {
        Connector.connectorID = 0;
    }
}

class wireClass {
    static wireID = 0;

    constructor(nodeA = "null", nodeB = 'null') {
        this.wireName = ++wireClass.wireID;
        this.nodeA = nodeA;
        this.nodeB = nodeB;
        //console.log("WireName: " + this.wireName);
    } 

    static resetID() {
        wireClass.wireID = 0;
    }
}


class Node {
    constructor(x, y, gCost = 0, hCost = 0, parent) {
        this.x = x;
        this.y = y;
        this.gCost = gCost;
        this.hCost = hCost;
        this.fCost = gCost + hCost;
        this.parent = null;
    }
}

 // Helper class for priority queue
 class MinHeap {
    constructor() {
        this.heap = [];
    }
    push(node) {
        this.heap.push(node);
        this._bubbleUp(this.heap.length - 1);
    }
    pop() {
        const root = this.heap[0];
        const end = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = end;
            this._sinkDown(0);
        }
        return root;
    }
    _bubbleUp(idx) {
        const element = this.heap[idx];
        const score = element.g + element.h;
        while (idx > 0) {
            const parentIdx = Math.floor((idx - 1) / 2);
            const parent = this.heap[parentIdx];
            if (score >= parent.g + parent.h) break;
            this.heap[idx] = parent;
            idx = parentIdx;
        }
        this.heap[idx] = element;
    }
    _sinkDown(idx) {
        const length = this.heap.length;
        const element = this.heap[idx];
        const score = element.g + element.h;
        while (true) {
            const leftIdx = 2 * idx + 1;
            const rightIdx = 2 * idx + 2;
            let swap = null;
            if (leftIdx < length) {
                const left = this.heap[leftIdx];
                if (left.g + left.h < score) swap = leftIdx;
            }
            if (rightIdx < length) {
                const right = this.heap[rightIdx];
                if ((swap === null && right.g + right.h < score) ||
                    (swap !== null && right.g + right.h < this.heap[swap].g + this.heap[swap].h)) {
                    swap = rightIdx;
                }
            }
            if (swap === null) break;
            this.heap[idx] = this.heap[swap];
            idx = swap;
        }
        this.heap[idx] = element;
    }
}


class Probe {
    //what info does probe need?
    //needs node of connector
    //anything else?
    static probeID = 0;
    constructor(conID = "Base") {
        this.name = "Probe" + ++Probe.probeID;
        this.conID = conID;
        this.info = null;
        
    }
    buildProbe() {
        //if its a voltage probe, i need to build 2
        //build probe
    }
    styleProbe() {
        //style probe
    }
}

class VoltProbe extends Probe {
    static voltProbeID = 0;
    constructor(conID = "VoltProbe", con = null, PosOrNeg = null) {
        super();
        this.conID = conID;
        this.name = conID + "-VoltProbe" + ++VoltProbe.voltProbeID;
        //console.log(this.name);
        this.ConButton = con;
        this.ConID = con.id;
        console.log(this.ConID);
        this.TypeVal = PosOrNeg;
        this.equation = '';
        //console.log('Probe Equation:', this.equation);
        this.posProbeImg = "images/Probe/VoltProbeAlt.svg";
        this.negProbeImg = "images/Probe/VoltProbeAlt-.svg";
        this.buildProbe();
        probeMap.set(this.name, this);
    }
    buildProbe() {
        if(this.TypeVal == false) { //positive probe
            this.imgSrc = this.posProbeImg;
        } else { //negative probe
            this.imgSrc = this.negProbeImg;
        }
        let probeButton = document.createElement("button");
        probeButton.style.position = 'relative'; // Position relative to the parent
        probeButton.style.top = '50%';          // Center vertically
        probeButton.style.right = '0';          // Align to the right edge
        probeButton.style.transform = 'translateY(-85%)'; // Adjust to center vertically
        probeButton.style.backgroundImage = `url("${this.imgSrc}")`;
        probeButton.style.border = "none";
        probeButton.style.width = "30px";
        probeButton.style.height = "30px";
        probeButton.style.backgroundSize = "cover";
        probeButton.style.backgroundPosition = "center";
        probeButton.style.backgroundColor = "transparent";
        this.ConButton.appendChild(probeButton);
    }
    styleProbe() {
        //style probe
    }
}

class CurrentProbe extends Probe {
    static currentProbeID = 0;
    constructor(conID = "CurrentProbe", con = null) {
        super();
        this.conID = conID;
        this.name = conID +"-CurrentProbe" + ++CurrentProbe.currentProbeID;
        this.ConButton = con;
        this.ConID = con.id;
        console.log(this.ConID);
        this.equation = `.probe I(${this.extractComponentName(conID)})`;
        this.CurrentProbeImg = "images/Probe/Current Probe.svg";
        this.buildProbe();
        probeMap.set(this.name, this);
    }

    extractComponentName(conID) {
        // "Resistor1-connector-1"
        let name = conID.match(/[a-zA-Z]+/)[0];  // Extracts "Resistor"
        let number = conID.match(/\d+/)[0];      // Extracts "1" (or any number)
        return name + number;                    // Returns "Resistor1"
    }
    buildProbe() {
        let probeButton = document.createElement("button");
        probeButton.style.position = 'relative'; // Position relative to the parent
        probeButton.style.top = '50%';          // Center vertically
        probeButton.style.right = '0';          // Align to the right edge
        probeButton.style.transform = 'translateY(-85%)'; // Adjust to center vertically
        probeButton.style.backgroundImage = `url("${this.CurrentProbeImg}")`;
        probeButton.style.border = "none";
        probeButton.style.width = "30px";
        probeButton.style.height = "30px";
        probeButton.style.backgroundSize = "cover";
        probeButton.style.backgroundPosition = "center";
        probeButton.style.backgroundColor = "transparent";
        this.ConButton.appendChild(probeButton);
    }

}