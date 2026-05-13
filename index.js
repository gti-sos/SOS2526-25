import { handler } from './front/build/handler.js';
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// 1. Importar las APIs modularizadas de los tres
import { loadJLRA } from "./apis/api-JLRA.js";
import { loadPSA } from "./apis/api-PSA.js";
import { loadAGB } from "./apis/api-AGB.js";

const app = express();

// =========================================================
// CABECERAS CORS (¡REQUISITO OBLIGATORIO PARA LA DEFENSA!)
// =========================================================
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, HEAD, POST, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = process.env.PORT || 8082; 

// 2. Configurar la ruta estática para la página web
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/', express.static(path.join(__dirname, 'public')));

// 3. Cargar las tres APIs pasándoles la app
loadJLRA(app);
loadPSA(app);   
loadAGB(app);

// =========================================================
// PROXIES PARA INTEGRACIONES 
// =========================================================

// --- PROXY G10 (PROTESTAS) ---
app.get('/api/proxy/g10/protestas', async (req, res) => {
    try {
        let response = await fetch('https://sos2526-10.onrender.com/api/v2/protests');
        let data;
        if (response.ok) data = await response.json();

        if (!response.ok || (Array.isArray(data) && data.length === 0)) {
            await fetch("https://sos2526-10.onrender.com/api/v2/protests/loadInitialData");
            let secondResponse = await fetch('https://sos2526-10.onrender.com/api/v2/protests');
            data = secondResponse.ok ? await secondResponse.json() : [];
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Fallo al contactar con la API remota.' });
    }
});

// --- PROXY OMS (ALCOHOL) ---
app.get('/api/proxy/oms-alcohol', async (req, res) => {
    try {
        const resData = await fetch("https://ghoapi.azureedge.net/api/SA_0000001688?$filter=TimeDim eq 2019");
        const dataOMS = await resData.json();
        const resCountries = await fetch("https://ghoapi.azureedge.net/api/DIMENSION/COUNTRY/DimensionValues");
        const countriesOMS = await resCountries.json();
        res.json({ data: dataOMS, countries: countriesOMS });
    } catch (error) {
        res.status(500).json({ error: "Fallo al contactar con la API externa de la OMS" });
    }
});

// --- PROXY ONU (ACCIDENTES) ---
app.get('/api/proxy/un-accidents', async (req, res) => {
    try {
        const resData = await fetch("https://unstats.un.org/sdgapi/v1/sdg/Indicator/Data?indicator=3.6.1&pageSize=5000");
        const dataUN = await resData.json();
        res.json(dataUN);
    } catch (error) {
        res.status(500).json({ error: "Fallo al contactar con la API de la ONU" });
    }
});

// --- PROXY FMI (RIQUEZA) ---
app.get('/api/proxy/imf-wealth', async (req, res) => {
    try {
        const opciones = { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } };
        const resData = await fetch("https://www.imf.org/external/datamapper/api/v1/NGDPDPC", opciones);
        const dataIMF = await resData.json();
        const resCountries = await fetch("https://www.imf.org/external/datamapper/api/v1/countries", opciones);
        const countriesIMF = await resCountries.json();
        res.json({ data: dataIMF, countries: countriesIMF });
    } catch (error) {
        res.status(500).json({ error: "Fallo al contactar con el FMI" });
    }
});

// --- PROXY G14 (METEORITOS) ---
app.get('/api/proxy/g14/meteorites', async (req, res) => {
    try {
        let response = await fetch('https://meteorite-landings-tvcf.onrender.com/api/v2/meteorite-landings');
        let data = await response.json();
        if(Array.isArray(data) && data.length === 0){
            await fetch("https://meteorite-landings-tvcf.onrender.com/api/v2/meteorite-landings/loadInitialData");
            response = await fetch('https://meteorite-landings-tvcf.onrender.com/api/v2/meteorite-landings');
            data = await response.json();
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Fallo al contactar con el G14.' });
    }
});

// --- PROXY MARIO (G17 WATER) ---
app.get('/api/proxy/mario/water-productivities', async (req, res) => {
    try {
        const response = await fetch('https://sos2526-17.onrender.com/api/v1/water-productivities');
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Fallo en proxy Mario G17" });
    }
});

// --- PROXY PABLO (G21 AIDS) ---
app.get('/api/proxy/pablo/aids', async (req, res) => {
    const remoteUrl = 'https://sos2526-21.onrender.com/api/v1/aids-deaths-stats?country=Afghanistan&year=2015';
    try {
        const response = await fetch(remoteUrl);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Fallo en proxy AIDS G21" });
    }
});

// --- PROXY AIMAR (G29 CITYS) ---
app.get('/api/proxy/aimar/citys', async (req, res) => {
    try {
        let response = await fetch('https://sos2526-29.onrender.com/api/v2/citys-stats');
        let data = response.ok ? await response.json() : [];

        if (!response.ok || (Array.isArray(data) && data.length === 0)) {
            await fetch('https://sos2526-29.onrender.com/api/v2/citys-stats/loadInitialData');
            let secondResponse = await fetch('https://sos2526-29.onrender.com/api/v2/citys-stats');
            data = secondResponse.ok ? await secondResponse.json() : [];
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Fallo en el proxy de Aimar (G29)" });
    }
});

// --- OTROS PROXIES (BITCOIN, AMADEUS, OPENAQ, RELIEFWEB) ---
app.get('/api/proxy/pablo/bitcoin', async (req, res) => {
    try {
        const response = await fetch('https://api.blockchain.info/charts/market-price?timespan=6years&format=json');
        const data = await response.json();
        res.json(data);
    } catch (error) { res.status(500).send(error); }
});

app.get('/api/proxy/pablo/airquality', async (req, res) => {
    try {
        const response = await fetch(`https://api.openaq.org/v2/latest?country=${req.query.countryCode || 'ES'}&limit=1`);
        const data = await response.json();
        res.json(data);
    } catch (error) { res.status(500).send(error); }
});

// 3.2 Uso de svelte
app.use(handler);

// 4. Arrancar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});