const express = require("express");
const app = express();
const cool = require("cool-ascii-faces");
const path = require("path");

app.use(express.json());

const port = process.env.PORT || 8082; 
const jlraCalc = require("./index-JLRA.js");

let JLRAdata = [];
const BASE_API_URL_JLRA = "/api/v1/social-drinking-behaviors";

app.get(`${BASE_API_URL_JLRA}/loadInitialData`, (req, res) => {
    if (JLRAdata.length === 0){
        // Hacemos una copia de los datos importados
        JLRAdata = [...jlraCalc.dataJLRA];
        res.status(200).send("Ok: Recursos cargados en la memoria web");
    } else {
        res.status(409).send("Conflict: Los recursos pedidos ya se encuentran en la memoria web");
    } 
});


// GET: Leer toda la lista
app.get(BASE_API_URL_JLRA, (req, res) => {
    res.status(200).json(JLRAdata); 
});

// POST: Crear un nuevo recurso
app.post(BASE_API_URL_JLRA, (req, res) => {
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
app.put(BASE_API_URL_JLRA, (req, res) => {
    res.status(405).send("Method Not Allowed: No se puede hacer PUT a la lista de recursos");
});

// DELETE: Borrar toda la lista
app.delete(BASE_API_URL_JLRA, (req, res) => {
    JLRAdata = [];
    res.status(200).send("Ok: Se han borrado todos los recursos");
});


// GET: Leer un recurso concreto
app.get(`${BASE_API_URL_JLRA}/:country`, (req, res) => {
    const countryName = req.params.country;
    const resource = JLRAdata.filter(n => n.country === countryName);

    if (resource.length > 0) {
        res.status(200).json(resource);
    } else {
        res.status(404).send("Not Found: Recurso no encontrado");
    }
});

// POST: Crear en un recurso concreto (No permitido)
app.post(`${BASE_API_URL_JLRA}/:country`, (req, res) => {
    res.status(405).send("Method Not Allowed: No puedes hacer POST a un recurso concreto");
});

// PUT: Actualizar un recurso concreto
app.put(`${BASE_API_URL_JLRA}/:country`, (req, res) => {
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
app.delete(`${BASE_API_URL_JLRA}/:country`, (req, res) => {
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

// ==========================================
// API DEL COMPAÑERO: AGB
// ==========================================
const agbCalc = require("./index-AGB.js"); // Su archivo de cálculos
let AGBdata = []; // Su memoria
const BASE_API_URL_AGB = "/api/v1/international-tourist-arrivals"; // Su ruta de la API

// 1. CARGA INICIAL DE DATOS
app.get(`${BASE_API_URL_AGB}/loadInitialData`, (req, res) => {
    if (AGBdata.length === 0){
        AGBdata = [...AGBCalc.dataAGB]; // Asegurarse de que dataAGB es el nombre de su exportación
        res.status(200).send("Ok: Recursos cargados en la memoria web");
    } else {
        res.status(409).send("Conflict: Los recursos pedidos ya se encuentran en la memoria web");
    } 
});

// 2. GET: Leer toda la lista
app.get(BASE_API_URL_AGB, (req, res) => {
    res.status(200).json(AGBdata); 
});

// 3. POST: Crear un nuevo recurso
app.post(BASE_API_URL_AGB, (req, res) => {
    const newData = req.body;
    if (!newData || !newData.country) {
        return res.status(400).send("Bad Request: Faltan campos obligatorios");
    }
    const exists = AGBdata.find(n => n.country === newData.country);
    if (exists) {
        return res.status(409).send("Conflict: El recurso ya existe");
    }
    AGBdata.push(newData);
    res.status(201).send("Created: Recurso creado correctamente");
});

// 4. PUT: Actualizar lista (No permitido)
app.put(BASE_API_URL_AGB, (req, res) => {
    res.status(405).send("Method Not Allowed");
});

// 5. DELETE: Borrar toda la lista
app.delete(BASE_API_URL_AGB, (req, res) => {
    AGBdata = [];
    res.status(200).send("Ok: Se han borrado todos los recursos");
});

// 6. GET: Leer un recurso concreto
app.get(`${BASE_API_URL_AGB}/:country`, (req, res) => {
    const countryName = req.params.country;
    const resource = AGBdata.filter(n => n.country === countryName);
    if (resource.length > 0) {
        res.status(200).json(resource);
    } else {
        res.status(404).send("Not Found");
    }
});

// 7. POST: Crear en un recurso concreto (No permitido)
app.post(`${BASE_API_URL_AGB}/:country`, (req, res) => {
    res.status(405).send("Method Not Allowed");
});

// 8. PUT: Actualizar un recurso concreto
app.put(`${BASE_API_URL_AGB}/:country`, (req, res) => {
    const countryName = req.params.country;
    const updatedData = req.body;
    const index = AGBdata.findIndex(n => n.country === countryName);
    
    if (index === -1) return res.status(404).send("Not Found");
    if (updatedData.country && updatedData.country !== countryName) return res.status(400).send("Bad Request");

    AGBdata[index] = { ...AGBdata[index], ...updatedData };
    res.status(200).send("Ok: Recurso actualizado");
});

// 9. DELETE: Borrar un recurso concreto
app.delete(`${BASE_API_URL_AGB}/:country`, (req, res) => {
    const countryName = req.params.country;
    const initialLength = AGBdata.length;
    AGBdata = AGBdata.filter(n => n.country !== countryName);
    if (AGBdata.length < initialLength) {
        res.status(200).send("Ok: Recurso borrado");
    } else {
        res.status(404).send("Not Found");
    }
});

// 10. RUTA SAMPLES DEL COMPAÑERO
app.get("/samples/AGB", (req, res) => {
    if (AGBdata.length === 0) {
        res.status(409).send("Conflict: Necesitas cargar los datos en memoria para poder hacer la media");
    } else {
        // AQUÍ DEBEN PONER SU CÁLCULO PROPIO
        res.status(200).send("El cálculo de AGB es: ..."); 
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

// ==========================================
// ARRANQUE DEL SERVIDOR
// ==========================================
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});