export class Thyristor extends Entities {
    static id = 0;
    static setID(value) {
        this.id = value;
    }

    constructor(posx = '500px', posy = '500px') {
        super();
        this.name = "Thyristor" + ++Thyristor.id;
        this.imgSrc = "images/Diode/diode.svg"; // Adjust with appropriate image path
        this.x = posx;
        this.y = posy;
        this.intX = parseInt(this.x, 10);
        this.intY = parseInt(this.y, 10);
        this.numInCons = 1;
        this.numOutCons = 1;
        this.Currconnections = [];
        this.modelName = `Thyristor_MODEL_${Thyristor.id}`;
        this.info = this.modelName;
        this.equation = this.name;

        // Thyristor Model Properties
        this.VGT = 0.5;   // Gate ON Trigger Voltage (V)
        this.VGF = 0.3;   // Gate OFF Trigger Voltage (V)
        this.IH = 0.001;  // Holding Current (A)
        this.VF = 1.2;    // Forward Voltage Drop (V)
        this.RON = 0.1;   // On Resistance (Ohms)
        this.ROFF = 1000; // Off Resistance (Ohms)

        // Updated model with all parameters
        this.model = `.MODEL ${this.modelName} THYRISTOR(VGT=${this.VGT} VGF=${this.VGF} IH=${this.IH} VF=${this.VF} RON=${this.RON} ROFF=${this.ROFF})`;

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
            this.attachLeft(con);
            this.Style(con); // makes a connector on the left
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
            this.attachRight(con); // attaches on the bot
            this.Style(con); // styles the connector (adds img, size, etc)
            this.connectors.push(con);
        }
    }

    attachRight(button2) {
        button2.style.right = "-10px"; // Adjust as needed to move it to the right of the main button
        button2.style.top = "50%";
        button2.style.transform = "translateY(-50%)";
        button2.classList.add("right-connector");
    }

    attachLeft(button) {
        button.style.left = "-10px"; // Adjust as needed to move it to the left of the main button
        button.style.top = "50%";
        button.style.transform = "translateY(-50%)";
        button.classList.add("left-connector");
    }

    static resetID() {
        Thyristor.id = 0;
    }

    displayModifiableValues() {
        const modal = document.createElement('div');
        modal.classList.add('modal', 'fade');
        modal.id = `ThyristorModal${Thyristor.id}`;
        modal.tabIndex = -1;

        modal.innerHTML = `
            <style>
            /* Modal Styling */
            .modal-dialog {
                max-width: 500px;
                margin: 30px auto;
            }

            .modal-content {
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                background-color: #fff;
                border: 1px solid #ccc;
            }

            .modal-header {
                background-color: #6c757d;
                color: white;
                border-bottom: 1px solid #ccc;
                padding: 15px;
            }

            .modal-title {
                font-size: 1.25rem;
                font-weight: 600;
            }

            .modal-body {
                padding: 20px;
                background-color: #f9f9f9;
                display: flex;
                flex-direction: column;
            }

            .input-group {
                margin-bottom: 20px;
                display: flex;
                align-items: center;
            }

            .input-group .form-label {
                font-weight: 500;
                font-size: 1rem;
                margin-bottom: 0;
                display: inline-block;
            }

            .input-group .form-control {
                border-radius: 5px;
                padding: 10px;
                font-size: 1rem;
                width: 70%;
                margin-right: 20px;
            }

            .input-group .unit-label {
                font-size: 1rem;
                color: #6c757d;
                margin-left: 20px;
            }

            .input-group .form-control:focus {
                border-color: #007bff;
                box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
            }

            .modal-footer {
                display: flex;
                justify-content: flex-end;
                padding: 10px;
            }

            .btn {
                border-radius: 5px;
                padding: 10px 20px;
                font-size: 1rem;
            }

            .btn-secondary {
                background-color: #6c757d;
                color: white;
            }

            .btn-secondary:hover {
                background-color: #5a6268;
            }
            </style>

            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Modify Thyristor Params</h5>
                    </div>
                    <div class="modal-body">
                        <div class="input-group mb-3">
                            <label for="gateOnTriggerVoltage" class="form-label">Gate ON Trigger Voltage (VGT)</label>
                            <input type="number" class="form-control" id="gateOnTriggerVoltage" value="${this.VGT}" aria-label="Gate ON Trigger Voltage">
                            <span class="unit-label">V</span>
                        </div>
                        <div class="input-group mb-3">
                            <label for="gateOffTriggerVoltage" class="form-label">Gate OFF Trigger Voltage (VGF)</label>
                            <input type="number" class="form-control" id="gateOffTriggerVoltage" value="${this.VGF}" aria-label="Gate OFF Trigger Voltage">
                            <span class="unit-label">V</span>
                        </div>
                        <div class="input-group mb-3">
                            <label for="holdingCurrent" class="form-label">Holding Current (IH)</label>
                            <input type="number" class="form-control" id="holdingCurrent" value="${this.IH}" aria-label="Holding Current">
                            <span class="unit-label">A</span>
                        </div>
                        <div class="input-group mb-3">
                            <label for="forwardVoltageDrop" class="form-label">Forward Voltage Drop (VF)</label>
                            <input type="number" class="form-control" id="forwardVoltageDrop" value="${this.VF}" aria-label="Forward Voltage Drop">
                            <span class="unit-label">V</span>
                        </div>
                        <div class="input-group mb-3">
                            <label for="onResistance" class="form-label">On Resistance (RON)</label>
                            <input type="number" class="form-control" id="onResistance" value="${this.RON}" aria-label="On Resistance">
                            <span class="unit-label">Ω</span>
                        </div>
                        <div class="input-group mb-3">
                            <label for="offResistance" class="form-label">Off Resistance (ROFF)</label>
                            <input type="number" class="form-control" id="offResistance" value="${this.ROFF}" aria-label="Off Resistance">
                            <span class="unit-label">Ω</span>
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
        const gateOnTriggerVoltage = modal.querySelector('#gateOnTriggerVoltage');
        gateOnTriggerVoltage.addEventListener('input', () => {
            this.VGT = parseFloat(gateOnTriggerVoltage.value);
            this.model = `.MODEL ${this.modelName} THYRISTOR(VGT=${this.VGT} VGF=${this.VGF} IH=${this.IH} VF=${this.VF} RON=${this.RON} ROFF=${this.ROFF})`;
        });

        const gateOffTriggerVoltage = modal.querySelector('#gateOffTriggerVoltage');
        gateOffTriggerVoltage.addEventListener('input', () => {
            this.VGF = parseFloat(gateOffTriggerVoltage.value);
            this.model = `.MODEL ${this.modelName} THYRISTOR(VGT=${this.VGT} VGF=${this.VGF} IH=${this.IH} VF=${this.VF} RON=${this.RON} ROFF=${this.ROFF})`;
        });

        const holdingCurrent = modal.querySelector('#holdingCurrent');
        holdingCurrent.addEventListener('input', () => {
            this.IH = parseFloat(holdingCurrent.value);
            this.model = `.MODEL ${this.modelName} THYRISTOR(VGT=${this.VGT} VGF=${this.VGF} IH=${this.IH} VF=${this.VF} RON=${this.RON} ROFF=${this.ROFF})`;
        });

        const forwardVoltageDrop = modal.querySelector('#forwardVoltageDrop');
        forwardVoltageDrop.addEventListener('input', () => {
            this.VF = parseFloat(forwardVoltageDrop.value);
            this.model = `.MODEL ${this.modelName} THYRISTOR(VGT=${this.VGT} VGF=${this.VGF} IH=${this.IH} VF=${this.VF} RON=${this.RON} ROFF=${this.ROFF})`;
        });

        const onResistance = modal.querySelector('#onResistance');
        onResistance.addEventListener('input', () => {
            this.RON = parseFloat(onResistance.value);
            this.model = `.MODEL ${this.modelName} THYRISTOR(VGT=${this.VGT} VGF=${this.VGF} IH=${this.IH} VF=${this.VF} RON=${this.RON} ROFF=${this.ROFF})`;
        });

        const offResistance = modal.querySelector('#offResistance');
        offResistance.addEventListener('input', () => {
            this.ROFF = parseFloat(offResistance.value);
            this.model = `.MODEL ${this.modelName} THYRISTOR(VGT=${this.VGT} VGF=${this.VGF} IH=${this.IH} VF=${this.VF} RON=${this.RON} ROFF=${this.ROFF})`;
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
}

window.Thyristor = Thyristor;

export function AddThyristor(posx, posy) {
    return new Thyristor(posx, posy);
}
