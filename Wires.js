function getAllBlockedNodes() {
  //console.log("getAllBlockedNodes: Start processing componentMap", componentMap);
  let allBlocked = [];
  componentMap.forEach(component => {
    if (component.instance.blockedNodes && component.instance.blockedNodes.length > 0) {
      ////console.log("getAllBlockedNodes: Component has blocked nodes:", component.instance.blockedNodes);
      allBlocked.push(...component.instance.blockedNodes);
    }
  });
  ////console.log("getAllBlockedNodes: All blocked nodes collected:", allBlocked);
  return allBlocked;
}

function astar(start, end, blockedNodes) {
  ////console.log("astar: Finding path from", start, "to", end, "with blocked nodes", blockedNodes);
  function nodeKey(node) {
    return `${node.x},${node.y}`;
  }
  
  // Build a quick lookup set for blocked nodes.
  let blockedSet = new Set(blockedNodes.map(n => `${n[0]},${n[1]}`));
  ////console.log("astar: Blocked set created:", blockedSet);
  let openSet = [];
  let closedSet = new Set();
  
  let startNode = {
    x: start.x,
    y: start.y,
    g: 0,
    h: (Math.abs(end.x - start.x) + Math.abs(end.y - start.y)) / 10,
    f: 0,
    parent: null
  };
  startNode.f = startNode.g + startNode.h;
  ////console.log("astar: Initial startNode:", startNode);
  openSet.push(startNode);
  
  const directions = [
    { x: 10, y: 0 },
    { x: -10, y: 0 },
    { x: 0, y: 10 },
    { x: 0, y: -10 }
  ];
  
  while (openSet.length > 0) {
    // Get node with lowest f.
    let currentIndex = 0;
    for (let i = 0; i < openSet.length; i++) {
      if (openSet[i].f < openSet[currentIndex].f) {
        currentIndex = i;
      }
    }
    let current = openSet[currentIndex];
    ////console.log("astar: Checking node", current);
    
    // If we reached the goal, reconstruct and return the path.
    if (current.x === end.x && current.y === end.y) {
      ////console.log("astar: Goal reached. Reconstructing path.");
      let path = [];
      while (current) {
        path.push({ x: current.x, y: current.y });
        current = current.parent;
      }
      ////console.log("astar: Final path (reversed):", path.reverse());
      return path.reverse();
    }
    
    openSet.splice(currentIndex, 1);
    closedSet.add(nodeKey(current));
    
    // Check neighbors.
    for (let dir of directions) {
      let neighborX = (current.x + dir.x);
      let neighborY = (current.y + dir.y);
      let neighborKey = `${neighborX},${neighborY}`;
      
      if (blockedSet.has(neighborKey) || closedSet.has(neighborKey)) {
        ////console.log("astar: Skipping neighbor", neighborKey, "due to blockage or closed set.");
        continue;
      }
      
      let tentativeG = current.g + 1;
      let neighborNode = openSet.find(n => n.x === neighborX && n.y === neighborY);
      
      if (!neighborNode) {
        let h = (Math.abs(end.x - neighborX) + Math.abs(end.y - neighborY)) / 10;
        neighborNode = {
          x: neighborX,
          y: neighborY,
          g: tentativeG,
          h: h,
          f: tentativeG + h,
          parent: current
        };
        openSet.push(neighborNode);
        ////console.log("astar: Adding neighbor node", neighborNode);
      } else if (tentativeG < neighborNode.g) {
        ////console.log("astar: Updating neighbor node", neighborNode, "with new g value", tentativeG);
        neighborNode.g = tentativeG;
        neighborNode.f = tentativeG + neighborNode.h;
        neighborNode.parent = current;
      }
    }
  }
  //console.warn("astar: No path found, returning direct line from start to end.");
  return [start, end];
}

function getValidNode(node, blockedSet) {
  //console.log("getValidNode: Checking node", node);
  let key = `${node.x},${node.y}`;
  if (!blockedSet.has(key)) {
    ////console.log("getValidNode: Node is valid:", node);
    return node;
  }
  
  const directions = [
    { x: 10, y: 0 },
    { x: -10, y: 0 },
    { x: 0, y: 10 },
    { x: 0, y: -10 }
  ];
  
  for (let dir of directions) {
    let candidate = { x: node.x + dir.x, y: node.y + dir.y };
    let candidateKey = `${candidate.x},${candidate.y}`;
    if (!blockedSet.has(candidateKey)) {
      ////console.log("getValidNode: Found valid candidate:", candidate);
      return candidate;
    }
  }
  //console.warn("getValidNode: No valid candidate found, returning original node:", node);
  return node;
}

function clientToSVG(svg, clientX, clientY) {
  let pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  let svgPoint = pt.matrixTransform(svg.getScreenCTM().inverse());
  ////console.log("clientToSVG: Converted client coordinates", { clientX, clientY }, "to SVG coordinates", svgPoint);
  return svgPoint;
}

// Create a new wire between two connector elements.
function createWire(startConnectionID, endConnectionID) {
  //console.log("createWire: Creating wire between", startConnectionID, "and", endConnectionID);
  let startConnection = document.getElementById(startConnectionID);
  let endConnection = document.getElementById(endConnectionID);
  
  let startRect = startConnection.getBoundingClientRect();
  let endRect = endConnection.getBoundingClientRect();
  ////console.log("createWire: Start rect", startRect, "End rect", endRect);
  
  let wire = drawWire(startRect, endRect, startConnectionID, endConnectionID);
  
  // Update connector images if needed.
  startConnection.style.backgroundImage = "url('images/CONNECTOR-FULL.svg')";
  endConnection.style.backgroundImage = "url('images/CONNECTOR-FULL.svg')";
  
  return wire;
}

// Draw the wire using A* routing.
function drawWire(startRect, endRect, startCon, endCon) {
  //console.log("drawWire: Drawing wire between", startCon, "and", endCon);
  let wireID = `wire-${startCon}-${endCon}`;
  const svgContainer = document.getElementById("grid-svg");
  ////console.log("drawWire: SVG container", svgContainer);
  
  // Get center positions of the connectors and convert to SVG coordinates.
  let startCenter = clientToSVG(svgContainer,
    startRect.left + startRect.width / 2,
    startRect.top + startRect.height / 2);
  let endCenter = clientToSVG(svgContainer,
    endRect.left + endRect.width / 2,
    endRect.top + endRect.height / 2);
  ////console.log("drawWire: Start center", startCenter, "End center", endCenter);
  
  // Snap to a 10px grid.
  let startPoint = {
    x: Math.round(startCenter.x / 10) * 10,
    y: Math.round(startCenter.y / 10) * 10
  };
  let endPoint = {
    x: Math.round(endCenter.x / 10) * 10,
    y: Math.round(endCenter.y / 10) * 10
  };
  //console.log("drawWire: Start point snapped to grid", startPoint, "End point snapped to grid", endPoint);
  
  // Gather all blocked nodes from the component map.
  let allBlockedNodes = getAllBlockedNodes();
  let blockedSet = new Set(allBlockedNodes.map(n => `${n[0]},${n[1]}`));
  //console.log("drawWire: Blocked set", blockedSet);
  
  // Adjust endpoints if they fall inside a blocked cell.
  startPoint = getValidNode(startPoint, blockedSet);
  endPoint = getValidNode(endPoint, blockedSet);
  //console.log("drawWire: Adjusted start point", startPoint, "Adjusted end point", endPoint);
  
  // Calculate the path using A*.
  let pathPoints = astar(startPoint, endPoint, allBlockedNodes);
  //console.log("drawWire: Path points", pathPoints);
  
  // Build the SVG path \"d\" attribute.
  let d = `M${pathPoints[0].x},${pathPoints[0].y}`;
  for (let i = 1; i < pathPoints.length; i++) {
    d += ` L${pathPoints[i].x},${pathPoints[i].y}`;
  }
  //console.log("drawWire: SVG path d attribute", d);
  
  let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("id", wireID);
  path.setAttribute("stroke", "red");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("fill", "none");
  path.setAttribute("data-start", startCon);
  path.setAttribute("data-end", endCon);
  path.setAttribute("d", d);
  
  svgContainer.appendChild(path);
  //console.log("drawWire: Wire appended to SVG with id", wireID);
  return path;
}

// Updated: Update all wires that involve a given component.
function updateWires(componentId) {
  //console.log("updateWires: Updating wires for component", componentId);
  const svgContainer = document.getElementById("grid-svg");
  let wires = document.querySelectorAll("svg path");
  //console.log("updateWires: Found wires", wires);
  
  // Refresh the merged list of blocked nodes.
  let allBlockedNodes = getAllBlockedNodes();
  let blockedSet = new Set(allBlockedNodes.map(n => `${n[0]},${n[1]}`));
  //console.log("updateWires: Blocked set", blockedSet);
  
  wires.forEach(wire => {
    //console.log("updateWires: Processing wire", wire.id);
    // Expect wire IDs to be in the format: \"wire-startComponent-startConnector-endComponent-endConnector\"
    let wireID = wire.id;
    if (!wireID.includes(componentId)) {
      //console.log("updateWires: Skipping wire", wireID, "as it does not include component", componentId);
      return;
    }
    
    let parts = wireID.split("-");
    if (parts.length !== 5) {
      //console.error("updateWires: Unexpected wireID format:", wireID);
      return;
    }
    
    // Destructure the parts.
    let [prefix, startComponent, startConnector, endComponent, endConnector] = parts;
    
    // Build connector element IDs (assumed to match this format).
    let startElem = document.getElementById(`${startComponent}-${startConnector}`);
    let endElem = document.getElementById(`${endComponent}-${endConnector}`);
    
    if (!startElem || !endElem) {
      //console.error("updateWires: One or both connector elements not found for", wireID);
      return;
    }
    
    let startRect = startElem.getBoundingClientRect();
    let endRect = endElem.getBoundingClientRect();
    //console.log("updateWires: Start rect", startRect, "End rect", endRect);
    
    let startCenter = clientToSVG(svgContainer,
      startRect.left + startRect.width / 2,
      startRect.top + startRect.height / 2);
    let endCenter = clientToSVG(svgContainer,
      endRect.left + endRect.width / 2,
      endRect.top + endRect.height / 2);
    //console.log("updateWires: Start center", startCenter, "End center", endCenter);
    
    let startPoint = {
      x: Math.round(startCenter.x / 10) * 10,
      y: Math.round(startCenter.y / 10) * 10
    };
    let endPoint = {
      x: Math.round(endCenter.x / 10) * 10,
      y: Math.round(endCenter.y / 10) * 10
    };
    //console.log("updateWires: Start point", startPoint, "End point", endPoint);
    
    startPoint = getValidNode(startPoint, blockedSet);
    endPoint = getValidNode(endPoint, blockedSet);
    //console.log("updateWires: Adjusted start point", startPoint, "Adjusted end point", endPoint);
    
    let pathPoints = astar(startPoint, endPoint, allBlockedNodes);
    //console.log("updateWires: New path points", pathPoints);
    
    let d = `M${pathPoints[0].x},${pathPoints[0].y}`;
    for (let i = 1; i < pathPoints.length; i++) {
      d += ` L${pathPoints[i].x},${pathPoints[i].y}`;
    }
    //console.log("updateWires: New path d attribute", d);
    wire.setAttribute("d", d);
  });
}
