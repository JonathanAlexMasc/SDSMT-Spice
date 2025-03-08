self.onmessage = function (e) {
    const { startX, startY, endX, endY, grid } = e.data;

    // Replace this with your pathfinding logic
    const path = findPath(startX, startY, endX, endY, grid);

    self.postMessage(path);
};

function findPath(startX, startY, endX, endY, grid) {
    const path = [];
    const dx = endX - startX;
    const dy = endY - startY;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));

    for (let i = 0; i <= steps; i++) {
        const x = startX + (dx * i) / steps;
        const y = startY + (dy * i) / steps;
        path.push([Math.round(x), Math.round(y)]);
    }

    return path;
}

