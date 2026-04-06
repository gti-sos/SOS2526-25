// Archivo: apis/api-AGB.js
import { dataAGB } from "../index-AGB.js";
import Datastore from "nedb";

// 1. Configuramos la Base de Datos
const db = new Datastore({ filename: './data/agb.db', autoload: true });

// Definimos las dos rutas base
const BASE_API_URL_V1 = "/api/v1/international-tourist-arrivals";
const BASE_API_URL_V2 = "/api/v2/international-tourist-arrivals";

export const loadAGB = (app) => {

    // =========================================================================
    // VERSIÓN 1 
    // =========================================================================

    // CARGA INICIAL
    app.get(`${BASE_API_URL_V1}/loadInitialData`, (req, res) => {
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

    //Postman documentación V1
    app.get(`${BASE_API_URL_V1}/docs`, (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52411500/2sBXigNZNT");
    });

    // GET LISTA, BÚSQUEDAS Y PAGINACIÓN V1
    app.get(BASE_API_URL_V1, (req, res) => {
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
            if (isNaN(offset) || offset < 0) return res.sendStatus(400); 
        }
        if (req.query.limit) {
            limit = parseInt(req.query.limit);
           if (isNaN(limit) || limit <= 0) return res.sendStatus(400); 
        }
        
        db.find(query, { _id: 0 }).skip(offset).limit(limit).exec(function (err, docs) {
            if (err) return res.sendStatus(500);
            res.status(200).json(docs); 
        });
    });

    // POST LISTA V1
    app.post(BASE_API_URL_V1, (req, res) => {
        const newData = req.body;
        if (!newData || Object.keys(newData).length !== 5 || newData.country === undefined || newData.year === undefined || newData.air_arrival === undefined || newData.water_arrival === undefined || newData.land_arrival === undefined) {
            return res.sendStatus(400);
        }
        db.find({ country: newData.country, year: newData.year }, function (err, docs) {
            if (err) return res.sendStatus(500);
            if (docs.length > 0) return res.sendStatus(409);
            db.insert(newData, function (err, newDoc) {
                if (err) return res.sendStatus(500);
                res.sendStatus(201);
            });
        });
    });

    // PUT LISTA V1
    app.put(BASE_API_URL_V1, (req, res) => res.sendStatus(405));

    // DELETE LISTA V1
    app.delete(BASE_API_URL_V1, (req, res) => {
        db.remove({}, { multi: true }, function (err, numRemoved) {
            if (err) return res.sendStatus(500);
            res.sendStatus(200);
        });
    });

    // GET RECURSO CONCRETO V1
    app.get(`${BASE_API_URL_V1}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        db.find({ country: countryName, year: year }, { _id: 0 }, function (err, docs) {
            if (err) return res.sendStatus(500);
            if (docs.length > 0) res.status(200).json(docs[0]); 
            else res.sendStatus(404);
        });
    });

    // POST RECURSO CONCRETO V1
    app.post(`${BASE_API_URL_V1}/:country/:year`, (req, res) => res.sendStatus(405));

    // PUT RECURSO CONCRETO V1
    app.put(`${BASE_API_URL_V1}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        const updatedData = req.body;
        
        if (!updatedData || Object.keys(updatedData).length !== 5 || updatedData.country === undefined || updatedData.year === undefined || updatedData.air_arrival === undefined || updatedData.water_arrival === undefined || updatedData.land_arrival === undefined) {
            return res.sendStatus(400);
        }
        if (updatedData.country !== countryName || updatedData.year !== year) return res.sendStatus(400);

        db.update({ country: countryName, year: year }, updatedData, {}, function (err, numReplaced) {
            if (err) return res.sendStatus(500);
            if (numReplaced === 0) return res.sendStatus(404);
            else res.sendStatus(200);
        });
    });

    // DELETE RECURSO CONCRETO V1
    app.delete(`${BASE_API_URL_V1}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        db.remove({ country: countryName, year: year }, {}, function (err, numRemoved) {
            if (err) return res.sendStatus(500);
            if (numRemoved === 0) return res.sendStatus(404);
            else res.sendStatus(200);
        });
    });

    // =========================================================================
    // VERSIÓN 2
    // =========================================================================

    // CARGA INICIAL V2
    app.get(`${BASE_API_URL_V2}/loadInitialData`, (req, res) => {
        db.find({}, function (err, docs) {
            if (err) return res.sendStatus(500);
            if (docs.length === 0) {
                db.insert(dataAGB, function (err, newDocs) {
                    if (err) return res.sendStatus(500);
                    res.sendStatus(200); 
                });
            } else { res.sendStatus(409); }
        });
    });

    // Postman documentación V2
    app.get(`${BASE_API_URL_V2}/docs`, (req, res) => {
        // ⚠️ ATENCIÓN: ¡Acuérdate de cambiar este enlace cuando crees la documentación V2 en Postman!
        res.redirect("https://documenter.getpostman.com/view/52411500/2sBXiqEUYx");
    });

    // GET LISTA V2 (Con la mejora de rangos `from` y `to`)
    app.get(BASE_API_URL_V2, (req, res) => {
        let query = {};
        
        if (req.query.country) query.country = req.query.country;
        if (req.query.air_arrival) query.air_arrival = parseInt(req.query.air_arrival);
        if (req.query.water_arrival) query.water_arrival = parseInt(req.query.water_arrival);
        if (req.query.land_arrival) query.land_arrival = parseInt(req.query.land_arrival);

        // Si mandan 'from' o 'to', creamos el rango. Si mandan 'year', búsqueda exacta.
        if (req.query.from || req.query.to) {
            query.year = {};
            if (req.query.from) query.year.$gte = parseInt(req.query.from);
            if (req.query.to) query.year.$lte = parseInt(req.query.to);
        } else if (req.query.year) {
            query.year = parseInt(req.query.year);
        }

        let offset = 0; let limit = 0;
        if (req.query.offset) {
            offset = parseInt(req.query.offset);
            if (isNaN(offset) || offset < 0) return res.sendStatus(400); 
        }
        if (req.query.limit) {
            limit = parseInt(req.query.limit);
           if (isNaN(limit) || limit <= 0) return res.sendStatus(400); 
        }
        
        db.find(query, { _id: 0 }).skip(offset).limit(limit).exec(function (err, docs) {
            if (err) return res.sendStatus(500);
            res.status(200).json(docs); 
        });
    });

    // POST LISTA V2
    app.post(BASE_API_URL_V2, (req, res) => {
        const newData = req.body;
        if (!newData || Object.keys(newData).length !== 5 || newData.country === undefined || newData.year === undefined || newData.air_arrival === undefined || newData.water_arrival === undefined || newData.land_arrival === undefined) {
            return res.sendStatus(400);
        }
        db.find({ country: newData.country, year: newData.year }, function (err, docs) {
            if (err) return res.sendStatus(500);
            if (docs.length > 0) return res.sendStatus(409);
            db.insert(newData, function (err, newDoc) {
                if (err) return res.sendStatus(500);
                res.sendStatus(201);
            });
        });
    });

    app.put(BASE_API_URL_V2, (req, res) => res.sendStatus(405));

    app.delete(BASE_API_URL_V2, (req, res) => {
        db.remove({}, { multi: true }, function (err, numRemoved) {
            if (err) return res.sendStatus(500);
            res.sendStatus(200);
        });
    });

    // GET RECURSO CONCRETO V2
    app.get(`${BASE_API_URL_V2}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        db.find({ country: countryName, year: year }, { _id: 0 }, function (err, docs) {
            if (err) return res.sendStatus(500);
            if (docs.length > 0) res.status(200).json(docs[0]); 
            else res.sendStatus(404);
        });
    });

    app.post(`${BASE_API_URL_V2}/:country/:year`, (req, res) => res.sendStatus(405));

    app.put(`${BASE_API_URL_V2}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        const updatedData = req.body;
        if (!updatedData || Object.keys(updatedData).length !== 5 || updatedData.country === undefined || updatedData.year === undefined || updatedData.air_arrival === undefined || updatedData.water_arrival === undefined || updatedData.land_arrival === undefined) {
            return res.sendStatus(400);
        }
        if (updatedData.country !== countryName || updatedData.year !== year) return res.sendStatus(400);

        db.update({ country: countryName, year: year }, updatedData, {}, function (err, numReplaced) {
            if (err) return res.sendStatus(500);
            if (numReplaced === 0) return res.sendStatus(404);
            else res.sendStatus(200);
        });
    });

    app.delete(`${BASE_API_URL_V2}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        db.remove({ country: countryName, year: year }, {}, function (err, numRemoved) {
            if (err) return res.sendStatus(500);
            if (numRemoved === 0) return res.sendStatus(404);
            else res.sendStatus(200);
        });
    });
};