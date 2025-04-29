# Overall Design

The program follows a simple path:

- **Create**
- **Simulate**
- **Edit**
- **Simulate**

First, you create a circuit, then simulate it, make any changes you want, and continue simulating or building new circuits.

For more detailed information, refer to the **Build** and **Simulation** tabs.

The program uses **JavaScript/HTML/CSS** and the **Electron** framework for page management and **NGSpice** as the simulation backend.

---

# Compile

You can build and compile the program for both development and production.

Navigate to the main `SDSMT-Spice` directory and use any of these commands:

```json
"scripts": {
  "test": "playwright test",
  "start": "electron-forge start",
  "dev": "electron . start",
  "make": "electron-forge make",
  "package": "electron-forge package",
  "wdio": "wdio run ./wdio.conf.js",
  "publish": "electron-forge publish"
}
```

### Example Commands:
- `npm run dev`
- `npm run start`
- `npm run make`

### What They Do:
- **Dev**: Starts the app without Electron Forge. Fast and easy for development. Uses direct pathing (modify paths cautiously).
- **Start**: Runs the app through Electron Forge. May have issues with pathing.
- **Make**: Compiles the program, creating executables and zipped files. Takes several seconds to a minute.

### ⚠️ WARNING

There is a **known issue** with pathing when using `make`, `start`, or `dev`.

> **If running in development mode:**  
> Change the path in `loader.js` (`simulate-circuit` function).  
> 
> - For **development**: use `__dirname`
> - For **production**: use `process.resourcesPath`

Uncomment/comment the relevant `ngspice` path for Windows/Linux. (Mac users are unaffected.)

---

# Electron

Check the **Electron** tab for additional information.

**Why Electron?**  
It enables production and app development using JavaScript, which the team was familiar with.

### Advantages:
- Dedicated environment simplifies production and auto-updating for users.
- Almost identical to standard web development with JavaScript/HTML.

### Disadvantages:
- External libraries can be tricky to import unless Electron-compatible.
- Libraries must be imported via `Loader.js`, not directly in the files that use them.

---

# Main Pages

## Build Page

**Quick Overview** — For a detailed breakdown, see the **Build** tab.

- **Controlled by**: `controller.js`
- **Parent Class**: `Entities.js`
  - ⚠️ Editing `Entities.js` affects **all classes**.

### Adding a New Component:
1. Create an HTML button → Call `AddXComponent`
2. Create a new class extending `Entities`, export it.
3. Import the new class into `BuildModule.js`.

### Important Files:
- **Classes.js**: Supporting classes (connector, wire, probe).
- **Floating.js**: Modifies the floating action buttons (FABs) for each component.
- **Wires.js**: Manages the wire pathing algorithm.

---

## Run Page

**Quick Overview** — For a detailed breakdown, see the **Run** tab.

- **Main Controller**: `generator.js`
- **No extra files** — all logic is in `generator.js`.

### Data Flow:
- Receive netlist (from build or external).
- Verify netlist.
- Add/Edit simulation options.
- Simulate.
- Plot/Table results.

### Important Functions:
- **ModifyNetlist()**:  
  Central handler for all netlist modifications.

- **Parse Functions**:  
  Separate parse functions for each sweep type (for compartmentalization).

- **Plot Functions**:  
  Individual functions for each simulation type (you could consolidate this if desired).

---


# Electron in Habanero SPICE

## Overview

Electron is very particular about how it operates. For **saving/loading from the user's file system** and **sending information between pages**, we need specific Electron-based utilities.

We use the **IPC system** (Inter-Process Communication).

There are two important parts:
- We need to tell Electron which functions we want to expose.
- We need to define these functions in a place accessible by all files.

There are two important files:
- `Loader.js`
- `Preloader.js`

**Both are REQUIRED to operate successfully.**

---

## Preloader.js

The **preloader** exposes functions to the program. When these functions are called elsewhere, the preloader sends the request to `Loader.js`, where the actual function is defined.

**Example:**
- In `Loader.js`, we have `SaveCircuit`, which should receive `Data` and invoke the `save-circuit` function.
- In `controller.js`, we call the function:

```javascript
// Save using Electron
const response = await window.electron.saveCircuit(circuitData);
if (response && response.message) {
    alert(response.message);
}
```

*(You can find this line at 792-796 in `controller.js`.)*

When this function is activated:
- It goes to the preloader and invokes:

```javascript
saveCircuit: (data) => ipcRenderer.invoke('save-circuit', data)
```

- Electron uses IPC to send this function (and the data) to `Loader.js`, where the function is **defined and handled**.

---

## Loader.js

An example IPC handler inside `Loader.js`:

```javascript
ipcMain.handle('simulate-circuit', async (event, filePath) => {
    return new Promise((resolve, reject) => {
        let ngspicePath;
        console.log(os.platform());
        console.log("Checking Platform");
        console.log("In Simulate circuit");

        if (os.platform() === 'darwin') {
            console.log("macOS detected");
            ngspicePath = '/opt/homebrew/bin/ngspice';
        } else {
            // Development path for Windows
            ngspicePath = path.join(__dirname, 'bin', 'Spice64', 'bin', 'ngspice_con.exe');
        }

        if (!fs.existsSync(filePath)) {
            reject(`Netlist file not found: ${filePath}`);
            return;
        }

        const command = `"${ngspicePath}" -b "${filePath}"`;
        console.log(`Executing command: ${command}`);

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Execution error: ${error.message}`);
                reject(`Execution error: ${error.message}`);
            } else if (stderr) {
                console.warn(`ngspice stderr: ${stderr}`);
                resolve(stdout);
            } else {
                console.log(`ngspice stdout: ${stdout}`);
                resolve(stdout);
            }
        });
    });
});
```

**Notes:**
- Each function must have its own `ipcMain.handle`.
- Most library imports are located in `Loader.js`. 
- Only a few imports exist in `Preloader.js` (due to Electron restrictions).

If a function needs external library information, you must route it through IPC.

---

# Electron Forge

Website: [https://www.electronforge.io/](https://www.electronforge.io/)

**Electron Forge** packages and distributes the Electron application.  
It takes all of our code and creates **installers** and **applications** that users can download and use.

**Forge configuration file:**  
[forge.config.js](https://github.com/JonathanAlexMasc/SDSMT-Spice/blob/main/forge.config.js)

This file defines:
- Which platforms we distribute to: **Linux**, **macOS**, **Windows**
- GitHub Publisher setup: includes repo name and owner so that generated artifacts can be pushed to GitHub releases.

---

# Tags and Releases

Each version of Habanero SPICE requires a **tag** (e.g., `v1.2.3`) in GitHub.

When developers decide the application is ready for release:
- Use **tags** to create GitHub releases.

---

# How to Release a New Version of Habanero SPICE

```bash
npm version major|minor|patch   # Choose based on what type of version bump you need
git push --follow-tags          # Push your changes and tags
```

Then:
1. Go to **Actions** -> **Release app** -> **Workflows**.
2. **Run the workflow** from the desired tag.
3. A GitHub Release will be created automatically!

---

# Build Page: Overview

## Build.html

- `Build.html` is the **primary page** for the circuit creation process.
- On the **left side** are many buttons, organized into **groupings based on type**.

Example (HTML):
```html
<div class="collapse" id="resistor-section">
    <!-- Buttons go here -->
</div>
```
- You can create a new subsection using `class="collapse"`.
- Each `id` should **tie to a function** in `buildModule` that will **create a component**.

Example (new button):
```html
<button id="addResistor" onclick="buildModule.createResistor()">Resistor</button>
```

---

## Styling

- **Button styling** is already referenced.
- New buttons will **inherit** the current styling automatically.
- If you want to **change styling**, edit `Build.css`.

---

## Key Functions in `controller.js`

Don't be overwhelmed by the number of functions.  
**Focus on these important ones**:

| Function | Notes |
|:---|:---|
| `SaveCircuit` | Mostly functional. Needs updates if you add new components or probes. |
| `LoadCircuit` | Mostly functional. Minor issue: probes attached to deleted components may not visually disappear on load. |
| `GetComponentClass` | Functional. Add new components here as you implement them. |
| `ClearCircuit` | Functional. Add reset logic for new components' ID numbers. |
| `GenerateNetlist` | **Does not need direct changes.** Netlist data comes from each component's `this.info`. |

---

## Netlist Generation

- Netlists are created **automatically**.
- `GenerateNetlist` **iterates through** the component map.
- It **grabs `component.info`** and appends it to the netlist output.

**When creating new components:**
- Ensure their **netlist information is stored** inside `this.info`.
- Use `UpdateInfoBox()` in `entities` to refresh the info box.
- **Note:** Some legacy code uses `updateEquations` or `appendInfo`. These should eventually be cleaned up and replaced with `UpdateInfoBox()`.

---

## Code Quality Note

Consistency is **not perfect** across older classes.  
Some methods may seem chaotic. When possible:
- Favor `UpdateInfoBox()` for info updates.
- Ignore/remove old `updateEquations` or `appendInfo` calls.

---

# Wire System: Overview

Wires in the project are drawn as **SVG `<path>` elements** connecting components.

Instead of straight lines, wires:
- **Route around obstacles** (components)
- **Snap to a 10px grid**
- **Re-route dynamically** when components move

---

## Core Concepts

| Concept | Description |
|:---|:---|
| **Grid System** | All positions snap to a virtual **10×10** pixel grid. |
| **Obstacles** | Components define "obstacle" points to block wires (`getComponentObstacles`). |
| **Blocked Nodes** | `getAllBlockedNodes()` collects all obstacles for A* pathfinding. |
| **Pathfinding** | Uses lightweight **A*** algorithm to find the shortest path (only up, down, left, right moves). |
| **Wire Storage** | Wires have a unique ID like:<br>`wire-[startComponent]-[startConnector]-[endComponent]-[endConnector]`. |
| **Wire Updates** | Wires auto-update when components move or change. |
| **Global Update** | `updateAllWires()` refreshes all wires after major changes (e.g., loading circuits). |

---

## Important Wire Functions

| Function | Purpose |
|:---|:---|
| `createWire(startID, endID)` | Creates and draws a new wire between two connectors. |
| `drawWire(startRect, endRect, startCon, endCon)` | Converts connector positions, runs A*, and draws the wire path. |
| `getAllBlockedNodes()` | Collects all component obstacles for routing. |
| `updateWires(componentId)` | Recomputes wires for a moved/changed component. |
| `updateAllWires()` | Forces a full recompute of all wires in the circuit. |

---

# Simulation Page: `Waveform.html`

## Overview

The main focus of this page is the **chart display** using **Chart.js**.  
Chart.js provides simple, readable syntax for configuring and displaying graphs.

---

## Chart.js Example

```javascript
responsive: true,
type: 'linear', // or 'log'
scales: {
    x: {
        type: 'linear', 
        position: 'bottom'
    },
    'x-axis-2': {
        type: 'linear',
        position: 'top'
    },
    y: {
        type: 'linear',
        position: 'left'
    }
}
```

**Key Settings:**
- `responsive: true` — Enables automatic resizing and animations.
- `type: 'linear' | 'log'` — Sets the growth type of the graph.
- `position: 'top' | 'bottom' | 'left' | 'right'` — Determines label placement.
- **Extra Axes** — You can define multiple axes (e.g., `'x-axis-2'`).

---

# Netlist Handling

This is where the complexity lies.  
The netlist is **fully managed** by the function:

### `ModifyNetlist()`

**Main Responsibilities:**
- Checks for an existing `.control` section.
- Saves old simulation parameters (print lines, types).
- Deletes the old `.control` section.
- Creates a new control section using updated settings.
- Re-adds old print lines and new ones if applicable.
- Finalizes the netlist by closing sections.

---

## Control Section Structure

The **control section** is framed by:

```text
.control
... simulation commands ...
.endc
```

Everything inside is related to **simulation behavior**, including:
- Simulation Type (AC Sweep, DC Sweep, Transient, DC Operating Point)
- Print lines (Which variables to display)

**ModifyNetlist() Process:**
1. Save old print lines.
2. Delete old `.control` block.
3. Create a new block via `MakeControlSection(voltageSourceName)`.
4. Add back old and new print lines via `MakePrintLines()`.
5. Finalize the section with `.endc` and `.end`.

---

## Parsing Simulation Results

Each **simulation type** (AC, DC, Transient) has its own **parse** and **plot** functions.

**Important Note:**
- In parsing, sometimes you’ll see extra variables related to **imaginary parts**.
- Example: When running a current probe, it outputs both a **real** and an **imaginary** number.
- **Typically, only the real part** is used for graphing.  
- The imaginary part (if needed) is still captured and available internally.

---

## Special Note: ToggleWave and Waveform Input

Inside `ModifyNetlist`, there is **special handling for waveform inputs**.

- If `togglewave` is triggered, it will allow users to **input their own waveform** instead of using default sources from Build.
- **Caution:**  
  This is **skeleton code** — it currently only works with **AC sources**.
- **Purpose:**  
  It provides a starting point for teams that want to **implement a full waveform generator** into the program later.

---

# Summary of Important Functions

| Function | Purpose |
|:---|:---|
| `ModifyNetlist()` | Core function managing netlist structure and simulation settings. |
| `MakeControlSection(voltageSourceName)` | Creates a clean control section for the netlist. |
| `MakePrintLines()` | Generates print commands for simulation outputs. |
| `togglewave` (feature) | Allows replacing default input sources with user waveform input (skeleton feature). |

---

Here’s your fourth section **converted into clean, professional Markdown**, just like the others:

---

# Netlist: Overview and Deep Dive

## General Notes

> The netlist causes me great pain and sorrow. I'm sorry for anyone who has to take it upon themselves to mess with it.

The **netlist** in this project follows a very specific and strict format:

### Netlist Format

```text
COMPONENT CON1 CON2 INFO
```

**Example:**
```text
R1 1 2 1k
```
- `R1` = Component name
- `1` and `2` = Node connections
- `1k` = Component information (value, model, etc.)

---

## Naming Conventions

| Component Type | Prefix |
|:---|:---|
| Resistor | R |
| Capacitor | C |
| Inductor | L |

> **Why not "I" for inductors?**  
> I is reserved for "current" in SPICE conventions.

Correct naming is **critical** because NGSpice uses the **first letter** to interpret component types.

---

# Models in NGSpice

Models define **electrical behavior** based on semiconductor physics.

---

## 1. Diode Models

Diodes can be:

- Built-in (default behavior)  
- User-defined via `.model` statement

### Syntax (User-Defined Diode Model)

```text
.model DNAME D (IS=1e-14 N=1 Rs=0.5 Cjo=2e-12 M=0.5 Vj=0.7 Bv=100 Ibv=0.1u)
```

| Parameter | Meaning |
|:---|:---|
| IS | Saturation current |
| N | Emission coefficient |
| Rs | Series resistance |
| Cjo | Zero-bias junction capacitance |
| Vj | Junction potential |
| Bv | Breakdown voltage |
| Ibv | Current at breakdown |

**Usage:**
```text
D1 N1 N2 DNAME
```
(Places diode D1 between nodes N1 and N2 using model DNAME.)

---

## 2. BJT (Bipolar Junction Transistor) Models

### Syntax

```text
.model QMODNAME NPN (IS=1e-15 BF=100 VAF=100 ...)
```

| Parameter | Meaning |
|:---|:---|
| IS | Saturation current |
| BF | Forward current gain (β) |
| VAF | Early voltage |
| Cjc, Cje | Junction capacitances |
| RB, RE, RC | Parasitic resistances |

**Usage:**
```text
Q1 C B E QMODNAME
```
(Where C, B, and E are collector, base, and emitter nodes.)

---

## 3. MOSFET Models

### Syntax

```text
.model MNAME NMOS (LEVEL=1 VTO=1 KP=20u ...)
```

**Usage:**
```text
M1 D G S B MNAME
```
(Drain, Gate, Source, Bulk connections.)

---

# Components and Nodes

- **Component** = the item itself (e.g., R1, C2, L4)
- **Node** = numeric connection points between components.

**Special Node: Ground**
- Represented by `0`.
- Removes the component designation (treated purely as a connection).

### Examples

```text
R1 1 2 1k      // Resistor between node 1 and node 2
L1 3 0 1u      // Inductor between node 3 and ground
```

- Nodes are **created dynamically** via `CreateGroup()` when drawing connections.
- Wires are **purely visual** — true electrical connections are based on **node groupings**.

---

# Print Functions and Their Quirks

### How it should work

- `Print(1)` — Print the value of node 1.
- `Print(0)` — **Invalid** (ground has no measurable value).
- Ideally, you can print a difference: `Print(1,0)`, but this has **spotty support**.

### Weirdness

- **Different simulations require different print types:**
  - **AC Sweep** — needs magnitude, e.g., `Print vdb(1)`.
  - **DC/Transient** — needs actual voltage, e.g., `Print v(1)`.
- **Current Probes**:
  - Printed with `Print I(R1)`.
  - Behavior is inconsistent across simulations.

> NGSpice documentation is **inconsistent** and **sometimes incorrect**, adding to the difficulty.

---

# Known Bugs and Oddities

| Issue | Notes |
|:---|:---|
| Print(0) is illegal | Ground nodes cannot be printed directly. |
| Print(1,0) inconsistent | Theoretically valid but often unreliable. |
| Current probes | Should not work in AC sweep (according to docs), but sometimes **do** work — inconsistently. |
| Probe conversion | Probes from build (`.probe(1)`) are manually translated to print lines (`Print v(1)`). |
| Missing probe drop | If node 0 is involved, the print line is **dropped** to avoid errors. |

---

# Bug Fixing (Theoretical)

A theory (unfinished due to time limits):
- **Problem:** We transform `.probe(1)` and `.probe(2)` to `Print v(1)` and `Print v(2)`.
- **Problem:** We ignore `.probe(0)` because `Print v(0)` is invalid.
- **Potential Improvement:**  
  Try to use `Print v(1,0)` instead of dropping ground-related probes — but this was not extensively tested.

---

# TL;DR

- Naming matters A LOT (R for resistors, C for capacitors, L for inductors).
- Netlist connections are handled internally via node groupings.
- Control sections in netlists must be **rebuilt** for simulations.
- NGSpice behaves inconsistently, so **testing is critical**.
- Beware of bugs around ground nodes and current probes!

---
