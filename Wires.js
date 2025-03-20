// Compute grid cells that fall within a component's bounding box.
function getComponentObstacles(component) {
  const obstacles = [];
  const gridSize = 10; // assuming a 10px grid
  const startX = component.instance.x;
  const startY = component.instance.y;
  const endX = component.instance.x + component.instance.width;
  const endY = component.instance.y + component.instance.height;
  
  // Snap start positions to grid.
  const snappedStartX = Math.floor(startX / gridSize) * gridSize;
  const snappedStartY = Math.floor(startY / gridSize) * gridSize;
  
  for (let x = snappedStartX; x <= endX; x += gridSize) {
    for (let y = snappedStartY; y <= endY; y += gridSize) {
      obstacles.push([x, y]);
    }
  }
  return obstacles;
}


function getAllBlockedNodes() {
  let allBlocked = [];
  componentMap.forEach(component => {
    // Include any existing blocked nodes defined on the component.
    if (component.instance.blockedNodes && component.instance.blockedNodes.length > 0) {
      allBlocked.push(...component.instance.blockedNodes);
    }
    // Also add grid cells covering the component's area.
    const obstacles = getComponentObstacles(component);
    allBlocked.push(...obstacles);
  });
  return allBlocked;
}


function astar(start, end, blockedNodes) {
  function nodeKey(node) {
    return `${node.x},${node.y}`;
  }
  
  // Build a quick lookup set for blocked nodes.
  let blockedSet = new Set(blockedNodes.map(n => `${n[0]},${n[1]}`));
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
    
    // If we reached the goal, reconstruct and return the path.
    if (current.x === end.x && current.y === end.y) {
      let path = [];
      while (current) {
        path.push({ x: current.x, y: current.y });
        current = current.parent;
      }
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
      } else if (tentativeG < neighborNode.g) {
        neighborNode.g = tentativeG;
        neighborNode.f = tentativeG + neighborNode.h;
        neighborNode.parent = current;
      }
    }
  }
  return [start, end];
}

function getValidNode(node, blockedSet) {
  let key = `${node.x},${node.y}`;
  if (!blockedSet.has(key)) {
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
      return candidate;
    }
  }
  return node;
}

function clientToSVG(svg, clientX, clientY) {
  let pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  let svgPoint = pt.matrixTransform(svg.getScreenCTM().inverse());
  return svgPoint;
}

// Create a new wire between two connector elements.
function createWire(startConnectionID, endConnectionID) {
  let startConnection = document.getElementById(startConnectionID);
  let endConnection = document.getElementById(endConnectionID);
  
  let startRect = startConnection.getBoundingClientRect();
  let endRect = endConnection.getBoundingClientRect();
  
  let wire = drawWire(startRect, endRect, startConnectionID, endConnectionID);
  
  // Update connector images if needed.
  startConnection.style.backgroundImage = "url('images/CONNECTOR-FULL.svg')";
  endConnection.style.backgroundImage = "url('images/CONNECTOR-FULL.svg')";
  
  return wire;
}

// Draw the wire using A* routing.
function drawWire(startRect, endRect, startCon, endCon) {
  let wireID = `wire-${startCon}-${endCon}`;
  const svgContainer = document.getElementById("grid-svg");
  
  // Get center positions of the connectors and convert to SVG coordinates.
  let startCenter = clientToSVG(svgContainer,
    startRect.left + startRect.width / 2,
    startRect.top + startRect.height / 2);
  let endCenter = clientToSVG(svgContainer,
    endRect.left + endRect.width / 2,
    endRect.top + endRect.height / 2);
  
  // Snap to a 10px grid.
  let startPoint = {
    x: Math.round(startCenter.x / 10) * 10,
    y: Math.round(startCenter.y / 10) * 10
  };
  let endPoint = {
    x: Math.round(endCenter.x / 10) * 10,
    y: Math.round(endCenter.y / 10) * 10
  };
  
  // Gather all blocked nodes from the component map.
  let allBlockedNodes = getAllBlockedNodes();
  let blockedSet = new Set(allBlockedNodes.map(n => `${n[0]},${n[1]}`));
  
  // Adjust endpoints if they fall inside a blocked cell.
  startPoint = getValidNode(startPoint, blockedSet);
  endPoint = getValidNode(endPoint, blockedSet);
  
  // Calculate the path using A*.
  let pathPoints = astar(startPoint, endPoint, allBlockedNodes);
  
  // Build the SVG path \"d\" attribute.
  let d = `M${pathPoints[0].x},${pathPoints[0].y}`;
  for (let i = 1; i < pathPoints.length; i++) {
    d += ` L${pathPoints[i].x},${pathPoints[i].y}`;
  }
  
  let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("id", wireID);
  path.setAttribute("stroke", "red");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("fill", "none");
  path.setAttribute("data-start", startCon);
  path.setAttribute("data-end", endCon);
  path.setAttribute("d", d);
  
  svgContainer.appendChild(path);
  return path;
}

// Updated: Update all wires that involve a given component.
function updateWires(componentId) {
  const svgContainer = document.getElementById("grid-svg");
  let wires = document.querySelectorAll("svg path");

  // Refresh the merged list of blocked nodes.
  let allBlockedNodes = getAllBlockedNodes();
  let blockedSet = new Set(allBlockedNodes.map(n => `${n[0]},${n[1]}`));

  wires.forEach(wire => {
    
    let wireID = wire.id;
    if (!wireID.includes(componentId)) return;

    let parts = wireID.split("-");
    if (parts.length !== 5) {
      console.error("updateWires: Unexpected wireID format:", wireID);
      return;
    }

    // Destructure the parts.
    let [prefix, startComponent, startConnector, endComponent, endConnector] = parts;

    // Build connector element IDs (assumed to match this format).
    let startElem = document.getElementById(`${startComponent}-${startConnector}`);
    let endElem = document.getElementById(`${endComponent}-${endConnector}`);

    if (!startElem || !endElem) {
      // console.error("updateWires: One or both connector elements not found for", wireID);
      return;
    }

    let startRect = startElem.getBoundingClientRect();
    let endRect = endElem.getBoundingClientRect();

    let startCenter = clientToSVG(svgContainer,
      startRect.left + startRect.width / 2,
      startRect.top + startRect.height / 2);
    let endCenter = clientToSVG(svgContainer,
      endRect.left + endRect.width / 2,
      endRect.top + endRect.height / 2);

    let startPoint = {
      x: Math.round(startCenter.x / 10) * 10,
      y: Math.round(startCenter.y / 10) * 10
    };
    let endPoint = {
      x: Math.round(endCenter.x / 10) * 10,
      y: Math.round(endCenter.y / 10) * 10
    };

    startPoint = getValidNode(startPoint, blockedSet);
    endPoint = getValidNode(endPoint, blockedSet);

    let pathPoints = astar(startPoint, endPoint, allBlockedNodes);

    let d = `M${pathPoints[0].x},${pathPoints[0].y}`;
    for (let i = 1; i < pathPoints.length; i++) {
      d += ` L${pathPoints[i].x},${pathPoints[i].y}`;
    }
   
    wire.setAttribute("d", d);
  });
}

function updateAllWires(){

  componentMap.forEach(component => {
    updateWires(component.instance.name);
  });
}