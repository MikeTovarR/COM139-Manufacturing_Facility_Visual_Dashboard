const express = require("express");
const bodyParser = require("body-parser");
const port = 3000;

const app = express();
//app.use(express.bodyParser());
app.use(bodyParser.urlencoded({ extended:true }));
app.use(express.static('public'));
// Set EJS as the view engine
app.set('view engine', 'ejs');

const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://production:production@productionline.2brel6r.mongodb.net/";

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function main() {
    try {
        await client.connect();
        console.log('Connected successfully to MongoDB Atlas server');
        const collection = client.db("ProductionLine").collection("Runs");
        
        // Fetch documents from MongoDB
        const documents = await collection.find({}).toArray();
        
        // Collect keys from all documents
        const allKeys = new Set();
        documents.forEach(doc => {
            Object.keys(doc).forEach(key => allKeys.add(key));
        });
    
        const valores = Array.from(allKeys).slice(1);
        
        // Return the array of keys
        return valores;
    } catch (err) {
        console.error('An error occurred connecting to MongoDB Atlas...\n', err);
    } finally {
        await client.close();
    }
}
  
app.get('/', async (req, res) => {
    try {
        // Call main function to fetch data from MongoDB
        const message = await main();

        res.render('index', { message });
    } catch (err) {
        console.error('An error occurred:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

