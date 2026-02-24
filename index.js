const express = require("express");
const app = express();
const cool = require("cool-ascii-faces");

const port = process.env.PORT || 8080; 

// Ruta de prueba inicial
app.get("/", (req, res) => {
    res.send("¡Hola! El servidor del Grupo 25 está funcionando 🚀");
});
app.use("/about", express.static("public"))
app.get("/cool", (req, res) => {
    res.send("<html><body><h1>" + cool() + "</h1></body></html>");
});

app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});