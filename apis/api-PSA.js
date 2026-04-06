// Archivo: apis/api-PSA.js
import Datastore from 'nedb';

// Inicializamos la base de datos NeDB
const db = new Datastore({ filename: './data/PSA.db', autoload: true });
const BASE_API_URL_PSA_V1 = "/api/v1/average-annual-temperatures";
const BASE_API_URL_PSA_V2 = "/api/v2/average-annual-temperatures";

let PSAdata_initial = [
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

export const loadPSA = (app) => {

    // =========================================================================
    // VERSIÓN 1 (Legado)
    // =========================================================================
    app.get(`${BASE_API_URL_PSA_V1}/loadInitialData`, (req, res) => {
        db.find({}, (err, docs) => {
            if (err) return res.sendStatus(500);
            if (docs.length === 0) {
                db.insert(PSAdata_initial, (err, newDocs) => {
                    if (err) return res.sendStatus(500);
                    res.sendStatus(201);
                });
            } else {
                res.sendStatus(409);
            }
        });
    });

    app.get(`${BASE_API_URL_PSA_V1}/docs`, (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52345894/2sBXigKYGM");
    });

    app.get(BASE_API_URL_PSA_V1, (req, res) => {
        let query = {};
        if (req.query.country) query.country = req.query.country;
        if (req.query.year) query.year = parseInt(req.query.year);
        if (req.query.co2_emission) query.co2_emission = parseFloat(req.query.co2_emission);
        if (req.query.precipitation) query.precipitation = parseFloat(req.query.precipitation);
        if (req.query.temperature) query.temperature = parseFloat(req.query.temperature);

        let offset = 0; let limit = 0;
        if (req.query.offset) offset = parseInt(req.query.offset);
        if (req.query.limit) limit = parseInt(req.query.limit);

        db.find(query, { _id: 0 }).skip(offset).limit(limit).exec((err, docs) => {
            if (err) return res.sendStatus(500);
            res.status(200).json(docs);
        });
    });

    app.post(BASE_API_URL_PSA_V1, (req, res) => {
        const newData = req.body;
        if (!newData || Object.keys(newData).length !== 5 || newData.country === undefined || newData.year === undefined || newData.co2_emission === undefined || newData.precipitation === undefined || newData.temperature === undefined) {
            return res.sendStatus(400);
        }
        db.find({ country: newData.country, year: newData.year }, (err, docs) => {
            if (err) return res.sendStatus(500);
            if (docs.length > 0) return res.sendStatus(409);
            db.insert(newData, (err, newDoc) => {
                if (err) return res.sendStatus(500);
                res.sendStatus(201);
            });
        });
    });

    app.put(BASE_API_URL_PSA_V1, (req, res) => res.sendStatus(405));

    app.delete(BASE_API_URL_PSA_V1, (req, res) => {
        db.remove({}, { multi: true }, (err, numRemoved) => {
            if (err) return res.sendStatus(500);
            res.sendStatus(200);
        });
    });

    app.get(`${BASE_API_URL_PSA_V1}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        db.find({ country: countryName, year: year }, { _id: 0 }, (err, docs) => {
            if (err) return res.sendStatus(500);
            if (docs.length > 0) res.status(200).json(docs[0]);
            else res.sendStatus(404);
        });
    });

    app.post(`${BASE_API_URL_PSA_V1}/:country/:year`, (req, res) => res.sendStatus(405));

    app.put(`${BASE_API_URL_PSA_V1}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        const updatedData = req.body;
        
        if (!updatedData || Object.keys(updatedData).length !== 5 || updatedData.country === undefined || updatedData.year === undefined || updatedData.co2_emission === undefined || updatedData.precipitation === undefined || updatedData.temperature === undefined) {
            return res.sendStatus(400);
        }
        if (updatedData.country !== countryName || updatedData.year !== year) return res.sendStatus(400);

        db.update({ country: countryName, year: year }, updatedData, {}, (err, numReplaced) => {
            if (err) return res.sendStatus(500);
            if (numReplaced === 0) return res.sendStatus(404);
            res.sendStatus(200);
        });
    });

    app.delete(`${BASE_API_URL_PSA_V1}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        db.remove({ country: countryName, year: year }, {}, (err, numRemoved) => {
            if (err) return res.sendStatus(500);
            if (numRemoved === 0) return res.sendStatus(404);
            res.sendStatus(200);
        });
    });

    // =========================================================================
    // VERSIÓN 2 (Con soporte para from y to)
    // =========================================================================
    app.get(`${BASE_API_URL_PSA_V2}/loadInitialData`, (req, res) => {
        db.find({}, (err, docs) => {
            if (err) return res.sendStatus(500);
            if (docs.length === 0) {
                db.insert(PSAdata_initial, (err, newDocs) => {
                    if (err) return res.sendStatus(500);
                    res.sendStatus(201);
                });
            } else {
                res.sendStatus(409);
            }
        });
    });

    app.get(`${BASE_API_URL_PSA_V2}/docs`, (req, res) => {
        // ⚠️ Debes crear la documentación de la v2 en Postman y poner el link aquí
        res.redirect("https://documenter.getpostman.com/view/YOUR_LINK_HERE");
    });

    app.get(BASE_API_URL_PSA_V2, (req, res) => {
        let query = {};
        
        if (req.query.country) query.country = req.query.country;
        if (req.query.co2_emission) query.co2_emission = parseFloat(req.query.co2_emission);
        if (req.query.precipitation) query.precipitation = parseFloat(req.query.precipitation);
        if (req.query.temperature) query.temperature = parseFloat(req.query.temperature);

        // Soporte para from y to
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

        db.find(query, { _id: 0 }).skip(offset).limit(limit).exec((err, docs) => {
            if (err) return res.sendStatus(500);
            res.status(200).json(docs);
        });
    });

    app.post(BASE_API_URL_PSA_V2, (req, res) => {
        const newData = req.body;
        if (!newData || Object.keys(newData).length !== 5 || newData.country === undefined || newData.year === undefined || newData.co2_emission === undefined || newData.precipitation === undefined || newData.temperature === undefined) {
            return res.sendStatus(400);
        }
        db.find({ country: newData.country, year: newData.year }, (err, docs) => {
            if (err) return res.sendStatus(500);
            if (docs.length > 0) return res.sendStatus(409);
            db.insert(newData, (err, newDoc) => {
                if (err) return res.sendStatus(500);
                res.sendStatus(201);
            });
        });
    });

    app.put(BASE_API_URL_PSA_V2, (req, res) => res.sendStatus(405));

    app.delete(BASE_API_URL_PSA_V2, (req, res) => {
        db.remove({}, { multi: true }, (err, numRemoved) => {
            if (err) return res.sendStatus(500);
            res.sendStatus(200);
        });
    });

    app.get(`${BASE_API_URL_PSA_V2}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        db.find({ country: countryName, year: year }, { _id: 0 }, (err, docs) => {
            if (err) return res.sendStatus(500);
            if (docs.length > 0) res.status(200).json(docs[0]);
            else res.sendStatus(404);
        });
    });

    app.post(`${BASE_API_URL_PSA_V2}/:country/:year`, (req, res) => res.sendStatus(405));

    app.put(`${BASE_API_URL_PSA_V2}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        const updatedData = req.body;
        
        if (!updatedData || Object.keys(updatedData).length !== 5 || updatedData.country === undefined || updatedData.year === undefined || updatedData.co2_emission === undefined || updatedData.precipitation === undefined || updatedData.temperature === undefined) {
            return res.sendStatus(400);
        }
        if (updatedData.country !== countryName || updatedData.year !== year) return res.sendStatus(400);

        db.update({ country: countryName, year: year }, updatedData, {}, (err, numReplaced) => {
            if (err) return res.sendStatus(500);
            if (numReplaced === 0) return res.sendStatus(404);
            res.sendStatus(200);
        });
    });

    app.delete(`${BASE_API_URL_PSA_V2}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        db.remove({ country: countryName, year: year }, {}, (err, numRemoved) => {
            if (err) return res.sendStatus(500);
            if (numRemoved === 0) return res.sendStatus(404);
            res.sendStatus(200);
        });
    });
};