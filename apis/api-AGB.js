// Archivo: apis/api-AGB.js
import { dataAGB } from "../index-AGB.js";
import Datastore from "nedb";

// 1. Configuramos la Base de Datos
const db = new Datastore({ filename: './agb.db', autoload: true });
const BASE_API_URL_AGB = "/api/v1/international-tourist-arrivals";

export const loadAGB = (app) => {

    // CARGA INICIAL
    app.get(`${BASE_API_URL_AGB}/loadInitialData`, (req, res) => {
        db.find({}, function (err, docs) {
            if (err) return res.sendStatus(500);
            
            if (docs.length === 0) {
                db.insert(dataAGB, function (err, newDocs) {
                    if (err) return res.sendStatus(500);
                    res.sendStatus(200); 
                });
            } else {
                res.sendStatus(409);
            }
        });
    });

    //Postman documentación
    app.get(`${BASE_API_URL_AGB}/docs`, (req, res) => {
        // TODO: SUSTITUYE ESTE ENLACE POR EL DE TU DOCUMENTACIÓN DE POSTMAN
        res.redirect("https://documenter.getpostman.com/view/TU_ID_AQUI/TU_ENLACE");
    });

    // GET LISTA, BÚSQUEDAS Y PAGINACIÓN
    app.get(BASE_API_URL_AGB, (req, res) => {
        let query = {};
        
        if (req.query.country) query.country = req.query.country;
        if (req.query.year) query.year = parseInt(req.query.year);
        if (req.query.air_arrival) query.air_arrival = parseInt(req.query.air_arrival);
        if (req.query.water_arrival) query.water_arrival = parseInt(req.query.water_arrival);
        if (req.query.land_arrival) query.land_arrival = parseInt(req.query.land_arrival);

        let offset = 0;
        let limit = 0;

        if (req.query.offset) {
            offset = parseInt(req.query.offset);
            if (isNaN(offset) || offset < 0) {
                return res.sendStatus(400); 
            }
        }

        if (req.query.limit) {
            limit = parseInt(req.query.limit);
           if (isNaN(limit) || limit <= 0) {
                return res.sendStatus(400); 
            }
        }
        
        // El { _id: 0 } es la clave para que NeDB no devuelva ese campo (igual que JLRA)
        db.find(query, { _id: 0 }).skip(offset).limit(limit).exec(function (err, docs) {
            if (err) return res.sendStatus(500);
            res.status(200).json(docs); 
        });
    });

    // POST LISTA
    app.post(BASE_API_URL_AGB, (req, res) => {
        const newData = req.body;
        
        // Validación con tus 5 campos (country, year, air, water, land)
        if (!newData || Object.keys(newData).length !== 5 || newData.country === undefined || newData.year === undefined || newData.air_arrival === undefined || newData.water_arrival === undefined || newData.land_arrival === undefined) {
            return res.sendStatus(400);
        }
        
        db.find({ country: newData.country, year: newData.year }, function (err, docs) {
            if (err) return res.sendStatus(500);
            
            if (docs.length > 0) {
                return res.sendStatus(409);
            } else {
                db.insert(newData, function (err, newDoc) {
                    if (err) return res.sendStatus(500);
                    res.sendStatus(201);
                });
            }
        });
    });

    // PUT LISTA
    app.put(BASE_API_URL_AGB, (req, res) => res.sendStatus(405));

    // DELETE LISTA
    app.delete(BASE_API_URL_AGB, (req, res) => {
        db.remove({}, { multi: true }, function (err, numRemoved) {
            if (err) return res.sendStatus(500);
            res.sendStatus(200);
        });
    });

    // GET RECURSO CONCRETO
    app.get(`${BASE_API_URL_AGB}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        
        // Igual que JLRA: busca y filtra el _id
        db.find({ country: countryName, year: year }, { _id: 0 }, function (err, docs) {
            if (err) return res.sendStatus(500);
            
            if (docs.length > 0) {
                res.status(200).json(docs[0]); 
            } else {
                res.sendStatus(404);
            }
        });
    });

    // POST RECURSO CONCRETO
    app.post(`${BASE_API_URL_AGB}/:country/:year`, (req, res) => res.sendStatus(405));

    // PUT RECURSO CONCRETO
    app.put(`${BASE_API_URL_AGB}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        const updatedData = req.body;
        
        // Validación con tus 5 campos
        if (!updatedData || Object.keys(updatedData).length !== 5 || updatedData.country === undefined || updatedData.year === undefined || updatedData.air_arrival === undefined || updatedData.water_arrival === undefined || updatedData.land_arrival === undefined) {
            return res.sendStatus(400);
        }
        
        if (updatedData.country !== countryName || updatedData.year !== year) {
            return res.sendStatus(400);
        }

        db.update({ country: countryName, year: year }, updatedData, {}, function (err, numReplaced) {
            if (err) return res.sendStatus(500);
            
            if (numReplaced === 0) {
                return res.sendStatus(404);
            } else {
                res.sendStatus(200);
            }
        });
    });

    // DELETE RECURSO CONCRETO
    app.delete(`${BASE_API_URL_AGB}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        
        db.remove({ country: countryName, year: year }, {}, function (err, numRemoved) {
            if (err) return res.sendStatus(500);
            
            if (numRemoved === 0) {
                return res.sendStatus(404);
            } else {
                res.sendStatus(200);
            }
        });
    });
};