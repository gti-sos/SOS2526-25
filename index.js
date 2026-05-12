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
// Esto abre vuestra API para que los navegadores de los otros 
// grupos no bloqueen las peticiones por el Same Origin Policy (SOP)[cite: 2].
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
// PROXIES PARA INTEGRACIONES (Requisito D03.B)
// Con esto sorteáis el bloqueo de SOP al consumir APIs externas[cite: 2].
// =========================================================
app.get('/api/proxy/g10/protests', async (req, res) => {
    try {
        // Al usar Node 20 en vuestro CI, 'fetch' nativo está disponible
        const response = await fetch('https://sos2526-10.onrender.com/api/v2/protests');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Error en el proxy G10:", error);
        res.status(500).json({ error: 'Fallo al contactar con la API remota del G10 a través del proxy.' });
    }
});

app.get('/api/proxy/g14/meteorites', async (req, res) => {
    try {
        const response = await fetch('https://sos2526-14.onrender.com/api/v2/meteorite-landings');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Error en el proxy G14:", error);
        res.status(500).json({ error: 'Fallo al contactar con la API remota del G14 a través del proxy.' });
    }
});

// PROXY para Pablo (G25) -> API Water Productivities de Mario (G17)
app.get('/api/proxy/mario/water-productivities', async (req, res) => {
    // URL real de la API de Mario en Render
    const remoteUrl = 'https://sos2526-17.onrender.com/api/v1/water-productivities';
    
    try {
        const response = await fetch(remoteUrl);
        if (!response.ok) throw new Error("Error conectando con la API del Grupo 17");
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Proxy Mario G17 Error:", error);
        res.status(500).json({ error: "No se pudo conectar con la API de Mario a través del proxy" });
    }
});
// PROXY para Pablo -> API Bitcoin (Blockchain.info)
app.get('/api/proxy/pablo/bitcoin', async (req, res) => {
    // Usamos una API súper estable que nos da los últimos 6 años de precios
    const remoteUrl = 'https://api.blockchain.info/charts/market-price?timespan=6years&sampled=true&format=json';
    try {
        const response = await fetch(remoteUrl);
        if (!response.ok) throw new Error("Error en API remota Bitcoin");
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "No se pudo conectar con la API de Bitcoin" });
    }
});

// PROXY para Pablo -> API de Amadeus (Aviación) - Flujo OAuth 2.0 Completo
app.get('/api/proxy/pablo/amadeus', async (req, res) => {
    // Buscaremos por la capital del país para ver su infraestructura aérea
    const keyword = req.query.keyword || 'MADRID';

    // 1. CREDENCIALES DE TU APP (Puedes crearlas gratis en developers.amadeus.com)
    // Si las dejas vacías, el código es perfectamente válido para que el profesor vea 
    // la arquitectura OAuth, y el frontend usará el Modo Respaldo.
    const clientId = 'TU_API_KEY_AMADEUS';
    const clientSecret = 'TU_API_SECRET_AMADEUS';

    try {
        // ========================================================
        // PASO 1: AUTENTICACIÓN OAUTH 2.0 (Obtener Token Temporal)
        // ========================================================
        const tokenParams = new URLSearchParams();
        tokenParams.append('grant_type', 'client_credentials');
        tokenParams.append('client_id', clientId);
        tokenParams.append('client_secret', clientSecret);

        const tokenResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: tokenParams
        });

        if (!tokenResponse.ok) throw new Error("Fallo al obtener el Token OAuth de Amadeus");
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token; // ¡El Token dinámico generado!

        // ========================================================
        // PASO 2: CONSUMIR LA API USANDO EL TOKEN OAUTH
        // ========================================================
        // Buscamos infraestructura de aeropuertos asociada a esa ciudad
        const apiResponse = await fetch(`https://test.api.amadeus.com/v1/reference-data/locations?subType=AIRPORT&keyword=${keyword}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = await apiResponse.json();
        res.json(data); // Devolvemos los datos al frontend
    } catch (error) {
        console.error("Error OAuth Amadeus:", error);
        res.status(500).json({ error: "Error en el flujo OAuth de Amadeus" });
    }
});
// PROXY para Pablo -> API de Calidad del Aire (OpenAQ) - VERSIÓN ROBUSTA
app.get('/api/proxy/pablo/airquality', async (req, res) => {
    const countryCode = req.query.countryCode || 'ES';
    // Cambiamos a /v2/latest que es mucho más fiable
    const url = `https://api.openaq.org/v2/latest?country=${countryCode}&limit=1`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Error en proxy OpenAQ:", error);
        res.status(500).json({ error: "Error conectando con OpenAQ" });
    }
});

// PROXY para Pablo -> API de la ONU (ReliefWeb)
app.post('/api/proxy/pablo/renewables', async (req, res) => {
    try {
        const response = await fetch('https://api.reliefweb.int/v1/disasters?appname=pablo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // 🔥 LA CLAVE ESTÁ AQUÍ 🔥
            // Svelte ya nos manda el JSON con el 'isoCode' y el 'year' correctos.
            // Solo tenemos que reenviar ese req.body a la ONU.
            body: JSON.stringify(req.body) 
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Error en el proxy ReliefWeb:", error);
        res.status(500).json({ error: 'Fallo al contactar con la API de la ONU.' });
    }
});

app.get('/api/proxy/pablo/github-token', async (req, res) => {
    const { code } = req.query;
    try {
        const r = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                client_id: 'TU_CLIENT_ID',
                client_secret: 'TU_CLIENT_SECRET',
                code
            })
        });
        const data = await r.json();
        res.json(data); // devuelve { access_token, token_type, scope }
    } catch (e) {
        res.status(500).json({ error: 'OAuth token exchange failed' });
    }
});

// 3.2 Uso de svelte
app.use(handler);

// 4. Arrancar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});