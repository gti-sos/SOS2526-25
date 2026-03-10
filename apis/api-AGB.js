// Archivo: apis/api-AGB.js
import { dataAGB, average_AGB } from "../index-AGB.js";

let AGBdata = [];
const BASE_API_URL_AGB = "/api/v1/international-tourist-arrivals";

export const loadAGB = (app) => {

    // CARGA INICIAL
    app.get(`${BASE_API_URL_AGB}/loadInitialData`, (req, res) => {
        if (AGBdata.length === 0){
            AGBdata = [...dataAGB];
            res.status(200).send("Ok: Recursos de AGB cargados");
        } else {
            res.status(409).send("Conflict: Datos ya en memoria");
        } 
    });

    // GET LISTA Y BÚSQUEDAS
    app.get(BASE_API_URL_AGB, (req, res) => {
        let resultados = AGBdata;
        if (req.query.country) resultados = resultados.filter(n => n.country === req.query.country);
        if (req.query.year) resultados = resultados.filter(n => n.year === parseInt(req.query.year));
        res.status(200).json(resultados);
    });

    // POST LISTA
    app.post(BASE_API_URL_AGB, (req, res) => {
        const newData = req.body;
        
        // Validación estricta de sus 5 campos
        if (!newData || Object.keys(newData).length !== 5 || newData.country === undefined || newData.year === undefined || newData.air_arrival === undefined || newData.water_arrival === undefined || newData.land_arrival === undefined) {
            return res.status(400).send("Bad Request: El JSON no tiene los campos esperados");
        }
        
        const exists = AGBdata.find(n => n.country === newData.country && n.year === newData.year);
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

    // GET RECURSO CONCRETO (Mejorado con Año)
    app.get(`${BASE_API_URL_AGB}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        const resource = AGBdata.find(n => n.country === countryName && n.year === year);
        if (resource) res.status(200).json(resource);
        else res.status(404).send("Not Found");
    });

    // POST RECURSO CONCRETO
    app.post(`${BASE_API_URL_AGB}/:country/:year`, (req, res) => res.status(405).send("Method Not Allowed"));

    // PUT RECURSO CONCRETO (Mejorado con Año)
    app.put(`${BASE_API_URL_AGB}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        const updatedData = req.body;
        
        const index = AGBdata.findIndex(n => n.country === countryName && n.year === year);
        if (index === -1) return res.status(404).send("Not Found");
        
        if (!updatedData || Object.keys(updatedData).length !== 5 || updatedData.country === undefined || updatedData.year === undefined || updatedData.air_arrival === undefined || updatedData.water_arrival === undefined || updatedData.land_arrival === undefined) {
            return res.status(400).send("Bad Request: El JSON no tiene los campos esperados");
        }
        
        if (updatedData.country !== countryName || updatedData.year !== year) {
            return res.status(400).send("Bad Request: El ID de la URL y el del cuerpo deben coincidir");
        }

        AGBdata[index] = updatedData;
        res.status(200).send("Ok: Recurso actualizado");
    });

    // DELETE RECURSO CONCRETO (Mejorado con Año)
    app.delete(`${BASE_API_URL_AGB}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        const initialLength = AGBdata.length;
        
        AGBdata = AGBdata.filter(n => !(n.country === countryName && n.year === year));
        if (AGBdata.length < initialLength) res.status(200).send("Ok: Recurso borrado");
        else res.status(404).send("Not Found");
    });

    // SAMPLE AGB
    app.get("/samples/AGB", (req, res) => {
        let average = average_AGB(dataAGB);
        res.status(200).send(String(average)); 
    });
};