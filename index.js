const express = require("express");
const app = express();
const cool = require("cool-ascii-faces");
const path = require("path");

app.use(express.json());

const port = process.env.PORT || 8082; 
const jlraCalc = require("./index-JLRA.js");

let JLRAdata = [];
const BASE_API_URL = "/api/v1/social-drinking-behaviors";

app.get(`${BASE_API_URL}/loadInitialData`, (req, res) => {
    if (JLRAdata.length === 0){
        // Hacemos una copia de los datos importados
        JLRAdata = [...jlraCalc.dataJLRA];
        res.status(200).send("Ok: Recursos cargados en la memoria web");
    } else {
        res.status(409).send("Conflict: Los recursos pedidos ya se encuentran en la memoria web");
    } 
});


// GET: Leer toda la lista
app.get(BASE_API_URL, (req, res) => {
    res.status(200).json(JLRAdata); 
});

// POST: Crear un nuevo recurso
app.post(BASE_API_URL, (req, res) => {
    const newData = req.body;
    
    // Comprobar que nos envían los datos mínimos
    if (!newData || !newData.country) {
        return res.status(400).send("Bad Request: Faltan campos obligatorios");
    }
    
    // Comprobar si el recurso ya existe
    const exists = JLRAdata.find(n => n.country === newData.country);
    if (exists) {
        return res.status(409).send("Conflict: El recurso ya existe");
    }

    JLRAdata.push(newData);
    res.status(201).send("Created: Recurso creado correctamente");
});

// PUT: Actualizar lista (No permitido)
app.put(BASE_API_URL, (req, res) => {
    res.status(405).send("Method Not Allowed: No se puede hacer PUT a la lista de recursos");
});

// DELETE: Borrar toda la lista
app.delete(BASE_API_URL, (req, res) => {
    JLRAdata = [];
    res.status(200).send("Ok: Se han borrado todos los recursos");
});


// GET: Leer un recurso concreto
app.get(`${BASE_API_URL}/:country`, (req, res) => {
    const countryName = req.params.country;
    const resource = JLRAdata.filter(n => n.country === countryName);

    if (resource.length > 0) {
        res.status(200).json(resource);
    } else {
        res.status(404).send("Not Found: Recurso no encontrado");
    }
});

// POST: Crear en un recurso concreto (No permitido)
app.post(`${BASE_API_URL}/:country`, (req, res) => {
    res.status(405).send("Method Not Allowed: No puedes hacer POST a un recurso concreto");
});

// PUT: Actualizar un recurso concreto
app.put(`${BASE_API_URL}/:country`, (req, res) => {
    const countryName = req.params.country;
    const updatedData = req.body;
    
    const index = JLRAdata.findIndex(n => n.country === countryName);
    
    if (index === -1) {
        return res.status(404).send("Not Found: Recurso no encontrado");
    }
    
    // Validar que no intenten cambiar el nombre del país al actualizar
    if (updatedData.country && updatedData.country !== countryName) {
        return res.status(400).send("Bad Request: No puedes cambiar el ID (país) del recurso");
    }

    JLRAdata[index] = { ...JLRAdata[index], ...updatedData };
    res.status(200).send("Ok: Recurso actualizado");
});

// DELETE: Borrar un recurso concreto
app.delete(`${BASE_API_URL}/:country`, (req, res) => {
    const countryName = req.params.country;
    const initialLength = JLRAdata.length;
    
    JLRAdata = JLRAdata.filter(n => n.country !== countryName);

    if (JLRAdata.length < initialLength) {
        res.status(200).send("Ok: Recurso borrado");
    } else {
        res.status(404).send("Not Found: Recurso no encontrado");
    }
});

app.get("/samples/JLRA", (req, res) => {
    if (JLRAdata.length === 0) {
        res.status(409).send("Conflict: Necesitas cargar los datos en memoria para poder hacer la media");
    } else {
        let philippines = JLRAdata.filter( (n) => n.country === "Philippines");
        let beer = philippines.map( (n) => n.beer_share);
        let numerator = beer.reduce( (n, b) => n + b, 0);
        let average = numerator / beer.length;
        res.status(200).send(String(average)); 
    }
});

app.get("/", (req, res) => {
    res.send("¡Hola! El servidor del Grupo 25 está funcionando, viento en popa");
});

app.get("/about", (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "public", "about.html"));
});

app.get("/cool", (req, res) => {
    res.status(200).send("<html><body><h1>" + cool() + "</h1></body></html>");
});


const express = require("express");
const app = express();
const cool = require("cool-ascii-faces");
const path = require("path");

const port = process.env.PORT || 8082; 

// --- DATOS Y ALGORITMO (PSA) ---

const data_psa = [
    { country: "Germany", year: 2021, co2_emission: 679, precipitation: 772.59, temperature: 9.48 },
    { country: "Austria", year: 2021, co2_emission: 65.5, precipitation: 1090, temperature: 7.29 },
    { country: "Belgium", year: 2017, co2_emission: 99.1, precipitation: 876.48, temperature: 11.02 },
    { country: "Italy", year: 2017, co2_emission: 353, precipitation: 685.54, temperature: 13.51 },
    { country: "Turkey", year: 2022, co2_emission: 481, precipitation: 536.14, temperature: 12.24 },
    { country: "Turkey", year: 2021, co2_emission: 467, precipitation: 559.24, temperature: 12.56 },
    { country: "Mexico", year: 2020, co2_emission: 423, precipitation: 691.32, temperature: 22.21 },
    { country: "United Kingdom", year: 2018, co2_emission: 380, precipitation: 1100, temperature: 9.53 },
    { country: "Germany", year: 2015, co2_emission: 780, precipitation: 654.88, temperature: 10.33 },
    { country: "China", year: 2019, co2_emission: 11.8, precipitation: 615.63, temperature: 8.04 },
    { country: "China", year: 2021, co2_emission: 12.7, precipitation: 654.33, temperature: 8.23 }
];

function average_data_psa(data) {
    const germany_data = data.filter((n) => n.country === "Germany");
    const co2_values = germany_data.map((n) => n.co2_emission);
    // Calculamos la suma de las emisiones
    const total_co2 = co2_values.reduce((acc, current) => acc + current, 0);
    return total_co2 / co2_values.length;
}

// --- RUTAS INDEX DE PABLO SECO

app.get("/", (req, res) => {
    res.send("¡Hola! El servidor del Grupo 25 está funcionando 🚀");
});

app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "about.html"));
});

app.get("/cool", (req, res) => {
    res.send("<html><body><h1>" + cool() + "</h1></body></html>");
});

// NUEVA RUTA SOLICITADA PARA EL ENTREGABLE F03
app.get("/samples/PSA", (req, res) => {
    const result = average_data_psa(data_psa);
    res.send(`<html><body><p>The average CO2 emission for Germany is: ${result}</p></body></html>`);
});

app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});

// ==========================================
// ARRANQUE DEL SERVIDOR
// ==========================================
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});