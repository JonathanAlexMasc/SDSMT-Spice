class PJFET extends BaseTransistor {
    static PJFET_ID = 0;

    constructor(posx = '500px', posy = '500px') {
        super();
        this.x = posx;
        this.y = posy;
        this.intX = parseInt(this.x, 10);
        this.intY = parseInt(this.y, 10);
        this.name = "QPJFET" + ++PJFET.PJFET_ID;
        this.imgSrc = "images/Transistor/P-Channel_FET_5W.svg";
        this.modelName = `QPJFET_model_${PJFET.PJFET_ID}`;
        this.info = this.modelName;
        this.equation = this.name;
        this.Currconnections = [];

        // PJFET Model Properties
        this.L = 1e-6;        // Channel length (meters)
        this.W = 1e-6;        // Channel width (meters)
        this.VTO = -1.0;      // Threshold voltage (V)
        this.BETA = 100e-6;   // Transconductance parameter (A/V^2)
        this.GAMMA = 0.5;     // Body effect coefficient (V^1/2)
        this.PHI = 0.7;       // Surface potential (V)
        this.LAMBDA = 0.02;   // Channel-length modulation (1/V)
        this.IS = 1e-14;      // Saturation current (A)

        // Model netlist definition
        this.model = `.model ${this.modelName} PJFET (L=${this.L} W=${this.W} VTO=${this.VTO} BETA=${this.BETA} GAMMA=${this.GAMMA} PHI=${this.PHI} LAMBDA=${this.LAMBDA} IS=${this.IS})`;

        this.blockNodes();
        this.buildComponent();
        this.updateCoordinates(this.x, this.y);
    }

    displayModifiableValues() {
        const modal = document.createElement('div');
        modal.classList.add('modal', 'fade');
        modal.id = `pjfetModal${PJFET.PJFET_ID}`;
        modal.tabIndex = -1;
        modal.innerHTML = `
        <style>
            ${this.style}
        </style>
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">PJFET Model Parameters</h5>
                </div>
                <div class="modal-body">
                    ${this.createInputField("L", "Channel Length", this.L, "m")}
                    ${this.createInputField("W", "Channel Width", this.W, "m")}
                    ${this.createInputField("VTO", "Threshold Voltage", this.VTO, "V")}
                    ${this.createInputField("BETA", "Process Transconductance", this.BETA, "A/V^2")}
                    ${this.createInputField("GAMMA", "Body Effect Parameter", this.GAMMA, "V^1/2")}
                    ${this.createInputField("PHI", "Surface Inversion Potential", this.PHI, "V")}
                    ${this.createInputField("LAMBDA", "Channel-Length Modulation", this.LAMBDA, "1/V")}
                    ${this.createInputField("IS", "Saturation Current", this.IS, "A")}
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
        const params = ["L", "W", "VTO", "BETA", "GAMMA", "PHI", "LAMBDA", "IS"];
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
        this.model = `.model ${this.modelName} PJFET (L=${this.L} W=${this.W} VTO=${this.VTO} BETA=${this.BETA} GAMMA=${this.GAMMA} PHI=${this.PHI} LAMBDA=${this.LAMBDA} IS=${this.IS})`;
    }

    setModel(modelString) {
        // Regular expression to match model name and NJFET parameters
        const regex = /(?<modelName>\w+)\s+\(L=(?<L>\d*\.?\d+e?-?\d*)\s+W=(?<W>\d*\.?\d+e?-?\d*)\s+VTO=(?<VTO>\d*\.?\d+)\s+BETA=(?<BETA>\d*\.?\d+e?-?\d*)\s+GAMMA=(?<GAMMA>\d*\.?\d+)\s+PHI=(?<PHI>\d*\.?\d+)\s+LAMBDA=(?<LAMBDA>\d*\.?\d+)\s+IS=(?<IS>\d*\.?\d+e?-?\d*)\)/;
        const match = modelString.match(regex);

        if (match) {
            const modelName = match.groups.modelName; // Extracts model name (e.g., "2N2222")
            const lValue = match.groups.L || this.L; // Extracts L value or defaults to the instance L
            const wValue = match.groups.W || this.W; // Extracts W value or defaults to the instance W
            const vtoValue = match.groups.VTO || this.VTO; // Extracts VTO value or defaults to the instance VTO
            const betaValue = match.groups.BETA || this.BETA; // Extracts BETA value or defaults to the instance BETA
            const gammaValue = match.groups.GAMMA || this.GAMMA; // Extracts GAMMA value or defaults to the instance GAMMA
            const phiValue = match.groups.PHI || this.PHI; // Extracts PHI value or defaults to the instance PHI
            const lambdaValue = match.groups.LAMBDA || this.LAMBDA; // Extracts LAMBDA value or defaults to the instance LAMBDA
            const isValue = match.groups.IS || this.IS; // Extracts IS value or defaults to the instance IS

            // Sets the NJFET model properties
            this.L = parseFloat(lValue);
            this.W = parseFloat(wValue);
            this.VTO = parseFloat(vtoValue);
            this.BETA = parseFloat(betaValue);
            this.GAMMA = parseFloat(gammaValue);
            this.PHI = parseFloat(phiValue);
            this.LAMBDA = parseFloat(lambdaValue);
            this.IS = parseFloat(isValue);
            this.modelName = modelName; // Sets model name

            // Update the model netlist definition with the extracted values
            this.model = `.model ${modelName} NJFET (L=${this.L} W=${this.W} VTO=${this.VTO} BETA=${this.BETA} GAMMA=${this.GAMMA} PHI=${this.PHI} LAMBDA=${this.LAMBDA} IS=${this.IS})`;
        } else {
            console.log("No match found for NJFET model string");
        }
    }
    
    static resetID() {
        PJFET.PJFET_ID = 0;
    }
}

window.PJFET = PJFET;

export function AddPJFET(posx, posy) {
    return new PJFET(posx, posy);
}
