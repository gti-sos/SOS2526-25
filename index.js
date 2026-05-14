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
// CABECERAS CORS (¡REQUISITO OBLIGATORIO PARA LA DEFENSA!) u
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
        // Configuramos cabeceras que simulan un navegador real de forma completa
        const opciones = { 
            headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", 
                "Accept": "application/json",
                "Referer": "https://www.imf.org/"
            } 
        };

        // Petición de los valores (PIB)
        const resData = await fetch("https://www.imf.org/external/datamapper/api/v1/NGDPDPC", opciones);
        if (!resData.ok) throw new Error(`FMI Datos falló con status: ${resData.status}`);
        const dataIMF = await resData.json();

        // Petición de los nombres de países (Cambiamos a la ruta absoluta más fiable)
        const resCountries = await fetch("https://www.imf.org/external/datamapper/api/v1/countries", opciones);
        if (!resCountries.ok) throw new Error(`FMI Países falló con status: ${resCountries.status}`);
        const countriesIMF = await resCountries.json();

        // Si todo ha ido bien, devolvemos el JSON
        res.json({ data: dataIMF, countries: countriesIMF });
        
    } catch (error) {
        console.error("❌ Error detallado en Proxy FMI:", error.message);
        res.status(500).json({ 
            error: "Fallo al contactar con el FMI", 
            message: error.message 
        });
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


app.get('/api/proxy/g17/water-productivities', async (req, res) => {
    try {
        let response = await fetch('https://sos2526-17.onrender.com/api/v1/water-productivities');
        let data;

        if (response.ok) {
            data = await response.json();
        }

        // Si falla o viene vacío, intentamos despertar su API con loadInitialData
        if (!response.ok || (Array.isArray(data) && data.length === 0)) {
            console.log("G17 (Agua): Detectado error o datos vacíos. Cargando datos iniciales...");
            
            await fetch("https://sos2526-17.onrender.com/api/v1/water-productivities/loadInitialData");
            
            let secondResponse = await fetch('https://sos2526-17.onrender.com/api/v1/water-productivities');
            
            if (secondResponse.ok) {
                data = await secondResponse.json();
            } else {
                data = [];
            }
        }
        
        res.json(data);

    } catch (error) {
        console.error("Error en el proxy G17:", error);
        res.status(500).json({ error: 'Fallo al contactar con la API remota de Productividad del Agua.' });
    }
});

// PROXY para Pablo -> API de Calidad del Aire (OpenAQ) - VERSIÓN ROBUSTA
app.get('/api/proxy/pablo/airquality', async (req, res) => {
    const countryCode = req.query.countryCode || 'ES';
    // Cambiamos a /v2/latest que es mucho más fiable
    const url = `https://api.openaq.org/v2/latest?country=${countryCode}&limit=1`;
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

// --- OTROS PROXIES (BITCOIN, AIRQUALITY) ---
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
    } catch (error) {
        console.error("Error en el proxy AirQuality:", error);
        res.status(500).json({ error: 'Fallo al contactar con la API externa.' });
    }
});

// --- PROXY GITHUB OAUTH ---
app.get('/api/proxy/pablo/github-token', async (req, res) => {
    const { code } = req.query;
    try {
        const r = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Accept': 'application/json' 
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code: code
            })
        });
        const data = await r.json();
        res.json(data); 
    } catch (e) {
        console.error("Error en OAuth:", e);
        res.status(500).json({ error: 'OAuth token exchange failed' });
    }
});

// ============================================================================
// PROXY PARA INTEGRACIÓN EXTERNA: API PÚBLICA NASA POWER (Radiación Solar)
// ============================================================================
app.get('/api/proxy/pablo/nasa-power', async (req, res) => {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    
    if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: "Los parámetros 'lat' y 'lon' son obligatorios." });
    }

    try {
        const url = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN&community=re&longitude=${lon}&latitude=${lat}&format=json`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error HTTP de la NASA: ${response.status}`);
        
        const data = await response.json();

        // LOS MESES EN LA NASA ESTÁN EN INGLÉS (JAN, FEB, MAR...)
        const monthly = data.properties.parameter.ALLSKY_SFC_SW_DWN;
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        
        let annualSum = 0;
        months.forEach((month, i) => {
            const dailyAvg = monthly[month] || 0;     // El dato viene en kWh/m²/día
            annualSum += dailyAvg * daysInMonth[i];   // Multiplicamos por los días del mes
        });

        res.json({ 
            lat: lat, 
            lon: lon, 
            solar_radiation: Math.round(annualSum)
        });

    } catch (error) {
        console.error("Error en proxy NASA POWER:", error.message);
        res.status(500).json({ error: "No se pudo conectar con la API de NASA POWER." });
    }
});

// 3.2 Uso de svelte
app.use(handler);

// 4. Arrancar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});
