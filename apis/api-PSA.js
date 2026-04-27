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
    { country: "China", year: 2021, co2_emission: 12.7, precipitation: 654.33, temperature: 8.23 },
    { country: "Germany", year: 2017, co2_emission: 785, precipitation: 845.50, temperature: 9.60 },
    { country: "Germany", year: 2018, co2_emission: 755, precipitation: 590.20, temperature: 10.45 },
    { country: "Germany", year: 2019, co2_emission: 710, precipitation: 740.00, temperature: 10.30 },
    { country: "Germany", year: 2020, co2_emission: 644, precipitation: 710.40, temperature: 10.40 },
    { country: "Germany", year: 2022, co2_emission: 665, precipitation: 671.00, temperature: 10.50 },
    { country: "Germany", year: 2023, co2_emission: 610, precipitation: 830.00, temperature: 10.60 },
    { country: "Germany", year: 2024, co2_emission: 590, precipitation: 750.00, temperature: 10.70 }
];  

export const loadPSA = (app) => {

    // =========================================================================
    // VERSIÓN 1
    // =========================================================================
    app.get(`${BASE_API_URL_PSA_V1}/loadInitialData`, (req, res) => {
        db.find({}, (err, docs) => {
            if (err) return res.status(500).send("Internal Server Error");
            if (docs.length === 0) {
                db.insert(PSAdata_initial, (err, newDocs) => {
                    if (err) return res.status(500).send("Internal Server Error");
                    res.status(201).send("Ok: Recursos de PSA cargados");
                });
            } else {
                res.status(409).send("Conflict: Datos ya cargados");
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
            if (err) return res.status(500).send("Internal Server Error");
            res.status(200).json(docs);
        });
    });

    app.post(BASE_API_URL_PSA_V1, (req, res) => {
        const newData = req.body;
        if (!newData || Object.keys(newData).length !== 5 || newData.country === undefined || newData.year === undefined || newData.co2_emission === undefined || newData.precipitation === undefined || newData.temperature === undefined) {
            return res.status(400).send("Bad Request: El JSON no tiene los campos esperados");
        }
        db.find({ country: newData.country, year: newData.year }, (err, docs) => {
            if (err) return res.status(500).send("Internal Server Error");
            if (docs.length > 0) return res.status(409).send("Conflict: El recurso ya existe");
            db.insert(newData, (err, newDoc) => {
                if (err) return res.status(500).send("Internal Server Error");
                res.status(201).send("Created");
            });
        });
    });

    app.put(BASE_API_URL_PSA_V1, (req, res) => res.status(405).send("Method Not Allowed"));

    app.delete(BASE_API_URL_PSA_V1, (req, res) => {
        db.remove({}, { multi: true }, (err, numRemoved) => {
            if (err) return res.status(500).send("Internal Server Error");
            res.status(200).send("Ok: Recursos borrados");
        });
    });

    app.get(`${BASE_API_URL_PSA_V1}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        db.find({ country: countryName, year: year }, { _id: 0 }, (err, docs) => {
            if (err) return res.status(500).send("Internal Server Error");
            if (docs.length > 0) res.status(200).json(docs[0]);
            else res.status(404).send("Not Found");
        });
    });

    app.post(`${BASE_API_URL_PSA_V1}/:country/:year`, (req, res) => res.status(405).send("Method Not Allowed"));

    app.put(`${BASE_API_URL_PSA_V1}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        const updatedData = req.body;
        
        if (!updatedData || Object.keys(updatedData).length !== 5 || updatedData.country === undefined || updatedData.year === undefined || updatedData.co2_emission === undefined || updatedData.precipitation === undefined || updatedData.temperature === undefined) {
            return res.status(400).send("Bad Request: El JSON no tiene los campos esperados");
        }
        if (updatedData.country !== countryName || updatedData.year !== year) return res.status(400).send("Bad Request: El ID de la URL y el del cuerpo deben coincidir");

        db.update({ country: countryName, year: year }, updatedData, {}, (err, numReplaced) => {
            if (err) return res.status(500).send("Internal Server Error");
            if (numReplaced === 0) return res.status(404).send("Not Found");
            res.status(200).send("Ok: Recurso actualizado");
        });
    });

    app.delete(`${BASE_API_URL_PSA_V1}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        db.remove({ country: countryName, year: year }, {}, (err, numRemoved) => {
            if (err) return res.status(500).send("Internal Server Error");
            if (numRemoved === 0) return res.status(404).send("Not Found");
            res.status(200).send("Ok: Recurso borrado");
        });
    });

    // =========================================================================
    // VERSIÓN 2 (Con los mensajes arreglados para los tests)
    // =========================================================================
    app.get(`${BASE_API_URL_PSA_V2}/loadInitialData`, (req, res) => {
        db.find({}, (err, docs) => {
            if (err) return res.status(500).send("Internal Server Error");
            if (docs.length === 0) {
                db.insert(PSAdata_initial, (err, newDocs) => {
                    if (err) return res.status(500).send("Internal Server Error");
                    res.status(201).send("Ok: Recursos de PSA cargados");
                });
            } else {
                res.status(409).send("Conflict: Datos ya cargados");
            }
        });
    });

    app.get(`${BASE_API_URL_PSA_V2}/docs`, (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52345894/2sBXiqF9DB"); // Acuérdate de cambiar esto
    });

    app.get(BASE_API_URL_PSA_V2, (req, res) => {
        let query = {};
        
        if (req.query.country) query.country = req.query.country;
        if (req.query.co2_emission) query.co2_emission = parseFloat(req.query.co2_emission);
        if (req.query.precipitation) query.precipitation = parseFloat(req.query.precipitation);
        if (req.query.temperature) query.temperature = parseFloat(req.query.temperature);

        if (req.query.from || req.query.to) {
            query.year = {};
            if (req.query.from) query.year.$gte = parseInt(req.query.from);
            if (req.query.to) query.year.$lte = parseInt(req.query.to);
        } else if (req.query.year) {
            query.year = parseInt(req.query.year);
        }

        let offset = 0; let limit = 0;
        if (req.query.offset) offset = parseInt(req.query.offset);
        if (req.query.limit) limit = parseInt(req.query.limit);

        db.find(query, { _id: 0 }).skip(offset).limit(limit).exec((err, docs) => {
            if (err) return res.status(500).send("Internal Server Error");
            res.status(200).json(docs);
        });
    });

    app.post(BASE_API_URL_PSA_V2, (req, res) => {
        const newData = req.body;
        if (!newData || Object.keys(newData).length !== 5 || newData.country === undefined || newData.year === undefined || newData.co2_emission === undefined || newData.precipitation === undefined || newData.temperature === undefined) {
            return res.status(400).send("Bad Request: El JSON no tiene los campos esperados");
        }
        db.find({ country: newData.country, year: newData.year }, (err, docs) => {
            if (err) return res.status(500).send("Internal Server Error");
            if (docs.length > 0) return res.status(409).send("Conflict: El recurso ya existe");
            db.insert(newData, (err, newDoc) => {
                if (err) return res.status(500).send("Internal Server Error");
                res.status(201).send("Created");
            });
        });
    });

    app.put(BASE_API_URL_PSA_V2, (req, res) => res.status(405).send("Method Not Allowed"));

    app.delete(BASE_API_URL_PSA_V2, (req, res) => {
        db.remove({}, { multi: true }, (err, numRemoved) => {
            if (err) return res.status(500).send("Internal Server Error");
            res.status(200).send("Ok: Recursos borrados");
        });
    });

    app.get(`${BASE_API_URL_PSA_V2}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        db.find({ country: countryName, year: year }, { _id: 0 }, (err, docs) => {
            if (err) return res.status(500).send("Internal Server Error");
            if (docs.length > 0) res.status(200).json(docs[0]);
            else res.status(404).send("Not Found");
        });
    });

    app.post(`${BASE_API_URL_PSA_V2}/:country/:year`, (req, res) => res.status(405).send("Method Not Allowed"));

    app.put(`${BASE_API_URL_PSA_V2}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        const updatedData = req.body;
        
        if (!updatedData || Object.keys(updatedData).length !== 5 || updatedData.country === undefined || updatedData.year === undefined || updatedData.co2_emission === undefined || updatedData.precipitation === undefined || updatedData.temperature === undefined) {
            return res.status(400).send("Bad Request: El JSON no tiene los campos esperados");
        }
        if (updatedData.country !== countryName || updatedData.year !== year) return res.status(400).send("Bad Request: El ID de la URL y el del cuerpo deben coincidir");

        db.update({ country: countryName, year: year }, updatedData, {}, (err, numReplaced) => {
            if (err) return res.status(500).send("Internal Server Error");
            if (numReplaced === 0) return res.status(404).send("Not Found");
            res.status(200).send("Ok: Recurso actualizado");
        });
    });

    app.delete(`${BASE_API_URL_PSA_V2}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        db.remove({ country: countryName, year: year }, {}, (err, numRemoved) => {
            if (err) return res.status(500).send("Internal Server Error");
            if (numRemoved === 0) return res.status(404).send("Not Found");
            res.status(200).send("Ok: Recurso borrado");
        });
    });
};