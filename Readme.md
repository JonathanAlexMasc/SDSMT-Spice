## sdm spice

## General Overview

 - This project is an open source replacement for other circuit simulation software
 It allows the user to build, modify, and simulate various basic circuits. This project
 relies on NgSpice for back-end simulation.
 [NGSpice](https://ngspice.sourceforge.io/)

 - the project is split into 2 parts. The first is Build, the second, run.
 Build is where the user builds and modifies the circuit.
 Run is where the user gives the circuit input information (voltage, amplitude, frequency)

 ## Build

 ### DONE
  - Add/remove Items
  - Freely Move items
  - Rotate
  - Item Info
  - Add wire connections to different items
  - Save circuit diagramms
  - Generating a partial Netlist

  ### TODO
   - Grab and drag wire
   - Loading previous circuits (partially done)
   - More Items implemented
   - Item info button cleanup
   - Connecting Wires to Wires

 ## Run

 ### DONE
  - Initial graph
  - Sending to and getting info from NGSPICE
  - File loading
  - Simulating loaded files
  - Basic WaveForm generator with some customization options (sin/square amplitude/period)
  - Gui Built for some future additions

 ### TODO
  - Table of values for certain simulations
  - Allow different simulations to be ran
  - Taking a loaded File back to edit to further edit a circuit (maybe)
  - Flesh out graph to be standalone
  - 


