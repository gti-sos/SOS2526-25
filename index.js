
const express = require("express");
const app = express();
const cool = require("cool-ascii-faces");
const path = require("path");
app.use(express.json());

const port = process.env.PORT || 8082; 


const jlraCalc = require("./index-JLRA.js"); 
let JLRAdata = []; 
const BASE_API_URL_JLRA = "/api/v1/social-drinking-behaviors";

// CARGA INICIAL
app.get(`${BASE_API_URL_JLRA}/loadInitialData`, (req, res) => {
    if (JLRAdata.length === 0){
        JLRAdata = [...jlraCalc.dataJLRA]; 
        res.status(200).send("Ok: Recursos de JLRA cargados");
    } else {
        res.status(409).send("Conflict: Los recursos ya están en memoria");
    } 
});

// GET LISTA Y BÚSQUEDAS (Filtros)
app.get(BASE_API_URL_JLRA, (req, res) => {
    let resultados = JLRAdata;

    if (req.query.country) {
        resultados = resultados.filter(n => n.country === req.query.country);
    }

    if (req.query.year) {
        // req.query.year llega como texto, lo convertimos a número con parseInt
        resultados = resultados.filter(n => n.year === parseInt(req.query.year));
    }

    res.status(200).json(resultados);
});

// POST LISTA
app.post(BASE_API_URL_JLRA, (req, res) => {
    const newData = req.body;
    
    // Validación estricta: Exactamente 6 campos y todos obligatorios
    if (!newData || 
        Object.keys(newData).length !== 6 ||
        newData.country === undefined || 
        newData.year === undefined || 
        newData.total_liter === undefined || 
        newData.beer_share === undefined || 
        newData.wine_share === undefined || 
        newData.spirit_share === undefined) {
        return res.status(400).send("Bad Request: El JSON no tiene los campos esperados");
    }
    
    // Comprobar duplicado por Clave Compuesta (País + Año)
    const exists = JLRAdata.find(n => n.country === newData.country && n.year === newData.year);
    if (exists) return res.status(409).send("Conflict: El recurso ya existe");
    
    JLRAdata.push(newData);
    res.status(201).send("Created");
});

// PUT LISTA (Bloqueado)
app.put(BASE_API_URL_JLRA, (req, res) => res.status(405).send("Method Not Allowed"));

// DELETE LISTA
app.delete(BASE_API_URL_JLRA, (req, res) => {
    JLRAdata = [];
    res.status(200).send("Ok: Recursos borrados");
});


// GET RECURSO CONCRETO
app.get(`${BASE_API_URL_JLRA}/:country/:year`, (req, res) => {
    const countryName = req.params.country;
    const year = parseInt(req.params.year); 
    
    const resource = JLRAdata.find(n => n.country === countryName && n.year === year);
    if (resource) res.status(200).json(resource);
    else res.status(404).send("Not Found");
});

// POST RECURSO CONCRETO (Bloqueado)
app.post(`${BASE_API_URL_JLRA}/:country/:year`, (req, res) => {
    res.status(405).send("Method Not Allowed");
});

// PUT RECURSO CONCRETO
app.put(`${BASE_API_URL_JLRA}/:country/:year`, (req, res) => {
    const countryName = req.params.country;
    const year = parseInt(req.params.year);
    const updatedData = req.body;
    
    const index = JLRAdata.findIndex(n => n.country === countryName && n.year === year);
    if (index === -1) return res.status(404).send("Not Found");

    if (!updatedData || 
        Object.keys(updatedData).length !== 6 ||
        updatedData.country === undefined || 
        updatedData.year === undefined || 
        updatedData.total_liter === undefined || 
        updatedData.beer_share === undefined || 
        updatedData.wine_share === undefined || 
        updatedData.spirit_share === undefined) {
        return res.status(400).send("Bad Request: El JSON no tiene los campos esperados");
    }

    if (updatedData.country !== countryName || updatedData.year !== year) {
        return res.status(400).send("Bad Request: El ID de la URL y el del cuerpo deben coincidir");
    }

    JLRAdata[index] = updatedData;
    res.status(200).send("Ok: Recurso actualizado");
});

// DELETE RECURSO CONCRETO
app.delete(`${BASE_API_URL_JLRA}/:country/:year`, (req, res) => {
    const countryName = req.params.country;
    const year = parseInt(req.params.year);
    const initialLength = JLRAdata.length;
    
    JLRAdata = JLRAdata.filter(n => !(n.country === countryName && n.year === year));

    if (JLRAdata.length < initialLength) res.status(200).send("Ok: Recurso borrado");
    else res.status(404).send("Not Found");
});

//sample JLRA
app.get("/samples/JLRA", (req, res) => {
        let datos = jlraCalc.dataJLRA;
        let philippines = datos.filter((n) => n.country === "Philippines");
        let beer = philippines.map((n) => n.beer_share);
        let average = beer.reduce((n, b) => n + b, 0) / beer.length;
        res.status(200).send(String(average)); 
    });

// =========================================================================
// 2. RECURSO: PSA (CO2 Emissions)
// =========================================================================
const PSAdata_initial = [
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
let PSAdata = [];
const BASE_API_URL_PSA = "/api/v1/co2-emissions";

app.get(`${BASE_API_URL_PSA}/loadInitialData`, (req, res) => {
    if (PSAdata.length === 0){
        PSAdata = [...PSAdata_initial];
        res.status(200).send("Ok: Recursos de PSA cargados");
    } else {
        res.status(409).send("Conflict: Datos ya cargados");
    } 
});

// GET LISTA
app.get(BASE_API_URL_PSA, (req, res) => res.status(200).json(PSAdata));

// POST LISTA
app.post(BASE_API_URL_PSA, (req, res) => {
    const newData = req.body;
    if (!newData || !newData.country) return res.status(400).send("Bad Request");
    const exists = PSAdata.find(n => n.country === newData.country);
    if (exists) return res.status(409).send("Conflict: El recurso ya existe");
    PSAdata.push(newData);
    res.status(201).send("Created");
});

// PUT LISTA
app.put(BASE_API_URL_PSA, (req, res) => res.status(405).send("Method Not Allowed"));

// DELETE LISTA
app.delete(BASE_API_URL_PSA, (req, res) => {
    PSAdata = [];
    res.status(200).send("Ok: Recursos borrados");
});

// GET RECURSO
app.get(`${BASE_API_URL_PSA}/:country`, (req, res) => {
    const resource = PSAdata.filter(n => n.country === req.params.country);
    if (resource.length > 0) res.status(200).json(resource);
    else res.status(404).send("Not Found");
});

// POST RECURSO
app.post(`${BASE_API_URL_PSA}/:country`, (req, res) => res.status(405).send("Method Not Allowed"));

// PUT RECURSO
app.put(`${BASE_API_URL_PSA}/:country`, (req, res) => {
    const countryName = req.params.country;
    const updatedData = req.body;
    const index = PSAdata.findIndex(n => n.country === countryName);
    if (index === -1) return res.status(404).send("Not Found");
    if (updatedData.country && updatedData.country !== countryName) return res.status(400).send("Bad Request");
    PSAdata[index] = { ...PSAdata[index], ...updatedData };
    res.status(200).send("Ok: Recurso actualizado");
});

// DELETE RECURSO
app.delete(`${BASE_API_URL_PSA}/:country`, (req, res) => {
    const initialLength = PSAdata.length;
    PSAdata = PSAdata.filter(n => n.country !== req.params.country);
    if (PSAdata.length < initialLength) res.status(200).send("Ok: Recurso borrado");
    else res.status(404).send("Not Found");
});

// SAMPLE PSA
app.get("/samples/PSA", (req, res) => {
    if (PSAdata.length === 0) {
        res.status(409).send("Conflict: Carga los datos de PSA primero");
    } else {
        let germany = PSAdata.filter((n) => n.country === "Germany");
        let co2 = germany.map((n) => n.co2_emission);
        let average = co2.reduce((n, b) => n + b, 0) / co2.length;
        res.status(200).send(String(average)); 
    }
});

// =========================================================================
// 3. RECURSO: AGB (Arrivals)
// =========================================================================
const agbCalc = require("./index-AGB.js");
let AGBdata = [];
const BASE_API_URL_AGB = "/api/v1/international-tourist-arrivals";

app.get(`${BASE_API_URL_AGB}/loadInitialData`, (req, res) => {
    if (AGBdata.length === 0){
        AGBdata = [...agbCalc.dataAGB];
        res.status(200).send("Ok: Recursos de AGB cargados");
    } else {
        res.status(409).send("Conflict: Datos ya en memoria");
    } 
});

// GET LISTA
app.get(BASE_API_URL_AGB, (req, res) => res.status(200).json(AGBdata));

// POST LISTA
app.post(BASE_API_URL_AGB, (req, res) => {
    const newData = req.body;
    if (!newData || !newData.country) return res.status(400).send("Bad Request");
    const exists = AGBdata.find(n => n.country === newData.country);
    if (exists) return res.status(409).send("Conflict: El recurso ya existe");
    AGBdata.push(newData);
    res.status(201).send("Created");
});

// PUT LISTA
app.put(BASE_API_URL_AGB, (req, res) => res.status(405).send("Method Not Allowed"));

// DELETE LISTA
app.delete(BASE_API_URL_AGB, (req, res) => {
    AGBdata = [];
    res.status(200).send("Ok: Recursos borrados");
});

// GET RECURSO
app.get(`${BASE_API_URL_AGB}/:country`, (req, res) => {
    const resource = AGBdata.filter(n => n.country === req.params.country);
    if (resource.length > 0) res.status(200).json(resource);
    else res.status(404).send("Not Found");
});

// POST RECURSO
app.post(`${BASE_API_URL_AGB}/:country`, (req, res) => res.status(405).send("Method Not Allowed"));

// PUT RECURSO
app.put(`${BASE_API_URL_AGB}/:country`, (req, res) => {
    const countryName = req.params.country;
    const updatedData = req.body;
    const index = AGBdata.findIndex(n => n.country === countryName);
    if (index === -1) return res.status(404).send("Not Found");
    if (updatedData.country && updatedData.country !== countryName) return res.status(400).send("Bad Request");
    AGBdata[index] = { ...AGBdata[index], ...updatedData };
    res.status(200).send("Ok: Recurso actualizado");
});

// DELETE RECURSO
app.delete(`${BASE_API_URL_AGB}/:country`, (req, res) => {
    const initialLength = AGBdata.length;
    AGBdata = AGBdata.filter(n => n.country !== req.params.country);
    if (AGBdata.length < initialLength) res.status(200).send("Ok: Recurso borrado");
    else res.status(404).send("Not Found");
});

// SAMPLE AGB
app.get("/samples/AGB", (req, res) => {
    if (AGBdata.length === 0) {
        res.status(409).send("Conflict: Carga los datos de AGB primero");
    } else {
        let india = AGBdata.filter((n) => n.country === "India");
        let arrivals = india.map((n) => n.air_arrival);
        let average = arrivals.reduce((n, b) => n + b, 0) / arrivals.length;
        res.status(200).send(String(average)); 
    }
});
// =========================================================================
// RUTAS COMUNES Y ARRANQUE
// =========================================================================
app.get("/", (req, res) => {
    res.send("Servidor Grupo 25. Rutas: /samples/PSA, /samples/JLRA, /samples/AGB");
});

app.use("/", express.static("./public"));

app.get("/cool", (req, res) => {
    res.status(200).send("<html><body><h1>" + cool() + "</h1></body></html>");
});

app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});