// Archivo: apis/api-JLRA.js
import Datastore from "nedb";

// 1. Configuramos la Base de Datos
const db = new Datastore({ filename: './data/jlra.db', autoload: true });

// Definimos las dos rutas base
const BASE_API_URL_V1 = "/api/v1/social-drinking-behaviors";
const BASE_API_URL_V2 = "/api/v2/social-drinking-behaviors";

const dataJLRA = [
    { country: "Germany", year: 2021, total_liter: 10.4, beer_share: 4.7, wine_share: 3.3, spirit_share: 2.4 },
    { country: "Albania", year: 2022, total_liter: 4.6, beer_share: 1.8, wine_share: 1.6, spirit_share: 1.1 },
    { country: "Albania", year: 2021, total_liter: 4.5, beer_share: 1.8, wine_share: 1.5, spirit_share: 1.2 },
    { country: "Argentina", year: 2018, total_liter: 7.6, beer_share: 3.3, wine_share: 2.5, spirit_share: 0.7 },
    { country: "Bulgaria", year: 2019, total_liter: 10.8, beer_share: 4.6, wine_share: 1.3, spirit_share: 4.8 },
    { country: "Georgia", year: 2020, total_liter: 8.5, beer_share: 1.9, wine_share: 4.4, spirit_share: 2.2 },
    { country: "Italy", year: 2019, total_liter: 7.6, beer_share: 1.8, wine_share: 5.3, spirit_share: 0.5 },
    { country: "Nambia", year: 2017, total_liter: 11.0, beer_share: 6.7, wine_share: 3.1, spirit_share: 0.7 },
    { country: "Syrian Arab Republic", year: 2020, total_liter: 0.1, beer_share: 0.0, wine_share: 0.0, spirit_share: 0.1 },
    { country: "Philippines", year: 2020, total_liter: 4.5, beer_share: 0.9, wine_share: 0.0, spirit_share: 3.5 },
    { country: "Philippines", year: 2019, total_liter: 5.1, beer_share: 1.5, wine_share: 0.0, spirit_share: 3.5 }, 
    { country: "Philippines", year: 2016, total_liter: 5.2, beer_share: 1.6, wine_share: 0.0, spirit_share: 3.1 }
];

export const loadJLRA = (app) => {

    // =========================================================================
    // VERSIÓN 1 
    // =========================================================================

    app.get(`${BASE_API_URL_V1}/loadInitialData`, (req, res) => {
        db.find({}, function (err, docs) {
            if (err) return res.sendStatus(500);
            if (docs.length === 0) {
                db.insert(dataJLRA, function (err, newDocs) {
                    if (err) return res.sendStatus(500);
                    res.sendStatus(200); 
                });
            } else { res.sendStatus(409); }
        });
    });

    app.get(`${BASE_API_URL_V1}/docs`, (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52398088/2sBXigNZg3");
    });

    app.get(BASE_API_URL_V1, (req, res) => {
        let query = {};
        if (req.query.country) query.country = req.query.country;
        if (req.query.year) query.year = parseInt(req.query.year);
        if (req.query.total_liter) query.total_liter = parseFloat(req.query.total_liter);
        if (req.query.beer_share) query.beer_share = parseFloat(req.query.beer_share);
        if (req.query.wine_share) query.wine_share = parseFloat(req.query.wine_share);
        if (req.query.spirit_share) query.spirit_share = parseFloat(req.query.spirit_share);

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

    app.post(BASE_API_URL_V1, (req, res) => {
        const newData = req.body;
        if (!newData || Object.keys(newData).length !== 6 || newData.country === undefined || newData.year === undefined || newData.total_liter === undefined || newData.beer_share === undefined || newData.wine_share === undefined || newData.spirit_share === undefined) {
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

    app.put(BASE_API_URL_V1, (req, res) => res.sendStatus(405));

    app.delete(BASE_API_URL_V1, (req, res) => {
        db.remove({}, { multi: true }, function (err, numRemoved) {
            if (err) return res.sendStatus(500);
            res.sendStatus(200);
        });
    });

    app.get(`${BASE_API_URL_V1}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        db.find({ country: countryName, year: year }, { _id: 0 }, function (err, docs) {
            if (err) return res.sendStatus(500);
            if (docs.length > 0) res.status(200).json(docs[0]); 
            else res.sendStatus(404);
        });
    });

    app.post(`${BASE_API_URL_V1}/:country/:year`, (req, res) => res.sendStatus(405));

    app.put(`${BASE_API_URL_V1}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        const updatedData = req.body;
        if (!updatedData || Object.keys(updatedData).length !== 6 || updatedData.country === undefined || updatedData.year === undefined || updatedData.total_liter === undefined || updatedData.beer_share === undefined || updatedData.wine_share === undefined || updatedData.spirit_share === undefined) {
            return res.sendStatus(400);
        }
        if (updatedData.country !== countryName || updatedData.year !== year) return res.sendStatus(400);

        db.update({ country: countryName, year: year }, updatedData, {}, function (err, numReplaced) {
            if (err) return res.sendStatus(500);
            if (numReplaced === 0) return res.sendStatus(404);
            else res.sendStatus(200);
        });
    });

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

    app.get(`${BASE_API_URL_V2}/loadInitialData`, (req, res) => {
        db.find({}, function (err, docs) {
            if (err) return res.sendStatus(500);
            if (docs.length === 0) {
                db.insert(dataJLRA, function (err, newDocs) {
                    if (err) return res.sendStatus(500);
                    res.sendStatus(200); 
                });
            } else { res.sendStatus(409); }
        });
    });

    // ⚠️ ATENCIÓN: Aquí tendrás que poner el nuevo enlace de Postman cuando lo crees
    app.get(`${BASE_API_URL_V2}/docs`, (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52398088/2sBXiomA1M");
    });

    // GET LISTA V2 (¡LA MAGIA ESTÁ AQUÍ!)
    app.get(BASE_API_URL_V2, (req, res) => {
        let query = {};
        
        if (req.query.country) query.country = req.query.country;
        if (req.query.total_liter) query.total_liter = parseFloat(req.query.total_liter);
        if (req.query.beer_share) query.beer_share = parseFloat(req.query.beer_share);
        if (req.query.wine_share) query.wine_share = parseFloat(req.query.wine_share);
        if (req.query.spirit_share) query.spirit_share = parseFloat(req.query.spirit_share);

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
        if (!newData || Object.keys(newData).length !== 6 || newData.country === undefined || newData.year === undefined || newData.total_liter === undefined || newData.beer_share === undefined || newData.wine_share === undefined || newData.spirit_share === undefined) {
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
        if (!updatedData || Object.keys(updatedData).length !== 6 || updatedData.country === undefined || updatedData.year === undefined || updatedData.total_liter === undefined || updatedData.beer_share === undefined || updatedData.wine_share === undefined || updatedData.spirit_share === undefined) {
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