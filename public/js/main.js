/*
*    main.js
*/

const margin = { left: 100, top: 20, right: 20, bottom: 100 };
const width = 1000;
const height = 500;

// Drag and drop functions

var blocks = document.getElementsByClassName("block");
let dragged = null;
var calculate_button = document.getElementById("calculate_button");
var read_button = document.getElementById("read_button");
const combobox = document.getElementById("object-select");
var data_selection = document.getElementById("graph-select");
var period_selection = document.getElementById("period-select");


var selectedKey = combobox.value;

var graphData;

const chart_area = document.getElementById("chart-area");
const draw_area = document.getElementById("stage-area");

calculate_button.addEventListener('click', function() {
    execute_simulation();
});

function execute_simulation() {
    var period = period_selection.value;

    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://127.0.0.1:5000/get_data?selected_period=" + period, true); // cambiar Week a variable
    console.log(period);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            // var response = JSON.parse(xhr.responseText);
            // alert(response.resultado);
            const data = JSON.parse(xhr.responseText);
            var date = data["date"]
            read(date);
            console.log("Busqueda subida: " + date);
        }
    };
    xhr.send();
    
}

combobox.addEventListener("change", function () {
    var selectedOptionIndex = this.value; // Obtener el índice de la opción seleccionada
    selectedKey = this.options[selectedOptionIndex].text; // Obtener el texto de la opción seleccionada
    read(selectedKey);
    draw_circles(selectedKey);
});


function read(key) {
     const filePath = "http://127.0.0.1:5000/get_query?date=" + key;

    // Realiza una solicitud para leer el contenido del archivo JSON
    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Procesa los datos del archivo JSON
            graphData = data[Object.keys(data)[0]];
            graphDataBar();
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
    
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

function graphDataBar() {
    var selected = data_selection.value;
    // Chart area
    chart_area.innerHTML = ""; // Clear chart area between runs
    var g = d3
        .select("#chart-area")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
    const values = graphData.map((d) => {
        return d[selected];
    });
    const stations = graphData.map((d) => {
        return d["STATION"];
    });
    console.log(values);
    console.log(stations);
    var maxData = d3.max(values);
    const y = d3.scaleLinear().domain([0, maxData]).range([height, 0]);
    const x = d3
        .scaleBand()
        .domain(stations)
        .range([0, width])
        .paddingInner(0.3)
        .paddingOuter(0.3);
    // Bar data
    var rects = g.selectAll("rect").data(graphData);
  
    rects
        .enter()
        .append("rect")
        .attr("x", (d) => {
            return x(d["STATION"]);
        })
        .attr("y", (d) => {
            return y(d[selected]);
        })
        .attr("width", x.bandwidth())
        .attr("height", (d) => {
            return height - y(d[selected]);
        })
        .attr("fill", "#286090");
  
    g.append("g")
        .attr("class", "left axis")
        .call(
            d3
            .axisLeft(y)
            .ticks(8)
            .tickFormat((d) => {
                return d;
            })
        )
        .selectAll("text")
        .style("fill", "black")
        .selectAll("line")
        .style("stroke", "black");
    g.append("text")
        .attr("class", "y-axis axis-label")
        .attr("x", -(height / 2))
        .attr("y", -50)
        .attr("font-size", "5rem")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .style("fill", "white")
        .text("Revenues");
  
    g.append("g")
        .attr("class", "bottom axis")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickFormat((d => {return `Station ${d}`})))
        .selectAll("text")
        .style("fill", "black")
        .selectAll("line")
        .style("stroke", "black");
    g.append("text")
        .attr("class", "x-axis axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - margin.top)
        .attr("font-size", "4rem")
        .attr("text-anchor", "middle")
        .style("fill", "black")
        .text(`FACTORY ~ STATIONS ${selected.replace(/_/g, ' ')} ~ ${graphData[0]["PERIOD"].toUpperCase()}`);
}
  
data_selection.addEventListener("change", function () {
    graphDataBar();
});

function createCircle(id, x, y) {
    const circle = document.createElement('div');
    console.log(id);
    draw_area.appendChild(circle);
    circle.className = 'circle-item';
    circle.id = id;
    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;
}

function moveCircle(id, x1, y1, x2, y2) {
    const circle = document.getElementById(id);
    if (circle) {
        circle.style.left = `${x1}px`;
        circle.style.top = `${y1}px`;
        circle.style.transition = `transform 0.5s ease-in-out`;
        circle.style.transform = `translate(${x2}px, ${y2}px)`;
        setTimeout(() => {
            circle.style.left = `${x1 + x2}px`;
            circle.style.top = `${y1 + y2}px`;
            circle.style.transition = `none`;
            circle.style.transform = `translate(0px, 0px)`;
        }, 500);


    } else {
        console.error('No circle found with id ' + id);
    }
}

function removeCircle(id) {
    const circle = document.getElementById(id);
    if (circle) {
        circle.remove();
    } else {
        console.error(`No circle with id ${id}`);
    }
}

function getCoordinatesFromStationID(id) {
    switch(id){
        case 1: return [0, 100];
        case 2: return [100, 100];
        case 3: return [200, 100];
        case 4: return [300, 0];
        case 5: return [400, 200];
        case 6: return [400, 100];
        default: return [-1, -1];
    }
}

// Get translate coordinates by directions
// 0 - right
// 1 - upper-right
// 2 - lower-right
// 3 - upper
// 4 - lower
function moveDirection(dir) {
    switch(dir){
        case 0: return [100, 0];
        case 1: return [100, -100];
        case 2: return [100, 100];
        case 3: return [0, -200];
        case 4: return [0, 200];
    }
}

/*
    Use for testing purposes, change for call for mongodb calls for final function
*/
function draw_circles(key){
    fetch("http://127.0.0.1:5000/get_moments?date=" + key) // This line read the according movement file from the server (DON'T WORK)
    //fetch('js/movements.json') // Carlitos's original line, route to his specific file
    .then(response => response.json())
    .then(data => {
        var items = [[0, 100], [0, 100], [0, 100], [0, 100], [0, 100], [0, 100], [0, 100]];
        const createdProducts = [];
        // Delay between "m" moments
        let delay = 0;
        
        //console.log(JSON.stringify(data));
        // Iterate over each "m" moment
        Object.keys(data).forEach((moment, momentIndex) => {
            // Pause between "m" moments
            setTimeout(() => {
                // Index for each product
                var index = 0;
                
                // Iterate over products within each "m" moment
                Object.entries(data[moment]).forEach(([product, value]) => {
                    console.log(moment);
                    // Actions based on product value
                    if (value === 1 || value === 0) {
                        if (!createdProducts.includes(product)) {
                            createCircle(product, 0, 100);
                            createdProducts.push(product);
                        }
                        
                    } else if (value === 7) {
                        // removeCircle(product);
                        // index--;
                        // for (var i = 0; i < items.length - 1; i++) {
                        //     items[i] = items[i + 1];
                        // }
                         items[items.length - 1] = [0, 100];
                        
                    } else {
                        // Check if stage is the same from previous moment
                        if (value === 4) {
                            var prev_coordinates = items[index];
                            if (!(prev_coordinates[0] === 300 && prev_coordinates[1] === 0)){
                                //console.log(prev_coordinates);
                                if(prev_coordinates[0] == 200 && prev_coordinates[1] == 100) {
                                    var coordinates = moveDirection(1);
                                    moveCircle(product, prev_coordinates[0], prev_coordinates[1], coordinates[0], coordinates[1]);
                                    items[index] = [prev_coordinates[0] + coordinates[0], prev_coordinates[1] + coordinates[1]];
                                } else {
                                    var coordinates = moveDirection(3);
                                    moveCircle(product, prev_coordinates[0], prev_coordinates[1], coordinates[0], coordinates[1]);
                                    items[index] = [prev_coordinates[0] + coordinates[0], prev_coordinates[1] + coordinates[1]];
                                }
                            }
                        }
                        else if (value === 5) {
                            var prev_coordinates = items[index];
                            if (!(prev_coordinates[0] === 300 && prev_coordinates[1] === 200))
                            {
                                if(prev_coordinates[0] == 200 && prev_coordinates == 100) {
                                    var coordinates = moveDirection(2);
                                    moveCircle(product, prev_coordinates[0], prev_coordinates[1], coordinates[0], coordinates[1]);
                                    items[index] = [prev_coordinates[0] + coordinates[0], prev_coordinates[1] + coordinates[1]];
                                } else {
                                    var coordinates = moveDirection(4);
                                    moveCircle(product, prev_coordinates[0], prev_coordinates[1], coordinates[0], coordinates[1]);
                                    items[index] = [prev_coordinates[0] + coordinates[0], prev_coordinates[1] + coordinates[1]];
                                }
                            }
                        }
                        else if (value === 6) {
                            var prev_coordinates = items[index];
                            if (!(prev_coordinates[0] === 400 && prev_coordinates[1] === 100))
                            {
                                if(prev_coordinates == [300, 0]) {
                                    var coordinates = moveDirection(2);
                                    moveCircle(product, prev_coordinates[0], prev_coordinates[1], coordinates[0], coordinates[1]);
                                    items[index] = [prev_coordinates[0] + coordinates[0], prev_coordinates[1] + coordinates[1]];
                                } else {
                                    var coordinates = moveDirection(1);
                                    moveCircle(product, prev_coordinates[0], prev_coordinates[1], coordinates[0], coordinates[1]);
                                    items[index] = [prev_coordinates[0] + coordinates[0], prev_coordinates[1] + coordinates[1]];
                                }
                            }
                        }
                        else {
                            var prev_coordinates = items[index];
                            var state = true;
                            switch(value){
                                case 2:
                                    if (prev_coordinates[0] === 100 && prev_coordinates[1] === 100)
                                        state = false;
                                    break;
                                case 3:
                                    if (prev_coordinates[0] === 200 && prev_coordinates[1] === 100)
                                        state = false;
                                    break;
                                }
                            if (state){
                                var coordinates = moveDirection(0);
                                moveCircle(product, prev_coordinates[0], prev_coordinates[1], coordinates[0], coordinates[1]);
                                items[index] = [prev_coordinates[0] + coordinates[0], prev_coordinates[1] + coordinates[1]];
                            }
                        }
                    }
                    index++;
                });
            }, delay);
            
            // Increment delay for next "m" moment
            delay += 1000; // Adjust as needed for the pause duration
        });
    })
    .catch(error => {
        console.error('Error fetching or parsing JSON:', error);
    });
}