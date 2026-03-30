// Archivo: apis/api-PSA.js
import Datastore from 'nedb';

// Inicializamos la base de datos NeDB
const db = new Datastore({ filename: './data/PSA.db', autoload: true });
const BASE_API_URL_PSA = "/api/v1/average-annual-temperatures";


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

    // CARGA INICIAL
    app.get(`${BASE_API_URL_PSA}/loadInitialData`, (req, res) => {
        db.find({}, (err, docs) => {
            if (err) return res.status(500).send("Internal Server Error");
            if (docs.length === 0) {
                db.insert(PSAdata_initial, (err, newDocs) => {
                    if (err) return res.status(500).send("Internal Server Error");
                    res.status(200).send("Ok: Recursos de PSA cargados");
                });
            } else {
                res.status(409).send("Conflict: Datos ya cargados");
            }
        });
    });

    // Postman documentación
    app.get(`${BASE_API_URL_PSA}/docs`, (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52345894/2sBXigKYGM");
    });

    // GET LISTA Y BÚSQUEDAS CON PAGINACIÓN
    // GET LISTA Y BÚSQUEDAS CON PAGINACIÓN ARREGLADA
    app.get(BASE_API_URL_PSA, (req, res) => {
        let query = {};

        // 1. Búsquedas por todos los campos
        if (req.query.country) query.country = req.query.country;
        if (req.query.year) query.year = parseInt(req.query.year);
        if (req.query.co2_emission) query.co2_emission = parseFloat(req.query.co2_emission);
        if (req.query.precipitation) query.precipitation = parseFloat(req.query.precipitation);
        if (req.query.temperature) query.temperature = parseFloat(req.query.temperature);

        // 2. Preparamos la consulta base (Cursor)
        let cursor = db.find(query);

        // 3. Aplicamos paginación SOLO si vienen en la URL
        if (req.query.offset) {
            cursor = cursor.skip(parseInt(req.query.offset));
        }
        if (req.query.limit) {
            cursor = cursor.limit(parseInt(req.query.limit));
        }

        // 4. Ejecutamos la consulta final
        cursor.exec((err, docs) => {
            if (err) return res.status(500).send("Internal Server Error");
            
            // Eliminamos el _id interno de NeDB
            docs.forEach(d => delete d._id);
            res.status(200).json(docs);
        });
    });

    // POST LISTA
    app.post(BASE_API_URL_PSA, (req, res) => {
        const newData = req.body;
        
        // Validación estricta de sus 5 campos
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

    // PUT LISTA
    app.put(BASE_API_URL_PSA, (req, res) => res.status(405).send("Method Not Allowed"));

    // DELETE LISTA
    app.delete(BASE_API_URL_PSA, (req, res) => {
        db.remove({}, { multi: true }, (err, numRemoved) => {
            if (err) return res.status(500).send("Internal Server Error");
            res.status(200).send("Ok: Recursos borrados");
        });
    });

    // GET RECURSO CONCRETO
    app.get(`${BASE_API_URL_PSA}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        
        db.find({ country: countryName, year: year }, (err, docs) => {
            if (err) return res.status(500).send("Internal Server Error");
            if (docs.length > 0) {
                delete docs[0]._id; // Limpiar id interno
                res.status(200).json(docs[0]);
            } else {
                res.status(404).send("Not Found");
            }
        });
    });

    // POST RECURSO CONCRETO
    app.post(`${BASE_API_URL_PSA}/:country/:year`, (req, res) => res.status(405).send("Method Not Allowed"));

    // PUT RECURSO CONCRETO
    app.put(`${BASE_API_URL_PSA}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        const updatedData = req.body;
        
        if (!updatedData || Object.keys(updatedData).length !== 5 || updatedData.country === undefined || updatedData.year === undefined || updatedData.co2_emission === undefined || updatedData.precipitation === undefined || updatedData.temperature === undefined) {
            return res.status(400).send("Bad Request: El JSON no tiene los campos esperados");
        }
        
        if (updatedData.country !== countryName || updatedData.year !== year) {
            return res.status(400).send("Bad Request: El ID de la URL y el del cuerpo deben coincidir");
        }

        db.update({ country: countryName, year: year }, updatedData, {}, (err, numReplaced) => {
            if (err) return res.status(500).send("Internal Server Error");
            if (numReplaced === 0) return res.status(404).send("Not Found");
            res.status(200).send("Ok: Recurso actualizado");
        });
    });

    // DELETE RECURSO CONCRETO
    app.delete(`${BASE_API_URL_PSA}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        
        db.remove({ country: countryName, year: year }, {}, (err, numRemoved) => {
            if (err) return res.status(500).send("Internal Server Error");
            if (numRemoved === 0) return res.status(404).send("Not Found");
            res.status(200).send("Ok: Recurso borrado");
        });
    });

};