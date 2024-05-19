const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const port = 3000;

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
// Set EJS as the view engine
app.set('view engine', 'ejs');

// Función para leer archivos JSON desde la carpeta 'data'
async function readJsonFiles(directory) {
    const files = await fs.promises.readdir(directory);
    const jsonFiles = files.filter(file => path.extname(file) === '.json');
    
    const allKeys = jsonFiles.map(file => path.basename(file, '.json'));
    
    return allKeys;
}

app.get('/', async (req, res) => {
    try {
        // Llama a la función para leer los datos desde los archivos JSON locales
        const message = await readJsonFiles(path.join(__dirname, 'data'));
        res.render('index', { message });
    } catch (err) {
        console.error('An error occurred:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});