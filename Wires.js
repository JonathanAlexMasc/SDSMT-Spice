
let startConnection = null;
let endConnection = null;


function createWire(startConnectionID, endConnectionID) {
    let startConnection = document.getElementById(startConnectionID);
    let endConnection = document.getElementById(endConnectionID);

    // Get the bounding rectangles of the start and end connections
    let startRect = startConnection.getBoundingClientRect();
    let endRect = endConnection.getBoundingClientRect();
    console.log(startRect, endRect);
    

    let wire = drawWire(startRect, endRect, startConnectionID, endConnectionID);
    startConnection.style.backgroundImage = `url('images/CONNECTOR-FULL.svg')`; // Set image for start connection
    endConnection.style.backgroundImage = `url('images/CONNECTOR-FULL.svg')`; // Set image for end connection
    return wire, true;
}

function clientToSVG(svg, clientX, clientY) {
    let pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }
  

function drawWire(startRect, endRect, startCon, endCon) {
    let wireID = `wire-${startCon}-${endCon}`;
    const svgContainer = document.getElementById("grid-svg");
    
    // Convert the bounding rect center to SVG coords
    let startCenter = clientToSVG(svgContainer,
                                  startRect.left + startRect.width / 2,
                                  startRect.top + startRect.height / 2);
    let endCenter = clientToSVG(svgContainer,
                                endRect.left + endRect.width / 2,
                                endRect.top + endRect.height / 2);
  
    let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("id", wireID);
    path.setAttribute("stroke", "red");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    path.setAttribute("data-start", startCon);
    path.setAttribute("data-end", endCon);
    path.setAttribute("d", `M${startCenter.x},${startCenter.y} H${endCenter.x} V${endCenter.y}`);
  
    svgContainer.appendChild(path);
  }
  


  function updateWires(componentId) {
    const svgContainer = document.getElementById("grid-svg");
  
    // Get all SVG path elements (wires)
    let wires = document.querySelectorAll("svg path");
  
    wires.forEach(wire => {
      let wireID = wire.id; // Expecting format: "wire-startComponent-startConnector-endComponent-endConnector"
      if (!wireID.includes(componentId)) return;
  
      // Parse the wire ID parts
      let parts = wireID.split("-");
      if (parts.length !== 5) {
        console.error("Unexpected wireID format:", wireID);
        return;
      }
      let [_, startComponent, startConnector, endComponent, endConnector] = parts;
  
      // Determine if the moved component is at the start or end of the wire.
      let isStartComponent = (startComponent === componentId);
  
      // Get the connector element from the moved component.
      let componentClass = getClassInstanceByName(componentId);
      if (!componentClass) {
        console.error(`Class instance for component ${componentId} not found.`);
        return;
      }
      let connectorId = isStartComponent ? `${startComponent}-${startConnector}` : `${endComponent}-${endConnector}`;
      let connector = componentClass.connectors.find(con => con.id.startsWith(connectorId));
      if (!connector) {
        console.error(`Connector ${connectorId} not found in component ${componentId}.`);
        return;
      }
      let rect = connector.getBoundingClientRect();
      let movedCenter = clientToSVG(
        svgContainer,
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
      );
  
      // Get the connector for the other component.
      let otherComponentId = isStartComponent ? endComponent : startComponent;
      let otherComponentClass = getClassInstanceByName(otherComponentId);
      if (!otherComponentClass) {
        console.error(`Class instance for component ${otherComponentId} not found.`);
        return;
      }
      let otherConnectorId = isStartComponent ? `${endComponent}-${endConnector}` : `${startComponent}-${startConnector}`;
      let otherConnector = otherComponentClass.connectors.find(con => con.id.startsWith(otherConnectorId));
      if (!otherConnector) {
        console.error(`Other connector ${otherConnectorId} not found for wire ${wireID}.`);
        return;
      }
      let otherRect = otherConnector.getBoundingClientRect();
      let otherCenter = clientToSVG(
        svgContainer,
        otherRect.left + otherRect.width / 2,
        otherRect.top + otherRect.height / 2
      );
  
      // Build the L-shaped path as before.
      // For the start component:
      //   M (moved.x, moved.y) H (other.x) V (moved.y) L (other.x, other.y)
      // For the end component, the roles are reversed.
      let updatedPath;
      if (isStartComponent) {
        updatedPath = `M${movedCenter.x},${movedCenter.y} H${otherCenter.x} V${movedCenter.y} L${otherCenter.x},${otherCenter.y}`;
      } else {
        updatedPath = `M${otherCenter.x},${otherCenter.y} H${otherCenter.x} V${movedCenter.y} L${movedCenter.x},${movedCenter.y}`;
      }
  
      wire.setAttribute("d", updatedPath);
    });
  }
  
