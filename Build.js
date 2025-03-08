let zoomLevel = 1;

// Zoom In functionality
document.getElementById('zoom-in-btn').addEventListener('click', () => {
    console.log('in')
    zoomLevel += 0.1;
    document.getElementById('grid').style.transform = `scale(${zoomLevel})`;
});

// Zoom Out functionality
document.getElementById('zoom-out-btn').addEventListener('click', () => {
    console.log('out')
    zoomLevel = Math.max(0.1, zoomLevel - 0.1);
    document.getElementById('grid').style.transform = `scale(${zoomLevel})`;
});

// Reset Zoom functionality
document.getElementById('reset-zoom-btn').addEventListener('click', () => {
    console.log('reset')
    zoomLevel = 1; // Reset zoom level
    document.getElementById('grid').style.transform = `scale(${zoomLevel})`;
});