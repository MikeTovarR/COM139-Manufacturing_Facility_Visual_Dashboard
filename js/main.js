/*
*    main.js
*/

const width = 600;
const height = 400;

// Drag and drop functions

var blocks = document.getElementsByClassName("block");
let dragged = null;

Array.from(blocks).forEach(element => {
    element.addEventListener('dragstart', (event) => {
        event.target.classList.add("dragging");
        event.dataTransfer.setData("text/plain", event.target.id);
        dragged = event.target;
    });

    element.addEventListener('dragend', (event) => {
        event.target.classList.remove("dragging");
        dragged = null;
    });
});

var stages = document.getElementsByClassName("stage");

Array.from(stages).forEach(element => {
    element.addEventListener('dragenter', (event) => {
        if (event.target.classList.contains("stage")) {
            event.target.classList.add("dragover");
        }
    });

    element.addEventListener('dragover', (event) => {
        event.preventDefault();
    });

    element.addEventListener('dragleave', (event) => {
        if (event.target.classList.contains("stage")) {
            event.target.classList.remove("dragover");
        }
    });

    element.addEventListener('drop', (event) => {
        event.preventDefault();
        if (event.target.classList.contains("stage")) {
            if (dragged) {
                dragged.parentNode.removeChild(dragged); // Remove dragged element from its original parent
                event.target.appendChild(dragged); // Append dragged element to the drop target
            }
            event.target.classList.remove("dragover");
        }
    });
});
