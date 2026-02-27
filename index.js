const express = require("express");
const app = express();
const cool = require("cool-ascii-faces");
const path = require("path");
let JLRAdata = []
const port = process.env.PORT || 8082; 
const jlraCalc = require("./index-JLRA.js");

app.get("/api/v1/social-drinking-behaviors/loadInitialData", (req,res) => {
    if (JLRAdata.length === 0){
        JLRAdata = jlraCalc.dataJLRA
        res.status(200).send("Recursos cargados en la memoria web")
    }else{
        res.status(409).send("Los recursos pedidos ya se encuentran en la memoria web")
    } 
})
app.get("/api/v1/social-drinking-behaviors", (req, res) => res.json(JLRAdata));

app.get("/samples/JLRA", (req,res) => {
    if (JLRAdata.length === 0) res.status(409).send("Necesitas cargar los datos en memoria para poder hacer la media");
    else{
        let philippines = JLRAdata.filter( (n) => n.country === "Philippines");
        let beer = philippines.map( (n) => n.beer_share);
        let numerator = beer.reduce( (n, b) => n +=b);
        let average = numerator/beer.length;
        res.status(200).send(`${average}`); 
    }
})

app.get("/", (req, res) => {
    res.send("¡Hola! El servidor del Grupo 25 está funcionando, viento en popa");
});
app.get("/about", (req, res) => {
    res.status(200).sendFile(path.join(__dirname, "public", "about.html"));
});
app.get("/cool", (req, res) => {
    res.status(200).send("<html><body><h1>" + cool() + "</h1></body></html>");
});

app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});
