// Class for Voltage Source, extends Entities
class DCCURR extends Entities {
    static DCCURRID = 0;
    constructor(posx = '500px', posy = '500px') {
        super();
        this.name = "ID" + ++DCCURR.DCCURRID; // Unique name for each Volt instance
        this.imgSrc = "images/Voltage/CurrentSources/DC_Curr.svg";        // Image path for Volt
        this.x = posx;
        this.y = posy;
        this.intX = parseInt(this.x, 10);
        this.intY = parseInt(this.y, 10);
        this.numInCons = 1;
        this.numOutCons = 1;
        this.info = null;
        this.VoltageInput = 3.3;
        this.equation = this.name;
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
        for (let i = 0; i < numOutCons; i++) {
            const con = document.createElement("button");
            con.id = this.name + "-connector" + conIDCounter++;
            con.className = "out-connector";
            con.classList.add("out-connector-" + i);
            holderBtn.appendChild(con);
            this.attachWireListener(con, con.id);
            this.attachProbeListener(con, con.id);
            this.attachBot(con); //attaches on the bot
            this.Style(con); //styles the connector (adds img, size, etc)
            this.connectors.push(con);
        }
    }

    attachBot(con) {
        con.style.bottom = "-7px"; // Adjust as needed to move it below the main button
        con.style.left = "50%";
        con.style.transform = "translateX(-45%)";
        con.classList.add("bot-connector");
    }
    attachTop(con) {
        con.style.top = "-9px"; // Adjust as needed to move it above the main button
        con.style.left = "50%";
        con.style.transform = "translateX(-50%)";
        con.classList.add("top-connector");
    }

    displayModifiableValues() {
        const modal = document.createElement('div');
        modal.classList.add('modal', 'fade');
        modal.id = "ACModal";
        modal.tabIndex = -1;

        modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Modify DC Current Values</h5>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <label for="DCVoltageInput">DC Voltage Value:</label>
                        <input type="text" class="form-control" id="DCVoltageInput" value="${this.VoltageInput}" aria-label="DC voltage Value">
                    </div>
                </div>
            </div>
        </div>
    `;

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        const DCVoltInput = modal.querySelector('#DCVoltageInput');
        DCVoltInput.addEventListener('input', () => {
            this.VoltageInput = DCVoltInput.value;
            this.updateInfo();
            console.log(this.VoltageInput, "We're here @ DCVoltage Info");
            this.updateInfoBox();
        });

        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    updateInfo() {
        this.info = "DC " + this.VoltageInput;
    }

    static resetID() {
        DCCURR.DCCURRID = 0;
    }
}

window.DCCURR = DCCURR;

export function AddDCcurrentSource(posx, posy) {
    return new DCCURR(posx, posy);
}