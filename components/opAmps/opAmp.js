class OPAMP extends Entities {
    static OpAmpID = 0;
    constructor(posx = '500px', posy = '500px') {
        // base
        super();
        this.x = posx;
        this.y = posy;
        this.intX = parseInt(this.x, 10);
        this.intY = parseInt(this.y, 10);
        this.name = "xU" + ++OPAMP.OpAmpID;
        this.imgSrc = "images/OpAmp/opAmp.svg";

        this.modelName = `xMODU${OPAMP.OpAmpID}`
        this.info = this.modelName;
        this.equation = this.name;
        this.Currconnections = [];

        // OpAmp Model Props
        this.VOS = 0;
        this.IBS = 0;
        this.IOS = 0;
        this.AVOL = 200000;
        this.BW = 100000000;
        this.RI = 10000000;
        this.RO = 10;
        this.VOMP = 12;
        this.VOMN = -12;

        // Subcircuit
        this.subckt = `.SUBCKT ${this.modelName} in_pos in_neg out PARAMS: AVOL=500k BW=10Meg RI=10Meg RO=0 VOS=0 IBS=0 IOS=0 VOMP=15 VOMN=-15`

        // input stage
        this.inStage = `VOS in_pos 4 ${this.VOS}\nIbias1 4 0 ${this.IBS}\nIbias2 4 0 ${this.IBS}\nIos 4 in_neg ${this.IOS/2}\nRin 4 in_neg ${this.RI}`
        
        // middle stage
        this.midStage = `Bgain 0 6 I=v(4,in_neg)*${this.AVOL}/1meg\nR1 6 0 1meg\nCP1 6 0 ${this.AVOL}/(2*pi*1meg*${this.BW})\nVpos 9 0 ${this.VOMP}\nDlimit_pos 6 9 d1\nVneg 10 0 ${this.VOMN}\nDlimit_neg 10 6 d1\n.model d1 d(n=0.1)`

        // output stage
        this.outStage = `E2 7 0 6 0 1\nRout 7 out ${this.RO}\n.ends`

        // component building 
        this.hasModel = true;
        this.numInCons = 2;
        this.numOutCons = 1;
        this.style = `/* Modal Styling */
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

        /* Remove flex from input group and stack label and input vertically */
        .input-group {
            margin-bottom: 20px;
            display: flex;
            align-items: center; /* Align input and unit label in a row */
        }

        /* Set fixed width for labels */
        .input-group .form-label {
            font-weight: 500;
            font-size: 1rem;
            margin-bottom: 0;
            width: 70%; /* Adjust width of label */
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
            margin-left: 10px; /* Space between input field and unit label */
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
        }`

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
            this.attachLeft(con, numInCons, i);
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
            this.attachRight(con, numOutCons, i); //attaches on the bot
            this.Style(con); //styles the connector (adds img, size, etc)
            this.connectors.push(con);
        }
    }

    attachRight(con, numCons, i) {
        if (numCons == 2) {
            if (i == 0) {
                con.style.top = "25%";
            }
            else {
                con.style.top = "75%";
            }
        }

        else {
            con.style.top = "50%";
        }

        con.style.right = "-10px";
        con.style.transform = "translateY(-50%)";
        con.classList.add("right-connector");
    }

    attachLeft(con, numCons, i) {
        if (numCons == 2) {
            if (i == 0) {
                con.style.top = "25%";
            } else {
                con.style.top = "75%";
            }
        } else {
            con.style.top = "50%";
        }

        con.style.left = "-10px"; // Adjust as needed to move it to the left of the main button
        con.style.transform = "translateY(-50%)";
        con.classList.add("left-connector");
    }

    attachTop(con, numCons, i) {
        if (numCons == 2) {
            if (i == 0) {
                con.style.left = "25%";
            } else {
                con.style.left = "75%";
            }
        } else {
            con.style.left = "50%";
        }

        con.style.top = "-9px"; // Adjust as needed to move it above the main button
        con.style.transform = "translateX(-50%)";
        con.classList.add("top-connector");
    }

    attachBot(con, numCons, i) {
        if (numCons == 2) {
            if (i == 0) {
                con.style.left = "25%";
            } else {
                con.style.left = "75%";
            }
        } else {
            con.style.left = "50%";
        }

        con.style.bottom = "-7px"; // Adjust as needed to move it below the main button
        con.style.transform = "translateX(-50%)";
        con.classList.add("bot-connector");
    }

    displayModifiableValues() {
        const modal = document.createElement('div');
        modal.classList.add('modal', 'fade');
        modal.id = `opAmpModal${OpAmp.OpAmpID}`;
        modal.tabIndex = -1;

        modal.innerHTML = `
    <style>
        ${this.style}
    </style>

    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Operational Amplifier Model</h5>
            </div>
            <div class="modal-body">
                ${this.createInputField("VOS", "Input Offset Voltage (VOS)", this.VOS, "V")}
                ${this.createInputField("IBS", "Input Bias Current (IBS)", this.IBS, "A")}
                ${this.createInputField("IOS", "Input Offset Current (IOS)", this.IOS, "A")}
                ${this.createInputField("AVOL", "Open Loop Gain (AVOL)", this.AVOL, "No units")}
                ${this.createInputField("BW", "Bandwidth (BW)", this.BW, "Hz")}
                ${this.createInputField("RI", "Input Resistance (RI)", this.RI, "Ω")}
                ${this.createInputField("RO", "Output Resistance (RO)", this.RO, "Ω")}
                ${this.createInputField("VOMP", "Positive Output Voltage Limit (VOMP)", this.VOMP, "V")}
                ${this.createInputField("VOMN", "Negative Output Voltage Limit (VOMN)", this.VOMN, "V")}
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
        const params = ["VOS", "IBS", "IOS", "AVOL", "BW", "RI", "RO", "VOMP", "VOMN"];
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
        this.model = `.model ${this.modelName} OPAMP (VOS=${this.VOS} IBS=${this.IBS} IOS=${this.IOS} AVOL=${this.AVOL} BW=${this.BW} RI=${this.RI} RO=${this.RO} VOMP=${this.VOMP} VOMN=${this.VOMN})`;
    }

    setModel(modelString) {
        // Regular expression to match model name and parameters for an OpAmp
        const regex = /(?<modelName>\w+)\s+\(VOS=(?<VOS>-?\d+\.?\d*)\s+IBS=(?<IBS>-?\d+\.?\d*)\s+IOS=(?<IOS>-?\d+\.?\d*)\s+AVOL=(?<AVOL>\d+)\s+BW=(?<BW>\d+)\s+RI=(?<RI>\d+)\s+RO=(?<RO>\d+)\s+VOMP=(?<VOMP>-?\d+\.?\d*)\s+VOMN=(?<VOMN>-?\d+\.?\d*)\)/;

        const match = modelString.match(regex);

        if (match && match.groups) {
            this.modelName = match.groups.modelName;
            this.VOS = parseFloat(match.groups.VOS);
            this.IBS = parseFloat(match.groups.IBS);
            this.IOS = parseFloat(match.groups.IOS);
            this.AVOL = parseFloat(match.groups.AVOL);
            this.BW = parseFloat(match.groups.BW);
            this.RI = parseFloat(match.groups.RI);
            this.RO = parseFloat(match.groups.RO);
            this.VOMP = parseFloat(match.groups.VOMP);
            this.VOMN = parseFloat(match.groups.VOMN);

            // Update model netlist definition
            this.updateModel();
        } else {
            console.log("No match found for OpAmp model string");
        }
    }

    static resetID() {
        OPAMP.OpAmpID = 0;
    }
}

window.OPAMP = OPAMP;

export function AddOpAmp(posx, posy) {
    return new OPAMP(posx, posy);
}