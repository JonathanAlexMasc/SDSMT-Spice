// Parent class for Diodes
class BaseDiode extends Entities {
    static diodeID = 0;

    constructor() {
        super();
        this.hasModel = true;
        this.numInCons = 1;
        this.numOutCons = 1;
        this.style = `<style>
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
        }
    </style>`
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
}

