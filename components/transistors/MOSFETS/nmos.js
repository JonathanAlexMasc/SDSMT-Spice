class NMOS extends BaseTransistor {
    static id = 0;

    static setID(value) {
        this.id = value;
    }
    constructor(posx = '500px', posy = '500px') {
        super();
        this.x = posx;
        this.y = posy;
        this.intX = parseInt(this.x, 10);
        this.intY = parseInt(this.y, 10);
        this.name = "QNMOS" + ++NMOS.id;
        this.imgSrc = "images/Transistor/N-Channel_MOSFET_5W.svg";
        this.modelName = `QNMOS_model_${NMOS.id}`;
        this.info = this.modelName;
        this.equation = this.name;
        this.Currconnections = [];

        // MOSFET Model Properties
        this.L = 1e-6;        // Channel length (meters)
        this.W = 1e-6;        // Channel width (meters)
        this.VTO = 1.0;       // Threshold voltage (V)
        this.KP = 50e-6;      // Transconductance parameter (A/V^2)
        this.GAMMA = 0.5;     // Body effect coefficient (V^1/2)
        this.PHI = 0.7;       // Surface potential (V)
        this.LAMBDA = 0.02;   // Channel-length modulation (1/V)

        // Model netlist definition
        this.model = `.model ${this.modelName} NMOS (L=${this.L} W=${this.W} VTO=${this.VTO} KP=${this.KP} GAMMA=${this.GAMMA} PHI=${this.PHI} LAMBDA=${this.LAMBDA})`;

        this.blockNodes();
        this.buildComponent();
        this.updateCoordinates(this.x, this.y);
    }

    displayModifiableValues() {
        const modal = document.createElement('div');
        modal.classList.add('modal', 'fade');
        modal.id = `nmosModal${NMOS.id}`;
        modal.tabIndex = -1;
        modal.innerHTML = `
        <style>
            ${this.style}
        </style>
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">NMOS Model Parameters</h5>
            </div>
            <div class="modal-body">
                ${this.createInputField("L", "Channel Length", this.L, "m")}
                ${this.createInputField("W", "Channel Width", this.W, "m")}
                ${this.createInputField("VTO", "Threshold Voltage", this.VTO, "V")}
                ${this.createInputField("KP", "Process Transconductance", this.KP, "A/V^2")}
                ${this.createInputField("GAMMA", "Body Effect Parameter", this.GAMMA, "V^1/2")}
                ${this.createInputField("PHI", "Surface Inversion Potential", this.PHI, "V")}
                ${this.createInputField("LAMBDA", "Channel-Length Modulation", this.LAMBDA, "1/V")}
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="close">Close</button>
            </div>
        </div>
    </div>
    `;

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        this.setupInputListeners(modal, bootstrapModal);
    }

    createInputField(id, label, value, unit) {
        return `
        <div class="input-group mb-3">
            <label for="${id}" class="form-label">${label}</label>
            <input type="number" class="form-control" id="${id}" value="${value}" aria-label="${label}">
            <span class="unit-label">${unit}</span>
        </div>`;
    }

    setupInputListeners(modal, bootstrapModal) {
        const params = ["L", "W", "VTO", "KP", "GAMMA", "PHI", "LAMBDA"];
        params.forEach(param => {
            const input = modal.querySelector(`#${param}`);
            input.addEventListener('input', () => {
                this[param] = parseFloat(input.value);
                this.updateModel();
            });
        });

        modal.querySelector('#close').addEventListener('click', () => {
            bootstrapModal.hide();
            modal.remove();
        });

        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    updateModel() {
        this.model = `.model ${this.modelName} NMOS (L=${this.L} W=${this.W} VTO=${this.VTO} KP=${this.KP} GAMMA=${this.GAMMA} PHI=${this.PHI} LAMBDA=${this.LAMBDA})`;
    }

    setModel(modelString) {
        // Regular expression to match model name and MOSFET parameters
        const regex = /(?<modelName>\w+)\s+\(L=(?<L>\d*\.?\d+e?-?\d*)\s+W=(?<W>\d*\.?\d+e?-?\d*)\s+VTO=(?<VTO>\d*\.?\d+)\s+KP=(?<KP>\d*\.?\d+e?-?\d*)\s+GAMMA=(?<GAMMA>\d*\.?\d+)\s+PHI=(?<PHI>\d*\.?\d+)\s+LAMBDA=(?<LAMBDA>\d*\.?\d+)\)/;
        const match = modelString.match(regex);

        if (match) {
            const modelName = match.groups.modelName; // Extracts model name (e.g., "2N2222")
            const lValue = match.groups.L || this.L; // Extracts L value or defaults to the instance L
            const wValue = match.groups.W || this.W; // Extracts W value or defaults to the instance W
            const vtoValue = match.groups.VTO || this.VTO; // Extracts VTO value or defaults to the instance VTO
            const kpValue = match.groups.KP || this.KP; // Extracts KP value or defaults to the instance KP
            const gammaValue = match.groups.GAMMA || this.GAMMA; // Extracts GAMMA value or defaults to the instance GAMMA
            const phiValue = match.groups.PHI || this.PHI; // Extracts PHI value or defaults to the instance PHI
            const lambdaValue = match.groups.LAMBDA || this.LAMBDA; // Extracts LAMBDA value or defaults to the instance LAMBDA

            // Sets the MOSFET model properties
            this.L = parseFloat(lValue);
            this.W = parseFloat(wValue);
            this.VTO = parseFloat(vtoValue);
            this.KP = parseFloat(kpValue);
            this.GAMMA = parseFloat(gammaValue);
            this.PHI = parseFloat(phiValue);
            this.LAMBDA = parseFloat(lambdaValue);
            this.modelName = modelName; // Sets model name

            // Update the model netlist definition with the extracted values
            this.model = `.model ${modelName} NMOS (L=${this.L} W=${this.W} VTO=${this.VTO} KP=${this.KP} GAMMA=${this.GAMMA} PHI=${this.PHI} LAMBDA=${this.LAMBDA})`;
        } else {
            console.log("No match found for MOSFET model string");
        }
    }


    static resetID() {
        NMOS.id = 0;
    }
}

window.NMOS = NMOS;

export function AddNMOS(posx, posy) {
    return new NMOS(posx, posy);
}
