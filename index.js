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

// 3.2 Uso de svelte
app.use(handler);

// 4. Arrancar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});