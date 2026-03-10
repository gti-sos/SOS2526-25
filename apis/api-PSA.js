// Archivo: apis/api-PSA.js
import { PSAdata_initial, average_PSA } from "../index-PSA.js";

let PSAdata = [];
const BASE_API_URL_PSA = "/api/v1/co2-emissions";

export const loadPSA = (app) => {

    // CARGA INICIAL
    app.get(`${BASE_API_URL_PSA}/loadInitialData`, (req, res) => {
        if (PSAdata.length === 0){
            PSAdata = [...PSAdata_initial];
            res.status(200).send("Ok: Recursos de PSA cargados");
        } else {
            res.status(409).send("Conflict: Datos ya cargados");
        } 
    });

    // GET LISTA Y BÚSQUEDAS
    app.get(BASE_API_URL_PSA, (req, res) => {
        let resultados = PSAdata;
        if (req.query.country) resultados = resultados.filter(n => n.country === req.query.country);
        if (req.query.year) resultados = resultados.filter(n => n.year === parseInt(req.query.year));
        res.status(200).json(resultados);
    });

    // POST LISTA
    app.post(BASE_API_URL_PSA, (req, res) => {
        const newData = req.body;
        
        // Validación estricta de sus 5 campos
        if (!newData || Object.keys(newData).length !== 5 || newData.country === undefined || newData.year === undefined || newData.co2_emission === undefined || newData.precipitation === undefined || newData.temperature === undefined) {
            return res.status(400).send("Bad Request: El JSON no tiene los campos esperados");
        }
        
        const exists = PSAdata.find(n => n.country === newData.country && n.year === newData.year);
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

    // GET RECURSO CONCRETO (Mejorado con Año)
    app.get(`${BASE_API_URL_PSA}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        const resource = PSAdata.find(n => n.country === countryName && n.year === year);
        if (resource) res.status(200).json(resource);
        else res.status(404).send("Not Found");
    });

    // POST RECURSO CONCRETO
    app.post(`${BASE_API_URL_PSA}/:country/:year`, (req, res) => res.status(405).send("Method Not Allowed"));

    // PUT RECURSO CONCRETO (Mejorado con Año)
    app.put(`${BASE_API_URL_PSA}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        const updatedData = req.body;
        
        const index = PSAdata.findIndex(n => n.country === countryName && n.year === year);
        if (index === -1) return res.status(404).send("Not Found");
        
        if (!updatedData || Object.keys(updatedData).length !== 5 || updatedData.country === undefined || updatedData.year === undefined || updatedData.co2_emission === undefined || updatedData.precipitation === undefined || updatedData.temperature === undefined) {
            return res.status(400).send("Bad Request: El JSON no tiene los campos esperados");
        }
        
        if (updatedData.country !== countryName || updatedData.year !== year) {
            return res.status(400).send("Bad Request: El ID de la URL y el del cuerpo deben coincidir");
        }

        PSAdata[index] = updatedData;
        res.status(200).send("Ok: Recurso actualizado");
    });

    // DELETE RECURSO CONCRETO (Mejorado con Año)
    app.delete(`${BASE_API_URL_PSA}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        const initialLength = PSAdata.length;
        
        PSAdata = PSAdata.filter(n => !(n.country === countryName && n.year === year));
        if (PSAdata.length < initialLength) res.status(200).send("Ok: Recurso borrado");
        else res.status(404).send("Not Found");
    });

    // SAMPLE PSA
    app.get("/samples/PSA", (req, res) => {
        let average = average_PSA(PSAdata_initial);
        res.status(200).send(String(average)); 
    });
};