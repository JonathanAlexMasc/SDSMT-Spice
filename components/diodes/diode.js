export class Diode extends BaseDiode {
    static diodeID = 0;

    constructor(posx = '500px', posy = '500px') {
        super();
        this.x = posx;
        this.y = posy;
        this.intX = parseInt(this.x, 10);
        this.intY = parseInt(this.y, 10);
        this.name = "D" + ++Diode.diodeID;
        this.imgSrc = "images/Diode/diode.svg";
        this.modelName = `D_MODEL_${Diode.diodeID}`;
        this.info = this.modelName;
        this.equation = this.name;
        this.Currconnections = [];
        
        // DIODE MODEL PROPERTIES
        this.reverseSaturationCurrent = 1e-14
        this.emissionCoeff = 1.0
        
        // Model netlist definition
        this.model = `.MODEL ${this.modelName} D(IS=${this.reverseSaturationCurrent} N=${this.emissionCoeff})`;

        this.blockNodes();
        this.buildComponent();
        this.updateCoordinates(this.x, this.y);
    }

    static resetID() {
        Diode.diodeID = 0;
    }

    displayModifiableValues() {
        const modal = document.createElement('div');
        modal.classList.add('modal', 'fade');
        modal.id = `diodeModal${Diode.diodeID}`;
        modal.tabIndex = -1;
        modal.innerHTML = `
    <style>
        ${this.style}
    </style>

    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Modify Diode Params</h5>
            </div>
            <div class="modal-body">
                <div class="input-group mb-3">
                    <label for="reverseSaturationCurrent" class="form-label">Reverse Saturation Current (IS)</label>
                    <input type="number" class="form-control" id="reverseSaturationCurrent" value="${this.reverseSaturationCurrent}" aria-label="Reverse Saturation Current">
                    <span class="unit-label">A</span> <!-- Unit label for amperes -->
                </div>
                <div class="input-group mb-3">
                    <label for="emissionCoeff" class="form-label">Emission Coefficient (N)</label>
                    <input type="number" class="form-control" id="emissionCoeff" value="${this.emissionCoeff}" aria-label="Emission Coefficient">
                    <span class="unit-label">No units</span> <!-- Emission Coefficient doesn't have a specific unit -->
                </div>
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

        // Handling input changes
        const reverseSaturationCurrentInput = modal.querySelector('#reverseSaturationCurrent');
        reverseSaturationCurrentInput.addEventListener('input', () => {
            this.reverseSaturationCurrent = parseFloat(reverseSaturationCurrentInput.value);
            this.model = `.MODEL ${this.modelName} D(IS=${this.reverseSaturationCurrent} N=${this.emissionCoeff})`;
        });

        const emissionCoeffInput = modal.querySelector('#emissionCoeff');
        emissionCoeffInput.addEventListener('input', () => {
            this.emissionCoeff = parseFloat(emissionCoeffInput.value);
            this.model = `.MODEL ${this.modelName} D(IS=${this.reverseSaturationCurrent} N=${this.emissionCoeff})`;
        });

        const closeBtn = modal.querySelector('#close');
        closeBtn.addEventListener('click', () => {
            bootstrapModal.hide()
            modal.remove();
        });

        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    setModel(modelString) {
        // Regular expression to match model name, IS, and N parameters
        const regex = /\.MODEL\s+(\S+)\s+D\((?:.*?IS=([\d.eE+-]+))?(?:.*?N=([\d.eE+-]+))?\)/i;
        const match = modelString.match(regex);

        if (match) {
            const modelName = match[1]; // Extracts model name (D_MODEL_1)
            const isValue = match[2] || null; // Extracts IS value
            const nValue = match[3] || null; // Extracts N value

            this.reverseSaturationCurrent = isValue;
            this.emissionCoeff = nValue;
            this.modelName = modelName;
            this.model = `.MODEL ${modelName} D(IS=${isValue} N=${nValue})`;
        } else {
            console.log("No match found");
        }
    }

}

window.Diode = Diode;

export function AddDiode(posx, posy) {
    return new Diode(posx, posy);
}


