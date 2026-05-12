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
// PROXIES PARA INTEGRACIONES 
// =========================================================
app.get('/api/proxy/g10/protestas', async (req, res) => {
    try {
        let response = await fetch('https://sos2526-10.onrender.com/api/v2/protests');
        let data;

        if (response.ok) {
            data = await response.json();
        }

        if (!response.ok || (Array.isArray(data) && data.length === 0)) {
            console.log("Detectado error o datos vacíos. Cargando datos iniciales...");
            
            await fetch("https://sos2526-10.onrender.com/api/v2/protests/loadInitialData");
            
            let secondResponse = await fetch('https://sos2526-10.onrender.com/api/v2/protests');
            
            if (secondResponse.ok) {
                data = await secondResponse.json();
            } else {
                data = [];
            }
        }
        
        res.json(data);

    } catch (error) {
        console.error("Error en el proxy G10:", error);
        res.status(500).json({ error: 'Fallo al contactar con la API remota.' });
    }
});

app.get('/api/proxy/g14/meteorites', async (req, res) => {
    try {
        let response = await fetch('https://meteorite-landings-tvcf.onrender.com/api/v2/meteorite-landings');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        let data = await response.json();
        if(Array.isArray(data) && data.length === 0){
            console.log("Datos vacios, cargando los datos iniciales...")
            await fetch("https://meteorite-landings-tvcf.onrender.com/api/v2/meteorite-landings/loadInitialData")
            response = await fetch('https://meteorite-landings-tvcf.onrender.com/api/v2/meteorite-landings');
            data = await response.json();
        }
        res.json(data);
    } catch (error) {
        console.error("Error en el proxy G14:", error);
        res.status(500).json({ error: 'Fallo al contactar con la API remota del G14 a través del proxy.' });
    }
});


// PROXY para Pablo -> API AIDS (Grupo 21)
app.get('/api/proxy/pablo/aids', async (req, res) => {
    // AÑADIMOS LOS PARÁMETROS AQUÍ para evitar el límite de 10 registros
    const remoteUrl = 'https://sos2526-21.onrender.com/api/v1/aids-deaths-stats?country=Afghanistan&year=2015';
    try {
        const response = await fetch(remoteUrl);
        if (!response.ok) throw new Error("Error en API remota");
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "No se pudo conectar con la API de AIDS a través del proxy" });
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

// 3.2 Uso de svelte
app.use(handler);

// 4. Arrancar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});