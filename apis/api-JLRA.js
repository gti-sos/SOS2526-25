
import { dataJLRA } from "../index-JLRA.js"; 

let JLRAdata = []; 
const BASE_API_URL_JLRA = "/api/v1/social-drinking-behaviors";

export const loadJLRA = (app) => {

    // CARGA INICIAL
    app.get(`${BASE_API_URL_JLRA}/loadInitialData`, (req, res) => {
        if (JLRAdata.length === 0){
            JLRAdata = [...dataJLRA]; 
            res.status(200).send("Ok: Recursos de JLRA cargados");
        } else {
            res.status(409).send("Conflict: Los recursos ya están en memoria");
        } 
    });

    // GET LISTA Y BÚSQUEDAS (Filtros)
    app.get(BASE_API_URL_JLRA, (req, res) => {
        let resultados = JLRAdata;
        if (req.query.country) resultados = resultados.filter(n => n.country === req.query.country);
        if (req.query.year) resultados = resultados.filter(n => n.year === parseInt(req.query.year));
        res.status(200).json(resultados);
    });

    // POST LISTA
    app.post(BASE_API_URL_JLRA, (req, res) => {
        const newData = req.body;
        if (!newData || Object.keys(newData).length !== 6 || newData.country === undefined || newData.year === undefined || newData.total_liter === undefined || newData.beer_share === undefined || newData.wine_share === undefined || newData.spirit_share === undefined) {
            return res.status(400).send("Bad Request: El JSON no tiene los campos esperados");
        }
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
    app.post(`${BASE_API_URL_JLRA}/:country/:year`, (req, res) => res.status(405).send("Method Not Allowed"));

    // PUT RECURSO CONCRETO
    app.put(`${BASE_API_URL_JLRA}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        const updatedData = req.body;
        
        const index = JLRAdata.findIndex(n => n.country === countryName && n.year === year);
        if (index === -1) return res.status(404).send("Not Found");

        if (!updatedData || Object.keys(updatedData).length !== 6 || updatedData.country === undefined || updatedData.year === undefined || updatedData.total_liter === undefined || updatedData.beer_share === undefined || updatedData.wine_share === undefined || updatedData.spirit_share === undefined) {
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

    // SAMPLE JLRA
    app.get("/samples/JLRA", (req, res) => {
        let datos = dataJLRA; 
        let philippines = datos.filter((n) => n.country === "Philippines");
        let beer = philippines.map((n) => n.beer_share);
        let average = beer.reduce((n, b) => n + b, 0) / beer.length;
        res.status(200).send(String(average)); 
    });
};