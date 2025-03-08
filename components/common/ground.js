// Class for Ground (GND), extends Entities
class Gnd extends Entities {
    static gndID = 0;

    constructor(posx = '500px', posy = '500px') {
        super();
        this.name = "Ground" + ++Gnd.gndID; // Unique name for each GND instance
        this.imgSrc = "images/Ground/ground.svg";     // Image path for GND
        this.x = posx;
        this.y = posy;
        this.intX = parseInt(this.x, 10);
        this.intY = parseInt(this.y, 10);
        this.info = null;
        this.equation = "0"; //netlist doesnt see ground, only 0
        this.numInCons = 1;
        this.numOutCons = 0; //not sure how this will work with ground, only 1 connector up top
        this.Currconnections = []; //array to hold what other elements are connected to this one
        this.blockNodes();
        this.buildComponent();
        this.updateCoordinates(this.x, this.y);

    }

    attachConnectors(numInCons, numOutCons, holderBtn) {
        let conIDCounter = 0;
        for (let i = 0; i < numInCons; i++) {
            const con = document.createElement("button");
            con.className = "in-connector";
            con.classList.add("in-connector-" + i);
            con.id = this.name + "-connector" + conIDCounter++;
            holderBtn.appendChild(con);
            this.attachWireListener(con, con.id);
            this.attachProbeListener(con, con.id);
            this.attachTop(con);
            this.Style(con); //makes a connector on the left
            this.connectors.push(con);
        }
    }

    attachTop(con) {
        con.style.top = "-9px"; // Adjust as needed to move it above the main button
        con.style.left = "50%";
        con.style.transform = "translateX(-50%)";
        con.classList.add("top-connector");
    }

    updateEquation() {
        this.equation = "";
    }

    static resetID() {
        Gnd.gndID = 0;
    }
}

window.Gnd = Gnd;

export function AddGround(posx, posy) {
    return new Gnd(posx, posy);
}