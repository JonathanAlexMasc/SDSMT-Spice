class Resistor extends Load {
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
        this.name = "R" + ++Resistor.id;
        this.imgSrc = "images/Resistor/resistor.svg";
        this.info = "1k";
        this.unit = 'Ω';
        this.equation = this.name;
        this.Currconnections = [];
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
            this.attachRight(con); //attaches on the bot
            this.Style(con); //styles the connector (adds img, size, etc)
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

    displayModifiableValues() {
        const modal = document.createElement('div');
        modal.classList.add('modal', 'fade');
        modal.id = "resistorModal";
        modal.tabIndex = -1;

        modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Modify Resistor Value</h5>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <input type="text" class="form-control" id="resistanceInput" value="${this.info}" aria-label="Resistor Value">
                        <span class="input-group-text">Ω</span>
                    </div>
                </div>
            </div>
        </div>
    `;

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        const resistanceInput = modal.querySelector('#resistanceInput');
        resistanceInput.addEventListener('input', () => {
            this.info = resistanceInput.value;
            this.updateInfoBox(); 
            this.updateInfoBox(); 
        });

        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });

        this.updateInfoBox();
    }

    static resetID() {
        Resistor.id = 0;
    }
}

window.Resistor = Resistor;

export function AddResistor(posx, posy) {
    return new Resistor(posx, posy);
}


