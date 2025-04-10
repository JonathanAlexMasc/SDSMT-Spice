export class LED extends BaseDiode {
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
        this.name = "DLED" + ++LED.id;
        this.imgSrc = "images/Diode/led-diode.svg";
        this.modelName = `LED_MODEL_${LED.id}`;
        this.info = this.modelName
        this.equation = this.name;
        this.Currconnections = [];

        // LED MODEL PROPERTIES
        this.IS = 1e-14
        this.N = 1.0
        this.RS = 5
        this.BV = 5.1
        this.CJ0 = 1
        this.M = 0.5
        this.VJ = 0.7
        this.IBV = 10

        // Updated model with all parameters
        this.model = `.MODEL ${this.modelName} D(IS=${this.IS} N=${this.N} RS=${this.RS} BV=${this.BV} CJO=${this.CJ0} M=${this.M} VJ=${this.VJ} IBV=${this.IBV})`;

        this.blockNodes();
        this.buildComponent();
        this.updateCoordinates(this.x, this.y);
    }

    static resetID() {
        LED.id = 0;
    }

    displayModifiableValues() {
        const modal = document.createElement('div');
        modal.classList.add('modal', 'fade');
        modal.id = `LEDModal${LED.id}`;
        modal.tabIndex = -1;

        modal.innerHTML = `
            <style>
                ${this.style}
            </style>

<div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
        <div class="modal-header">
            <h5 class="modal-title">Modify LED Params</h5>
        </div>
        <div class="modal-body">
            <div class="input-group mb-3">
                <label for="reverseSaturationCurrent" class="form-label">Reverse Saturation Current (IS)</label>
                <input type="number" class="form-control" id="reverseSaturationCurrent" value="${this.IS}" aria-label="Reverse Saturation Current">
                <span class="unit-label">A</span> <!-- Add unit here -->
            </div>
            <div class="input-group mb-3">
                <label for="emissionCoeff" class="form-label">Emission Coefficient (N)</label>
                <input type="number" class="form-control" id="emissionCoeff" value="${this.N}" aria-label="Emission Coefficient">
                <span class="unit-label">No units</span> <!-- Emission Coefficient doesn't have specific units -->
            </div>
            <div class="input-group mb-3">
                <label for="seriesResistance" class="form-label">Series Resistance (RS)</label>
                <input type="number" class="form-control" id="seriesResistance" value="${this.RS}" aria-label="Series Resistance">
                <span class="unit-label">Ω</span> <!-- Ohms (Ω) for resistance -->
            </div>
            <div class="input-group mb-3">
                <label for="bv" class="form-label">Breakdown Voltage (BV)</label>
                <input type="number" class="form-control" id="bv" value="${this.BV}" aria-label="Breakdown Voltage">
                <span class="unit-label">V</span> <!-- Volts (V) for breakdown voltage -->
            </div>
            <div class="input-group mb-3">
                <label for="cj0" class="form-label">Zero-Bias Junction Capacitance (CJO)</label>
                <input type="number" class="form-control" id="cj0" value="${this.CJ0}" aria-label="Zero-Bias Junction Capacitance">
                <span class="unit-label">F</span> <!-- Farads (F) for capacitance -->
            </div>
            <div class="input-group mb-3">
                <label for="gradingCoefficient" class="form-label">Grading Coefficient (M)</label>
                <input type="number" class="form-control" id="gradingCoefficient" value="${this.M}" aria-label="Grading Coefficient">
                <span class="unit-label">No units</span> <!-- No specific unit for grading coefficient -->
            </div>
            <div class="input-group mb-3">
                <label for="junctionPotential" class="form-label">Junction Potential (VJ)</label>
                <input type="number" class="form-control" id="junctionPotential" value="${this.VJ}" aria-label="Junction Potential">
                <span class="unit-label">V</span> <!-- Volts (V) for junction potential -->
            </div>
            <div class="input-group mb-3">
                <label for="reverseBreakdownCurrent" class="form-label">Reverse Breakdown Current (IBV)</label>
                <input type="number" class="form-control" id="reverseBreakdownCurrent" value="${this.IBV}" aria-label="Reverse Breakdown Current">
                <span class="unit-label">A</span> <!-- Amperes (A) for reverse breakdown current -->
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
        const reverseSaturationCurrent = modal.querySelector('#reverseSaturationCurrent');
        reverseSaturationCurrent.addEventListener('input', () => {
            this.IS = parseFloat(reverseSaturationCurrent.value);
            this.model = `.MODEL ${this.modelName} D(IS=${this.IS} N=${this.N} RS=${this.RS} BV=${this.BV} CJO=${this.CJ0} M=${this.M} VJ=${this.VJ} IBV=${this.IBV})`;
        });

        const emissionCoeff = modal.querySelector('#emissionCoeff');
        emissionCoeff.addEventListener('input', () => {
            this.N = parseFloat(emissionCoeff.value);
            this.model = `.MODEL ${this.modelName} D(IS=${this.IS} N=${this.N} RS=${this.RS} BV=${this.BV} CJO=${this.CJ0} M=${this.M} VJ=${this.VJ} IBV=${this.IBV})`;
        });

        const seriesResistance = modal.querySelector('#seriesResistance');
        seriesResistance.addEventListener('input', () => {
            this.RS = parseFloat(seriesResistance.value);
            this.model = `.MODEL ${this.modelName} D(IS=${this.IS} N=${this.N} RS=${this.RS} BV=${this.BV} CJO=${this.CJ0} M=${this.M} VJ=${this.VJ} IBV=${this.IBV})`;
        });

        const bv = modal.querySelector('#bv');
        bv.addEventListener('input', () => {
            this.BV = parseFloat(bv.value);
            this.model = `.MODEL ${this.modelName} D(IS=${this.IS} N=${this.N} RS=${this.RS} BV=${this.BV} CJO=${this.CJ0} M=${this.M} VJ=${this.VJ} IBV=${this.IBV})`;
        });

        const cj0 = modal.querySelector('#cj0');
        cj0.addEventListener('input', () => {
            this.CJ0 = parseFloat(cj0.value);
            this.model = `.MODEL ${this.modelName} D(IS=${this.IS} N=${this.N} RS=${this.RS} BV=${this.BV} CJO=${this.CJ0} M=${this.M} VJ=${this.VJ} IBV=${this.IBV})`;
        });

        const gradingCoefficient = modal.querySelector('#gradingCoefficient');
        gradingCoefficient.addEventListener('input', () => {
            this.M = parseFloat(gradingCoefficient.value);
            this.model = `.MODEL ${this.modelName} D(IS=${this.IS} N=${this.N} RS=${this.RS} BV=${this.BV} CJO=${this.CJ0} M=${this.M} VJ=${this.VJ} IBV=${this.IBV})`;
        });

        const junctionPotential = modal.querySelector('#junctionPotential');
        junctionPotential.addEventListener('input', () => {
            this.VJ = parseFloat(junctionPotential.value);
            this.model = `.MODEL ${this.modelName} D(IS=${this.IS} N=${this.N} RS=${this.RS} BV=${this.BV} CJO=${this.CJ0} M=${this.M} VJ=${this.VJ} IBV=${this.IBV})`;
        });

        const reverseBreakdownCurrent = modal.querySelector('#reverseBreakdownCurrent');
        reverseBreakdownCurrent.addEventListener('input', () => {
            this.IBV = parseFloat(reverseBreakdownCurrent.value);
            this.model = `.MODEL ${this.modelName} D(IS=${this.IS} N=${this.N} RS=${this.RS} BV=${this.BV} CJO=${this.CJ0} M=${this.M} VJ=${this.VJ} IBV=${this.IBV})`;
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
        // Regular expression to match model name and all relevant parameters
        const regex = /\.MODEL\s+(\S+)\s+D\((?:.*?IS=([\d.eE+-]+))?(?:.*?N=([\d.eE+-]+))?(?:.*?RS=([\d.eE+-]+))?(?:.*?BV=([\d.eE+-]+))?(?:.*?CJO=([\d.eE+-]+))?(?:.*?M=([\d.eE+-]+))?(?:.*?VJ=([\d.eE+-]+))?(?:.*?IBV=([\d.eE+-]+))?\)/i;
        const match = modelString.match(regex);

        if (match) {
            this.modelName = match[1];
            this.IS = match[2] ? parseFloat(match[2]) : null;
            this.N = match[3] ? parseFloat(match[3]) : null;
            this.RS = match[4] ? parseFloat(match[4]) : null;
            this.BV = match[5] ? parseFloat(match[5]) : null;
            this.CJ0 = match[6] ? parseFloat(match[6]) : null;
            this.M = match[7] ? parseFloat(match[7]) : null;
            this.VJ = match[8] ? parseFloat(match[8]) : null;
            this.IBV = match[9] ? parseFloat(match[9]) : null;

            // Update the model string with extracted values
            this.model = `.MODEL ${this.modelName} D(IS=${this.IS} N=${this.N} RS=${this.RS} BV=${this.BV} CJO=${this.CJ0} M=${this.M} VJ=${this.VJ} IBV=${this.IBV})`;
        } else {
            console.log("No match found");
        }
    }

}

window.LED = LED;

export function AddLED(posx, posy) {
    return new LED(posx, posy);
}


