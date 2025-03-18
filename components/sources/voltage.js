// Class for Voltage Source, extends Entities
class Volt extends Entities {
    static VoltID = 0;
    constructor(posx = '500px', posy = '500px') {
        super();
        this.name = "V" + ++Volt.VoltID; // Unique name for each Volt instance
        this.imgSrc = "images/Voltage/voltage.svg";        // Image path for Volt
        this.x = posx;
        this.y = posy;
        this.intX = parseInt(this.x, 10);
        this.intY = parseInt(this.y, 10);
        this.numInCons = 1;
        this.numOutCons = 1;
        this.info = null;
        this.WaveType = "SINE";
        this.DCOFFSet = 0;
        this.Frequency = 1;
        this.Amplitude = 1;
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

    updateInfo() {
        this.info = this.WaveType + " " + this.DCOFFSet + " " + this.Amplitude + " " + this.Frequency + " AC 1";
        console.log(this.info);
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
                    <h5 class="modal-title">Modify AC Voltage Values</h5>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <label for="DCOffsetInput">DC Offset:</label>
                        <input type="text" class="form-control" id="DCOffsetInput" value="${this.DCOFFSet}" aria-label="DC Offset Value">
                        <label for="frequencyInput">Frequency:</label>
                        <input type="text" class="form-control" id="frequencyInput" value="${this.Frequency}" aria-label="Frequency Value">
                        <label for="amplitudeInput">Amplitude:</label>
                        <input type="text" class="form-control" id="amplitudeInput" value="${this.Amplitude}" aria-label="Amplitude Value">
                        <select name="waveType" id="waveType">
                            <option value="SINE">SINE</option>
                            <option value="SQUARE">SQUARE</option>
                            <option value="SAWTOOTH">SAWTOOTH</option>
                            <option value="TRIANGLE">TRIANGLE</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    `;

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        const dcOffInput = modal.querySelector('#DCOffsetInput');
        dcOffInput.addEventListener('input', () => {
            this.DCOFFSet = dcOffInput.value;
            this.updateInfo();
        });

        const frequencyInput = modal.querySelector('#frequencyInput');
        frequencyInput.addEventListener('input', () => {
            this.Frequency = frequencyInput.value;
            this.updateInfo();
        });

        const amplitudeInput = modal.querySelector('#amplitudeInput');
        amplitudeInput.addEventListener('input', () => {
            this.Amplitude = amplitudeInput.value;
            this.updateInfo();
        });

        const waveTypeSelect = modal.querySelector('#waveType');

        waveTypeSelect.value = this.WaveType || 'SINE';

        waveTypeSelect.addEventListener('change', () => {
            this.WaveType = waveTypeSelect.value;
            this.updateInfo();
        });

        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });


    }


    updateInfo() {
        this.info = this.WaveType + " " + '(' + this.DCOFFSet + " " + this.Amplitude + " " + this.Frequency + ')' + " AC 1";
        console.log(this.WaveType);
        if (this.WaveType === "SINE") {
            console.log("Were here @ SINE");
            this.imgSrc = "images/Voltage/voltage.svg";
        }
        else if (this.WaveType === "SQUARE") {
            console.log("Were here @ SQUARE");
            this.imgSrc = "images/Voltage/squareVoltage.svg";
        }
        else if (this.WaveType === "TRIANGLE") {
            console.log("Were here @ TRIANGLE");
            this.imgSrc = "images/Voltage/TriVoltage.svg";
            console.log(this.imgSrc);
        }
        let voltButton = document.getElementById('component-button-' + this.name);
        voltButton.style.backgroundImage = `url(${this.imgSrc})`;
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
                    <h5 class="modal-title">Modify AC Voltage Values</h5>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <label for="DCOffsetInput">DC Offset:</label>
                        <input type="text" class="form-control" id="DCOffsetInput" value="${this.DCOFFSet}" aria-label="DC Offset Value">
                        <label for="frequencyInput">Frequency:</label>
                        <input type="text" class="form-control" id="frequencyInput" value="${this.Frequency}" aria-label="Frequency Value">
                        <label for="amplitudeInput">Amplitude:</label>
                        <input type="text" class="form-control" id="amplitudeInput" value="${this.Amplitude}" aria-label="Amplitude Value">
                        <select name="waveType" id="waveType">
                            <option value="SINE">SINE</option>
                            <option value="SQUARE">SQUARE</option>
                            <option value="SAWTOOTH">SAWTOOTH</option>
                            <option value="TRIANGLE">TRIANGLE</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    `;

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        const dcOffInput = modal.querySelector('#DCOffsetInput');
        dcOffInput.addEventListener('input', () => {
            this.DCOFFSet = dcOffInput.value;
            this.updateInfo();
            this.updateInfoBox(); 
        });

        const frequencyInput = modal.querySelector('#frequencyInput');
        frequencyInput.addEventListener('input', () => {
            this.Frequency = frequencyInput.value;
            this.updateInfo();
            this.updateInfoBox(); 
        });

        const amplitudeInput = modal.querySelector('#amplitudeInput');
        amplitudeInput.addEventListener('input', () => {
            this.Amplitude = amplitudeInput.value;
            this.updateInfo();
            this.updateInfoBox(); 
        });

        const waveTypeSelect = modal.querySelector('#waveType');

        waveTypeSelect.value = this.WaveType || 'SINE';

        waveTypeSelect.addEventListener('change', () => {
            this.WaveType = waveTypeSelect.value;
            this.updateInfo();
            this.updateInfoBox(); 
        });

        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }


    static resetID() {
        Volt.VoltID = 0;
    }
}

window.Volt = Volt;

export function AddVoltage(posx, posy) {
    return new Volt(posx, posy);
}