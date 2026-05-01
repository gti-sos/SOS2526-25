// Archivo: apis/api-PSA.js
import Datastore from 'nedb';

// Inicializamos la base de datos NeDB
const db = new Datastore({ filename: './data/PSA.db', autoload: true });
const BASE_API_URL_PSA_V1 = "/api/v1/average-annual-temperatures";
const BASE_API_URL_PSA_V2 = "/api/v2/average-annual-temperatures";

let PSAdata_initial = [
    // --- TUS DATOS ORIGINALES ---
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
    { country: "Germany", year: 2024, co2_emission: 590, precipitation: 750.00, temperature: 10.70 },

    // --- DATOS NUEVOS PARA CRUZAR CON EL SIDA (GRUPO 21) ---
    { country: "Afghanistan", year: 2015, co2_emission: 8.5, precipitation: 327.5, temperature: 13.5 },
    { country: "South Africa", year: 2015, co2_emission: 450.2, precipitation: 495.1, temperature: 17.5 },
    { country: "Nigeria", year: 2015, co2_emission: 120.4, precipitation: 1150.2, temperature: 26.8 },

    // --- DATOS NUEVOS PARA CRUZAR CON OLIMPIADAS (GRUPO 30) ---
    { country: "China", year: 1992, co2_emission: 2500.5, precipitation: 600.5, temperature: 6.5 },
    { country: "USA", year: 1992, co2_emission: 5100.5, precipitation: 700.5, temperature: 11.5 },
    { country: "Spain", year: 1992, co2_emission: 230.1, precipitation: 600.4, temperature: 14.5 },
    { country: "France", year: 1992, co2_emission: 380.2, precipitation: 820.1, temperature: 11.5 },

    // --- DATOS NUEVOS PARA CRUZAR CON FERTILIDAD (GRUPO 12) ---
    { country: "Slovenia", year: 2022, co2_emission: 12.5, precipitation: 1400.2, temperature: 10.5 },
    { country: "Spain", year: 2022, co2_emission: 245.1, precipitation: 500.4, temperature: 15.5 },
    { country: "France", year: 2022, co2_emission: 300.2, precipitation: 800.1, temperature: 12.5 },
    { country: "USA", year: 2022, co2_emission: 5000.5, precipitation: 720.3, temperature: 12.1 },
    { country: "Italy", year: 2022, co2_emission: 330.4, precipitation: 750.8, temperature: 14.0 },
    { country: "Japan", year: 2022, co2_emission: 1100.5, precipitation: 1600.2, temperature: 12.5 },
    { country: "Latvia", year: 2022, co2_emission: 7.2, precipitation: 650.5, temperature: 6.8 },
    { country: "Mongolia", year: 2022, co2_emission: 25.1, precipitation: 200.5, temperature: -0.5 },
    { country: "Liberia", year: 2022, co2_emission: 1.2, precipitation: 2500.5, temperature: 26.5 },
    { country: "Ukraine", year: 2022, co2_emission: 180.5, precipitation: 550.4, temperature: 8.5 },
    { country: "Chad", year: 2022, co2_emission: 1.5, precipitation: 300.2, temperature: 28.5 },
    { country: "Germany", year: 2016, co2_emission: 775, precipitation: 660, temperature: 10.35 },
    
    // España (2015-2024) -> Para cruzar con ESG Scores (G28), Exportaciones (G13) y SpaceX
    { country: "Spain", year: 2015, co2_emission: 254, precipitation: 636, temperature: 13.3 },
    { country: "Spain", year: 2016, co2_emission: 256, precipitation: 650, temperature: 13.4 },
    { country: "Spain", year: 2017, co2_emission: 260, precipitation: 474, temperature: 13.6 },
    { country: "Spain", year: 2018, co2_emission: 255, precipitation: 670, temperature: 13.5 },
    { country: "Spain", year: 2019, co2_emission: 240, precipitation: 600, temperature: 13.7 },
    { country: "Spain", year: 2020, co2_emission: 210, precipitation: 610, temperature: 13.8 },
    { country: "Spain", year: 2021, co2_emission: 230, precipitation: 590, temperature: 13.6 },
    { country: "Spain", year: 2022, co2_emission: 245, precipitation: 500, temperature: 14.0 },
    { country: "Spain", year: 2023, co2_emission: 240, precipitation: 520, temperature: 14.2 },
    { country: "Spain", year: 2024, co2_emission: 235, precipitation: 510, temperature: 14.4 },

    // USA (2018-2022) -> Para cruzar con ESG Scores (G28) y Exportaciones (G13)
    { country: "USA", year: 2018, co2_emission: 5000, precipitation: 700, temperature: 11.5 },
    { country: "USA", year: 2019, co2_emission: 4900, precipitation: 710, temperature: 11.6 },
    { country: "USA", year: 2020, co2_emission: 4500, precipitation: 720, temperature: 11.7 },
    { country: "USA", year: 2021, co2_emission: 4800, precipitation: 705, temperature: 11.6 },
    { country: "USA", year: 2022, co2_emission: 4950, precipitation: 690, temperature: 11.8 },

    // Datos específicos para cruzar con APIs de compañeros:
    { country: "Afghanistan", year: 2015, co2_emission: 8.5, precipitation: 327, temperature: 13.5 }, // SIDA (G21)
    { country: "Slovenia", year: 2022, co2_emission: 13.5, precipitation: 1400, temperature: 10.5 }, // Fertilidad (G12)
    { country: "China", year: 1992, co2_emission: 2500, precipitation: 600, temperature: 6.5 } ,// Olimpiadas (G30)

    // --- DATOS EXACTOS PARA CRUZAR CON EL GRUPO 3 (Armas/TIV) ---
    { country: "Egypt", year: 1982, co2_emission: 50.2, precipitation: 20.5, temperature: 22.1 },
    { country: "Angola", year: 1975, co2_emission: 10.1, precipitation: 1010.0, temperature: 21.5 },
    { country: "Equatorial Guinea", year: 2008, co2_emission: 5.2, precipitation: 2000.0, temperature: 25.3 },
    { country: "Ethiopia", year: 2019, co2_emission: 15.3, precipitation: 800.0, temperature: 20.2 },
    { country: "Spain", year: 1975, co2_emission: 150.0, precipitation: 600.0, temperature: 13.0 },
    { country: "Algeria", year: 2003, co2_emission: 90.5, precipitation: 100.0, temperature: 22.8 },
    { country: "El Salvador", year: 1969, co2_emission: 2.1, precipitation: 1800.0, temperature: 24.1 },
    { country: "Greece", year: 2020, co2_emission: 60.2, precipitation: 650.0, temperature: 17.5 },
    { country: "Afghanistan", year: 2002, co2_emission: 1.5, precipitation: 300.0, temperature: 12.8 },
    { country: "Estonia", year: 2007, co2_emission: 18.2, precipitation: 700.0, temperature: 5.5 },
    
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
        res.redirect("https://documenter.getpostman.com/view/52345894/2sBXiqF9DB");
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