const express = require("express");
const app = express();
const cool = require("cool-ascii-faces");
const path = require("path");

const port = process.env.PORT || 8082; 
const jlraCalc = require("./index-JLRA.js");

app.get("/samples/JLRA", (req,res) => res.send(jlraCalc.average_data(jlraCalc.dataJLRA)))

app.get("/", (req, res) => {
    res.send("¡Hola! El servidor del Grupo 25 está funcionando ");
});
app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "about.html"));
});
app.get("/cool", (req, res) => {
    res.send("<html><body><h1>" + cool() + "</h1></body></html>");
});

app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});
