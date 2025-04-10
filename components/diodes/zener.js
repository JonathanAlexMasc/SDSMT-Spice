export class Zener extends BaseDiode {
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
        this.name = "DZener" + ++Zener.id;
        this.imgSrc = "images/Diode/zen-diode.svg";
        this.modelName = `Z_MODEL_${Zener.id}`;
        this.info = this.modelName
        this.equation = this.name;
        this.Currconnections = [];

        // ZENER MODEL PROPERTIES
        this.IS = 1e-14
        this.N = 1.0
        this.BV = 5.1
        this.IBV = 1

        this.model = `.MODEL ${this.modelName} D(IS=${this.IS} N=${this.N} BV=${this.BV} IBV=${this.IBV})`;

        this.blockNodes();
        this.buildComponent();
        this.updateCoordinates(this.x, this.y);
    }

    static resetID() {
        Zener.id = 0;
    }

    displayModifiableValues() {
        const modal = document.createElement('div');
        modal.classList.add('modal', 'fade');
        modal.id = `zenerModal${Zener.id}`;
        modal.tabIndex = -1;

        modal.innerHTML = `
    <style>
        ${this.style}
    </style>

    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Modify Zener Params</h5>
            </div>
            <div class="modal-body">
                <div class="input-group mb-3">
                    <label for="IS" class="form-label">Reverse Saturation Current (IS)</label>
                    <input type="number" class="form-control" id="IS" value="${this.IS}" aria-label="Reverse Saturation Current">
                    <span class="unit-label">A</span> <!-- Unit label for amperes -->
                </div>
                <div class="input-group mb-3">
                    <label for="N" class="form-label">Emission Coefficient (N)</label>
                    <input type="number" class="form-control" id="N" value="${this.N}" aria-label="Emission Coefficient">
                    <span class="unit-label">No units</span> <!-- Unit label -->
                </div>
                <div class="input-group mb-3">
                    <label for="bv" class="form-label">Breakdown Voltage (BV)</label>
                    <input type="number" class="form-control" id="bv" value="${this.BV}" aria-label="Breakdown Voltage">
                    <span class="unit-label">V</span> <!-- Unit label for volts -->
                </div>
                <div class="input-group mb-3">
                    <label for="ibv" class="form-label">Reverse Breakdown Current (IBV)</label>
                    <input type="number" class="form-control" id="ibv" value="${this.IBV}" aria-label="Reverse Breakdown Current">
                    <span class="unit-label">A</span> <!-- Unit label for amperes -->
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
        const IS = modal.querySelector('#IS');
        IS.addEventListener('input', () => {
            this.IS = parseFloat(IS.value);
            this.model = `.MODEL ${this.modelName} D(IS=${this.IS} N=${this.N} BV=${this.BV} IBV=${this.IBV})`;
        });

        const N = modal.querySelector('#N');
        N.addEventListener('input', () => {
            this.N = parseFloat(N.value);
            this.model = `.MODEL ${this.modelName} D(IS=${this.IS} N=${this.N} BV=${this.BV} IBV=${this.IBV})`;
        });

        const bv = modal.querySelector('#bv');
        bv.addEventListener('input', () => {
            this.BV = parseFloat(bv.value);
            this.model = `.MODEL ${this.modelName} D(IS=${this.IS} N=${this.N} BV=${this.BV} IBV=${this.IBV})`;
        })

        const ibv = modal.querySelector('#ibv');
        ibv.addEventListener('input', () => {
            this.IBV = parseFloat(ibv.value);
            this.model = `.MODEL ${this.modelName} D(IS=${this.IS} N=${this.N} BV=${this.BV} IBV=${this.IBV})`;
        })        

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
        // Regular expression to match model name, IS, N, BV, and IBV parameters
        const regex = /\.MODEL\s+(\S+)\s+D\((?:.*?IS=([\d.eE+-]+))?(?:.*?N=([\d.eE+-]+))?(?:.*?BV=([\d.eE+-]+))?(?:.*?IBV=([\d.eE+-]+))?\)/i;
        const match = modelString.match(regex);

        if (match) {
            const modelName = match[1]; // Extracts model name
            const isValue = match[2] ? parseFloat(match[2]) : this.IS; // Extracts IS value or keeps default
            const nValue = match[3] ? parseFloat(match[3]) : this.N; // Extracts N value or keeps default
            const bvValue = match[4] ? parseFloat(match[4]) : this.BV; // Extracts BV value or keeps default
            const ibvValue = match[5] ? parseFloat(match[5]) : this.IBV; // Extracts IBV value or keeps default

            // Update object properties
            this.modelName = modelName;
            this.IS = isValue;
            this.N = nValue;
            this.BV = bvValue;
            this.IBV = ibvValue;

            // Update the model string
            this.model = `.MODEL ${modelName} D(IS=${this.IS} N=${this.N} BV=${this.BV} IBV=${this.IBV})`;
        } else {
            console.log("No match found");
        }
    }

}

window.Zener = Zener;

export function AddZener(posx, posy) {
    return new Zener(posx, posy);
}


