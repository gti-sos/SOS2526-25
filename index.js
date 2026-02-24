const express = require("express");
const app = express();

const port = process.env.PORT || 8080; 

// Ruta de prueba inicial
app.get("/", (req, res) => {
    res.send("¡Hola! El servidor del Grupo 25 está funcionando 🚀");
});

// Aquí irán tus rutas (ej: /cool, /api/v1/...)

app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});