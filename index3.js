const express = require("express");
const app = express();
const cool = require("cool-ascii-faces");
const path = require("path");

app.use(express.json());

const port = process.env.PORT || 8082; 

// =========================================================================
// 1. RECURSO Y ALGORITMO: JLRA (Social Drinking Behaviors)
// =========================================================================
const jlraCalc = require("./index-JLRA.js"); 
let JLRAdata = []; 
const BASE_API_URL_JLRA = "/api/v1/social-drinking-behaviors";

app.get(`${BASE_API_URL_JLRA}/loadInitialData`, (req, res) => {
    if (JLRAdata.length === 0){
        JLRAdata = [...jlraCalc.dataJLRA]; 
        res.status(200).send("Ok: Recursos de JLRA cargados");
    } else {
        res.status(409).send("Conflict: Los recursos ya están en memoria");
    } 
});

app.get(BASE_API_URL_JLRA, (req, res) => res.status(200).json(JLRAdata));

app.get("/samples/JLRA", (req, res) => {
    if (JLRAdata.length === 0) {
        res.status(409).send("Conflict: Carga los datos de JLRA primero");
    } else {
        let philippines = JLRAdata.filter((n) => n.country === "Philippines");
        let beer = philippines.map((n) => n.beer_share);
        let average = beer.reduce((n, b) => n + b, 0) / beer.length;
        res.status(200).send(String(average)); 
    }
});

// =========================================================================
// 2. RECURSO Y ALGORITMO: PSA (CO2 Emissions)
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

app.get(BASE_API_URL_PSA, (req, res) => res.status(200).json(PSAdata));

app.get("/samples/PSA", (req, res) => {
    const dataToUse = PSAdata.length > 0 ? PSAdata : PSAdata_initial;
    let germany = dataToUse.filter((n) => n.country === "Germany");
    let co2 = germany.map((n) => n.co2_emission);
    let average = co2.reduce((n, b) => n + b, 0) / co2.length;
    res.status(200).send(`<html><body><h1>Average CO2 Emission for Germany: ${average}</h1></body></html>`);
});

// =========================================================================
// 3. RECURSO Y ALGORITMO: AGB (Arrivals)
// =========================================================================
const agbCalc = require("./index-AGB.js");
let AGBdata = [];
const BASE_API_URL_AGB = "/api/v1/arrivals";

app.get(`${BASE_API_URL_AGB}/loadInitialData`, (req, res) => {
    if (AGBdata.length === 0){
        AGBdata = [...agbCalc.dataAGB];
        res.status(200).send("Ok: Recursos de AGB cargados");
    } else {
        res.status(409).send("Conflict: Datos ya en memoria");
    } 
});

app.get(BASE_API_URL_AGB, (req, res) => res.status(200).json(AGBdata));

app.get("/samples/AGB", (req, res) => {
    if (AGBdata.length === 0) {
        // Si no se han cargado por API, usamos los del archivo directamente para el sample
        res.status(200).send(`<html><body><h1>Average Air Arrivals (India): ${agbCalc.average_data(agbCalc.dataAGB)}</h1></body></html>`);
    } else {
        res.status(200).send(`<html><body><h1>Average Air Arrivals (India): ${agbCalc.average_data(AGBdata)}</h1></body></html>`);
    }
});

// =========================================================================
// RUTAS COMUNES Y ARRANQUE
// =========================================================================
app.get("/", (req, res) => {
    res.send("Servidor Grupo 25. Rutas: /samples/PSA, /samples/JLRA, /samples/AGB");
});

app.get("/about", (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "public", "about.html"));
});

app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});