/*
*    main.js
*/

const width = 600;
const height = 400;

// Drag and drop functions

var blocks = document.getElementsByClassName("block");
let dragged = null;
var calculate_button = document.getElementById("calculate_button");


calculate_button.addEventListener('click', function() {
    execute_simulation();
});

function execute_simulation() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://127.0.0.1:5000/get_data?selected_period=" + "Week", true); // cambiar Week a variable
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            // var response = JSON.parse(xhr.responseText);
            // alert(response.resultado);
            console.log("Listo");
        }
    };
    xhr.send();
    
}

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
    if (element.id != "col1" && element.id != "col6") {
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
    }
    
});
