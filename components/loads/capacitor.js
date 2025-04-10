class Capacitor extends Load {
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
        this.name = "C" + ++Capacitor.id;
        this.imgSrc = "images/Capacitor/capacitor.svg";                 
        this.info = "1u";
        this.unit = 'F';
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
        // Create a container div for the modal
        const modal = document.createElement('div');
        modal.classList.add('modal', 'fade'); // Use Bootstrap modal and fade animation
        modal.id = "resistorModal"; // Unique ID for the modal
        modal.tabIndex = -1; // Required for Bootstrap modals

        modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Modify Capacitor Value</h5>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <input type="text" class="form-control" id="capacitanceInput" value="${this.info}" aria-label="Capacitor Value">
                        <span class="input-group-text">F</span>
                    </div>
                </div>
            </div>
        </div>
    `;

        // Append modal to body
        document.body.appendChild(modal);

        // Show the modal using Bootstrap's modal methods
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        // Add autosave functionality
        const capacitanceInput = modal.querySelector('#capacitanceInput');
        capacitanceInput.addEventListener('input', () => {
            this.info = capacitanceInput.value;
            this.updateInfoBox(); 
        });

        // Remove the modal from DOM when hidden
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    static resetID() {
        Capacitor.id = 0;
    }
}

window.Capacitor = Capacitor;

export function AddCapacitor(posx, posy) {
    return new Capacitor(posx, posy);
}