// Archivo: apis/api-JLRA.js
import { dataJLRA } from "../index-JLRA.js";
import Datastore from "nedb";

// 1. Configuramos la Base de Datos
const db = new Datastore({ filename: './jlra.db', autoload: true });
const BASE_API_URL_JLRA = "/api/v1/social-drinking-behaviors";

export const loadJLRA = (app) => {

    // CARGA INICIAL
    app.get(`${BASE_API_URL_JLRA}/loadInitialData`, (req, res) => {
        // Buscamos si ya hay algo en la BD
        db.find({}, function (err, docs) {
            if (err) return res.status(500).send("Internal Server Error");
            
            if (docs.length === 0) {
                // Si está vacía, insertamos los datos iniciales
                db.insert(dataJLRA, function (err, newDocs) {
                    if (err) return res.status(500).send("Internal Server Error");
                    res.status(200).send("Ok: Recursos de JLRA cargados en la base de datos");
                });
            } else {
                res.status(409).send("Conflict: Los recursos ya están cargados");
            }
        });
    });

    // GET LISTA Y BÚSQUEDAS
    // GET LISTA, BÚSQUEDAS Y PAGINACIÓN (Buenas prácticas L05)
    app.get(BASE_API_URL_JLRA, (req, res) => {
        let query = {};

        if (req.query.country) query.country = req.query.country;
        if (req.query.year) query.year = parseInt(req.query.year);

        let offset = 0;
        let limit = 0;

        if (req.query.offset) {
            offset = parseInt(req.query.offset);
            if (isNaN(offset) || offset < 0) {
                return res.status(400).send("Bad Request: El parámetro 'offset' debe ser un número entero positivo");
            }
        }

        if (req.query.limit) {
            limit = parseInt(req.query.limit);
           if (isNaN(limit) || limit <= 0) {
                return res.status(400).send("Bad Request: El parámetro 'limit' debe ser un número entero mayor que 0");
            }
        }
        db.find(query, { _id: 0 }).skip(offset).limit(limit).exec(function (err, docs) {
            if (err) {
                console.log("❌ Error en el GET de la lista:", err);
                return res.status(500).send("Internal Server Error");
            }
            res.status(200).json(docs);
        });
    });

    // POST LISTA
    app.post(BASE_API_URL_JLRA, (req, res) => {
        const newData = req.body;
        
        // Validación estricta
        if (!newData || Object.keys(newData).length !== 6 || newData.country === undefined || newData.year === undefined || newData.total_liter === undefined || newData.beer_share === undefined || newData.wine_share === undefined || newData.spirit_share === undefined) {
            return res.status(400).send("Bad Request: El JSON no tiene los campos esperados");
        }
        
        // Buscamos si ya existe ese país en ese año
        db.find({ country: newData.country, year: newData.year }, function (err, docs) {
            if (err) return res.status(500).send("Internal Server Error");
            
            if (docs.length > 0) {
                return res.status(409).send("Conflict: El recurso ya existe");
            } else {
                db.insert(newData, function (err, newDoc) {
                    if (err) return res.status(500).send("Internal Server Error");
                    res.status(201).send("Created");
                });
            }
        });
    });

    // PUT LISTA
    app.put(BASE_API_URL_JLRA, (req, res) => res.status(405).send("Method Not Allowed"));

    // DELETE LISTA
    app.delete(BASE_API_URL_JLRA, (req, res) => {
        // multi: true borra todos los documentos que coincidan (en este caso, todos)
        db.remove({}, { multi: true }, function (err, numRemoved) {
            if (err) return res.status(500).send("Internal Server Error");
            res.status(200).send("Ok: Todos los recursos borrados");
        });
    });

    // GET RECURSO CONCRETO
    app.get(`${BASE_API_URL_JLRA}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        
        db.find({ country: countryName, year: year }, { _id: 0 }, function (err, docs) {
            if (err) return res.status(500).send("Internal Server Error");
            
            if (docs.length > 0) {
                // Devolvemos docs[0] para devolver un OBJETO, no un array (Regla F06)
                res.status(200).json(docs[0]); 
            } else {
                res.status(404).send("Not Found");
            }
        });
    });

    // POST RECURSO CONCRETO
    app.post(`${BASE_API_URL_JLRA}/:country/:year`, (req, res) => res.status(405).send("Method Not Allowed"));

    // PUT RECURSO CONCRETO
    app.put(`${BASE_API_URL_JLRA}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        const updatedData = req.body;
        
        if (!updatedData || Object.keys(updatedData).length !== 6 || updatedData.country === undefined || updatedData.year === undefined || updatedData.total_liter === undefined || updatedData.beer_share === undefined || updatedData.wine_share === undefined || updatedData.spirit_share === undefined) {
            return res.status(400).send("Bad Request: El JSON no tiene los campos esperados");
        }
        
        if (updatedData.country !== countryName || updatedData.year !== year) {
            return res.status(400).send("Bad Request: El ID de la URL y el del cuerpo deben coincidir");
        }

        db.update({ country: countryName, year: year }, updatedData, {}, function (err, numReplaced) {
            if (err) return res.status(500).send("Internal Server Error");
            
            if (numReplaced === 0) {
                return res.status(404).send("Not Found");
            } else {
                res.status(200).send("Ok: Recurso actualizado");
            }
        });
    });

    // DELETE RECURSO CONCRETO
    app.delete(`${BASE_API_URL_JLRA}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        
        db.remove({ country: countryName, year: year }, {}, function (err, numRemoved) {
            if (err) return res.status(500).send("Internal Server Error");
            
            if (numRemoved === 0) {
                return res.status(404).send("Not Found");
            } else {
                res.status(200).send("Ok: Recurso borrado");
            }
        });
    });
};