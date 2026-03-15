// Archivo: apis/api-JLRA.js
import { dataJLRA } from "../index-JLRA.js";
import Datastore from "nedb";

//comentario puesto para probar los test del pull.
// 1. Configuramos la Base de Datos
const db = new Datastore({ filename: './jlra.db', autoload: true });
const BASE_API_URL_JLRA = "/api/v1/social-drinking-behaviors";

export const loadJLRA = (app) => {

    // CARGA INICIAL
    app.get(`${BASE_API_URL_JLRA}/loadInitialData`, (req, res) => {
        db.find({}, function (err, docs) {
            if (err) return res.sendStatus(500);
            
            if (docs.length === 0) {
                db.insert(dataJLRA, function (err, newDocs) {
                    if (err) return res.sendStatus(500);
                    res.sendStatus(200); 
                });
            } else {
                res.sendStatus(409);
            }
        });
    });

    //Postman documentación
    app.get(`${BASE_API_URL_JLRA}/docs`, (req, res) => {
        res.redirect("https://juanlu-s-team.docs.buildwithfern.com/my-collection/get-data-query");
    });

    // GET LISTA, BÚSQUEDAS Y PAGINACIÓN
    app.get(BASE_API_URL_JLRA, (req, res) => {
        let query = {};
        
        if (req.query.country) query.country = req.query.country;
        if (req.query.year) query.year = parseInt(req.query.year);
        if (req.query.total_liter) query.total_liter = parseFloat(req.query.total_liter);
        if (req.query.beer_share) query.beer_share = parseFloat(req.query.beer_share);
        if (req.query.wine_share) query.wine_share = parseFloat(req.query.wine_share);
        if (req.query.spirit_share) query.spirit_share = parseFloat(req.query.spirit_share);

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
        
        db.find(query, { _id: 0 }).skip(offset).limit(limit).exec(function (err, docs) {
            if (err) return res.sendStatus(500);
            res.status(200).json(docs); 
        });
    });

    // POST LISTA
    app.post(BASE_API_URL_JLRA, (req, res) => {
        const newData = req.body;
        
        if (!newData || Object.keys(newData).length !== 6 || newData.country === undefined || newData.year === undefined || newData.total_liter === undefined || newData.beer_share === undefined || newData.wine_share === undefined || newData.spirit_share === undefined) {
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
    app.put(BASE_API_URL_JLRA, (req, res) => res.sendStatus(405));

    // DELETE LISTA
    app.delete(BASE_API_URL_JLRA, (req, res) => {
        db.remove({}, { multi: true }, function (err, numRemoved) {
            if (err) return res.sendStatus(500);
            res.sendStatus(200);
        });
    });

    // GET RECURSO CONCRETO
    app.get(`${BASE_API_URL_JLRA}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        
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
    app.post(`${BASE_API_URL_JLRA}/:country/:year`, (req, res) => res.sendStatus(405));

    // PUT RECURSO CONCRETO
    app.put(`${BASE_API_URL_JLRA}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        const updatedData = req.body;
        
        if (!updatedData || Object.keys(updatedData).length !== 6 || updatedData.country === undefined || updatedData.year === undefined || updatedData.total_liter === undefined || updatedData.beer_share === undefined || updatedData.wine_share === undefined || updatedData.spirit_share === undefined) {
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
    app.delete(`${BASE_API_URL_JLRA}/:country/:year`, (req, res) => {
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