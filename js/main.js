/*
 *    main.js
 */

const margin = { left: 100, top: 20, right: 20, bottom: 100 };
const width = 1000;
const height = 300;

// Drag and drop functions

var blocks = document.getElementsByClassName("block");
let dragged = null;
var calculate_button = document.getElementById("calculate_button");
var read_button = document.getElementById("read_button");
const combobox = document.getElementById("object-select");
var data_selection = document.getElementById("graph-select");

var selectedKey;

var graphData;

const chart_area = document.getElementById("chart-area");

calculate_button.addEventListener("click", function () {
  execute_simulation();
});

function execute_simulation() {
  var xhr = new XMLHttpRequest();
  xhr.open(
    "GET",
    "http://127.0.0.1:5000/get_data?selected_period=" + "Week",
    true
  ); // cambiar Week a variable
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      // var response = JSON.parse(xhr.responseText);
      // alert(response.resultado);
      console.log("Listo");
    }
  };
  xhr.send();
}

read_button.addEventListener("click", function () {
  // ---------------------- read_button --------------------------
  if (selectedKey != null) {
    read(selectedKey);
  }
});

combobox.addEventListener("change", function () {
  var selectedOptionIndex = this.value; // Obtener el índice de la opción seleccionada
  selectedKey = this.options[selectedOptionIndex].text; // Obtener el texto de la opción seleccionada
  read(selectedKey);
});

Array.from(blocks).forEach((element) => {
  element.addEventListener("dragstart", (event) => {
    event.target.classList.add("dragging");
    event.dataTransfer.setData("text/plain", event.target.id);
    dragged = event.target;
  });

  element.addEventListener("dragend", (event) => {
    event.target.classList.remove("dragging");
    dragged = null;
  });
});

var stages = document.getElementsByClassName("stage");

Array.from(stages).forEach((element) => {
  if (element.id != "col1" && element.id != "col6") {
    element.addEventListener("dragenter", (event) => {
      if (event.target.classList.contains("stage")) {
        event.target.classList.add("dragover");
      }
    });

    element.addEventListener("dragover", (event) => {
      event.preventDefault();
    });

    element.addEventListener("dragleave", (event) => {
      if (event.target.classList.contains("stage")) {
        event.target.classList.remove("dragover");
      }
    });

    element.addEventListener("drop", (event) => {
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

function read(key) {
  var xhttp = new XMLHttpRequest();

  const jsonKey = key.toString();

  xhttp.onreadystatechange = function () {
    // Definir la función de callback que manejará la respuesta

    if (this.readyState == 4 && this.status == 200) {
      // Verificar si la solicitud se ha completado y la respuesta está lista

      var data = JSON.parse(this.responseText); // Parsear el JSON obtenido del archivo

      graphData = data[jsonKey];

      graphDataBar();
    }
  };

  xhttp.open("GET", "./data_base/" + jsonKey + ".json", true); // Especificar el método HTTP y la URL del archivo JSON

  xhttp.send(); // Enviar la solicitud
}

var xhttp = new XMLHttpRequest();
var data;

xhttp.onreadystatechange = function () {
  // Definir la función de callback que manejará la respuesta

  if (this.readyState == 4 && this.status == 200) {
    // Verificar si la solicitud se ha completado y la respuesta está lista

    data = this.responseText.split("\n");
    var textKey;
    //console.log(data);

    // Get the select element
    var selectElement = document.getElementById("object-select");

    // Iterate over the array and add options to the select element
    for (var i = 0; i < data.length; i++) {
      if (data[i] != "") {
        // When split at \n adds an empty file at the end, so here we discard it
        var option = document.createElement("option");
        option.text = data[i]; // The text of the option is the value at index i of the array
        option.value = i; // The value of the option can be the index in this case
        selectElement.appendChild(option);
        textKey = data[i];
      }
    }
    selectKey = textKey;
    //read(textKey);
    graphDataBar();
  }
};

xhttp.open("GET", "./data_base/filenames.txt", true); // Especificar el método HTTP y la URL del archivo JSON
xhttp.send(); // Enviar la solicitud

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
    .attr("fill", "orange");

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
    .text(`FACTORY ~ STATIONS ${selected} ~ ${graphData[0]["PERIOD"]}`);
}

data_selection.addEventListener("change", function () {
  graphDataBar();
});
