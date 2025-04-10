class NPN extends BaseTransistor {
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
        this.name = "QNPN" + ++NPN.id;
        this.imgSrc = "images/Transistor/NPN_BJT_Transistor_5W.svg";
        
        this.modelName = `QNPN_model_${NPN.id}`
        this.info = this.modelName;
        this.equation = this.name;
        this.Currconnections = [];

        // Transistor Model Properties
        this.IS = 1e-16     // transportation saturation current
        this.BF = 100       // max forward beta
        this.NF = 1         // forward current Max Forward Beta
        this.VAF = 1e30     // forward Forward Early Voltage

        // Model netlist definition
        this.model = `.model ${this.modelName} NPN (IS=${this.IS} BF=${this.BF} NF=${this.NF} VAF=${this.VAF})`

        this.blockNodes();
        this.buildComponent();
        this.updateCoordinates(this.x, this.y);
    }

    displayModifiableValues() {
        const modal = document.createElement('div');
        modal.classList.add('modal', 'fade');
        modal.id = `npnModal${NPN.id}`;
        modal.tabIndex = -1;

        modal.innerHTML = `
    <style>
        ${this.style}
    </style>

    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Transistor Model</h5>
            </div>
            <div class="modal-body">
                ${this.createInputField("IS", "Reverse Saturation Current (IS)", this.IS, "A")}
                ${this.createInputField("BF", "Max Forward Beta (BF)", this.BF, "No units")}
                ${this.createInputField("NF", "Forward Current Emission Coefficient (NF)", this.NF, "No units")}
                ${this.createInputField("VAF", "Forward Early Voltage (VAF)", this.VAF, "V")}
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
        const params = ["IS", "BF", "NF", "VAF"];
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
        this.model = `.model ${this.modelName} NPN (IS=${this.IS} BF=${this.BF} NF=${this.NF} VAF=${this.VAF})`;
    }

    setModel(modelString) {
        // Regular expression to match model name, IS, BF, NF, and VAF parameters
        const regex = /(?<modelName>\w+)\s+\(IS=(?<IS>\d+)\s+BF=(?<BF>\d+)\s+NF=(?<NF>\d+)\s+VAF=(?<VAF>\d+)\)/;
        const match = modelString.match(regex);

        if (match) {
            const modelName = match[1]; // Extracts model name (e.g., "2N2222")
            const isValue = match[2] || this.IS; // Extracts IS value or defaults to the instance IS
            const bfValue = match[3] || this.BF; // Extracts BF value or defaults to the instance BF
            const nfValue = match[4] || this.NF; // Extracts NF value or defaults to the instance NF
            const vafValue = match[5] || this.VAF; // Extracts VAF value or defaults to the instance VAF

            this.IS = parseFloat(isValue);  // Sets IS
            this.BF = parseFloat(bfValue);  // Sets BF
            this.NF = parseFloat(nfValue);  // Sets NF
            this.VAF = parseFloat(vafValue);  // Sets VAF
            this.modelName = modelName;  // Sets model name

            // Update model netlist definition with the extracted values
            this.model = `.model ${modelName} NPN (IS=${this.IS} BF=${this.BF} NF=${this.NF} VAF=${this.VAF})`;
        } else {
            console.log("No match found for model string");
        }
    }

    static resetID() {
        NPN.id = 0;
    }
}

window.NPN = NPN;

export function AddNPN(posx, posy) {
    return new NPN(posx, posy);
}