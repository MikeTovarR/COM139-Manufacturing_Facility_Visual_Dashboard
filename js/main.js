/*
*    main.js
*/

const width = 600;
const height = 400;

// Drag and drop functions

var blocks = document.getElementsByClassName("block");
let dragged = null;
var calculate_button = document.getElementById("calculate_button");
var read_button = document.getElementById("read_button");
var combobox = document.getElementById("object-select");

var selectedKey;

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

read_button.addEventListener('click', function() { // ---------------------- read_button --------------------------
    if(selectedKey != null){
        read(selectedKey);
    }
});

combobox.addEventListener("change", function() {
    var selectedOptionIndex = this.value; // Obtener el índice de la opción seleccionada
    selectedKey = this.options[selectedOptionIndex].text; // Obtener el texto de la opción seleccionada
});

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

function read(key){

    var xhttp = new XMLHttpRequest();

    const selectedKey = key;
    
    xhttp.onreadystatechange = function() { // Definir la función de callback que manejará la respuesta
    
    if (this.readyState == 4 && this.status == 200) { // Verificar si la solicitud se ha completado y la respuesta está lista
       
        var data = JSON.parse(this.responseText); // Parsear el JSON obtenido del archivo
        
        console.log(data);
    }
    };
    
    xhttp.open("GET", "./data_base/"+selectedKey+".json", true); // Especificar el método HTTP y la URL del archivo JSON

    xhttp.send(); // Enviar la solicitud
}
