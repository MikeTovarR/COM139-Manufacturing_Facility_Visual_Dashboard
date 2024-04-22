/*global use, db*/
// MongoDB Playground
// To disable this template go to Settings | MongoDB | Use Default Template For Playground.
// Make sure you are connected to enable completions and to be able to run a playground.
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.
// The result of the last command run in a playground is shown on the results panel.
// By default the first 20 documents will be returned with a cursor.
// Use 'console.log()' to print to the debug output.
// For more documentation on playgrounds please refer to
// https://www.mongodb.com/docs/mongodb-vscode/playgrounds/

// Use database
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://production:production@productionline.2brel6r.mongodb.net/";

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function main() {
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB Atlas server');
    const collection = client.db("ProductionLine").collection("Runs");
    
    var valores = [];

    // Obtener todos los documentos de la colección
    const documents = collection.find({}).toArray();

    // Recolectar las claves de todos los documentos
    const allKeys = new Set();
    documents.forEach(doc => {
        Object.keys(doc).forEach(key => allKeys.add(key));
    });

    valores = Array.from(allKeys);

    // Obtén el elemento select
    var selectElement = document.getElementById("object-select");

    // Itera sobre el array y agrega opciones al select
    for (var i = 0; i < valores.length; i++) {
        var option = document.createElement("option");
        option.text = valores[i]; // El texto de la opción es el valor en la posición i del array
        option.value = i; // El valor de la opción puede ser el índice en este caso, pero puedes cambiarlo según necesites
        selectElement.appendChild(option);
    }
  } catch (err) {
    console.error('An error occurred connecting to MongoDB Atlas...\n', err);
  } finally {
    await client.close();
  }
}

main().catch(console.error);

var valores = [];

// Obtener todos los documentos de la colección
const documents = collection.find({}).toArray();

// Recolectar las claves de todos los documentos
const allKeys = new Set();
documents.forEach(doc => {
    Object.keys(doc).forEach(key => allKeys.add(key));
});

valores = Array.from(allKeys);

// Obtén el elemento select
var selectElement = document.getElementById("object-select");

// Itera sobre el array y agrega opciones al select
for (var i = 0; i < valores.length; i++) {
    var option = document.createElement("option");
    option.text = valores[i]; // El texto de la opción es el valor en la posición i del array
    option.value = i; // El valor de la opción puede ser el índice en este caso, pero puedes cambiarlo según necesites
    selectElement.appendChild(option);
}

/*
// Run a find command to view items sold on April 4th, 2014.
const salesOnApril4th = db.getCollection('sales').find({
  date: { $gte: new Date('2014-04-04'), $lt: new Date('2014-04-05') }
}).count();

// Print a message to the output window.
console.log(`${salesOnApril4th} sales occurred in 2014.`);

// Here we run an aggregation and open a cursor to the results.
// Use '.toArray()' to exhaust the cursor to return the whole result set.
// You can use '.hasNext()/.next()' to iterate through the cursor page by page.
db.getCollection('sales').aggregate([
  // Find all of the sales that occurred in 2014.
  { $match: { date: { $gte: new Date('2014-01-01'), $lt: new Date('2015-01-01') } } },
  // Group the total sales for each product.
  { $group: { _id: '$item', totalSaleAmount: { $sum: { $multiply: [ '$price', '$quantity' ] } } } }
]);
*/