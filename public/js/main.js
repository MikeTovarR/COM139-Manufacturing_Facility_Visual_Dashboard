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

var selectedKey;

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
});


function read(key) {
    var xhr = new XMLHttpRequest();

    const jsonKey = key.toString();

    xhr.open("GET", "http://127.0.0.1:5000/get_query?date=" + jsonKey, true); 
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            const data = JSON.parse(xhr.responseText);
            graphData = data[Object.keys(data)[0]];
            graphDataBar();
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

        // circle.animate([{transform: `translate(${x2 - x1}px, ${y2 - y1})px`}], {
        //     duration: 1000,
        //     fill: 'forwards',
        //     easing: 'ease-in-out'
        // });

        circle.style.transform = `translate(${x2}px, ${y2}px)`;

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
        case 1: return [0, 50];
        case 2: return [50, 50];
        case 3: return [100, 50];
        case 4: return [150, 0];
        case 5: return [150, 100];
        case 6: return [200, 50];
    }
    return [-1, -1];
}

/*
    Use for testing purposes, change for call for mongodb calls for final function
*/
fetch('js/movements.json')
    .then(response => response.json())
    .then( data => {
        console.log("Production line movements");
        console.log(JSON.stringify(data));

        // Moments
        Object.keys(data).forEach(key => {
            // Products
            Object.entries(data[key]).forEach(([innerKey, innerValue]) => {
                if (innerValue == 1) {
                    createCircle(innerKey, 0, 50);
                }
                setTimeout(() => {
                    moveCircle(innerKey, 0, 50, 100, 0);
                }, 100);
            });
        });

    });