/**
 * Creates a floating action button (FAB) menu for a given component button.
 * @param {HTMLElement} button - The component button for which the FAB menu is created.
 */

let instances = getClassInstances();
function createFABForComponent(button) {
    // Create the FAB container
    const fabContainer = document.createElement('div');
    fabContainer.id = `fab-options-${button.dataset.componentId}`;
    fabContainer.classList.add('floating__container');
    fabContainer.innerHTML = `
<div class="floating__toggle" id="floating-toggle-${button.dataset.componentId}">
        </div>
        <ul id="fab-options-${button.dataset.componentId}">
            <li class="floating__link" id="rotate-${button.dataset.componentId}">
                <div class="floating__icon">
                    <img src="images/rotate.svg" alt="rotate button" />
                </div>
            </li>
            <li class="floating__link" id="delete-${button.dataset.componentId}">
                <div class="floating__icon">
                    <img src="images/delete.svg" alt="delete button" />
                </div>
            </li>
            <li class="floating__link" id="clear-${button.dataset.componentId}">
                <div class="floating__icon">
                    <img src="images/clear.svg" alt="clear button" />
                </div>
            </li>
             <li class="floating__link" id="edit-${button.dataset.componentId}">
                <div class="floating__icon">
                    <img src="images/edit.svg" alt="edit button" />
                </div>
            </li>
        </ul>
    `;

    // Calculate the position of the FAB container relative to the button
    const holderRect = button.parentElement.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    fabContainer.style.top = (buttonRect.top - holderRect.top + buttonRect.height / 2) + 'px';
    fabContainer.style.left = (buttonRect.left - holderRect.left + buttonRect.width / 2) + 'px';

    // Initially hide the FAB
    fabContainer.style.pointerEvents = 'none';
    fabContainer.style.opacity = '0';

    // Append the FAB container to the button's parent element
    button.parentElement.appendChild(fabContainer);

    // Get the toggle button and make it invisible and non-interfering
    const toggleButton = fabContainer.querySelector('.floating__toggle');
    toggleButton.style.opacity = '0'; // Make the middle button invisible
    toggleButton.style.pointerEvents = 'none'; // Ensure it doesn't interfere with other events

    // Toggle the visibility of the FAB on right-click
    button.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        const isVisible = fabContainer.style.pointerEvents === 'auto';
        fabContainer.style.pointerEvents = isVisible ? 'none' : 'auto';
        fabContainer.style.opacity = isVisible ? '0' : '1';
    });

    // Hide the FAB when clicking outside of it
    const handleClickOutside = (event) => {
        // Check if the click was outside both the button and the FAB container
        if (!fabContainer.contains(event.target) && !button.contains(event.target)) {
            fabContainer.style.pointerEvents = 'none';
            fabContainer.style.opacity = '0';
        }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('contextmenu', handleClickOutside); // Added context menu hide on right-click outside

    // Cleanup event listeners when the button is removed from the DOM
    const observer = new MutationObserver((mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' && !document.body.contains(button)) {
                document.removeEventListener('click', handleClickOutside);
                document.removeEventListener('contextmenu', handleClickOutside);
                observer.disconnect();
                break;
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}


function removeFABForComponent(button) {
    const fabContainer = document.getElementById(`fab-options-${button.dataset.componentId}`);
    if (fabContainer) {
        fabContainer.remove();
    }
}