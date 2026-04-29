// Archivo: apis/api-JLRA.js
import Datastore from "nedb";
import csv from 'csvtojson';

// 1. Configuramos la Base de Datos
const db = new Datastore({ filename: './data/jlra.db', autoload: true });

// Definimos las dos rutas base
const BASE_API_URL_V1 = "/api/v1/social-drinking-behaviors";
const BASE_API_URL_V2 = "/api/v2/social-drinking-behaviors";

const dataJLRA = [
    { country: "Germany", year: 2018, total_liter: 10.3, beer_share: 4.9, wine_share: 3.1, spirit_share: 2.3 },
    { country: "Germany", year: 2019, total_liter: 10.3, beer_share: 4.9, wine_share: 3.1, spirit_share: 2.3 },
    { country: "Germany", year: 2020, total_liter: 10.5, beer_share: 5.0, wine_share: 3.1, spirit_share: 2.4 },
    { country: "Germany", year: 2015, total_liter: 11.2, beer_share: 5.8, wine_share: 3.1, spirit_share: 2.3 },
    { country: "Germany", year: 2017, total_liter: 10.9, beer_share: 5.5, wine_share: 3.1, spirit_share: 2.3 },
    { country: "Germany", year: 2021, total_liter: 10.8, beer_share: 5.2, wine_share: 3.2, spirit_share: 2.4 },
    { country: "Germany", year: 2022, total_liter: 10.7, beer_share: 5.1, wine_share: 3.2, spirit_share: 2.4 },
    { country: "Albania", year: 2018, total_liter: 4.7, beer_share: 1.8, wine_share: 1.6, spirit_share: 1.3 },
    { country: "Albania", year: 2019, total_liter: 4.7, beer_share: 1.8, wine_share: 1.6, spirit_share: 1.3 },
    { country: "Albania", year: 2020, total_liter: 4.8, beer_share: 1.8, wine_share: 1.6, spirit_share: 1.4 },
    { country: "Albania", year: 2021, total_liter: 4.7, beer_share: 1.8, wine_share: 1.6, spirit_share: 1.3 },
    { country: "Albania", year: 2022, total_liter: 4.6, beer_share: 1.7, wine_share: 1.5, spirit_share: 1.4 },
    { country: "Argentina", year: 2018, total_liter: 7.8, beer_share: 3.1, wine_share: 3.5, spirit_share: 1.2 },
    { country: "Argentina", year: 2019, total_liter: 8.0, beer_share: 3.2, wine_share: 3.6, spirit_share: 1.2 },
    { country: "Argentina", year: 2020, total_liter: 8.1, beer_share: 3.2, wine_share: 3.6, spirit_share: 1.3 },
    { country: "Argentina", year: 2021, total_liter: 8.0, beer_share: 3.2, wine_share: 3.6, spirit_share: 1.2 },
    { country: "Argentina", year: 2022, total_liter: 8.0, beer_share: 3.2, wine_share: 3.6, spirit_share: 1.2 },
    { country: "Bulgaria", year: 2018, total_liter: 11.3, beer_share: 4.6, wine_share: 2.0, spirit_share: 4.7 },
    { country: "Bulgaria", year: 2019, total_liter: 11.0, beer_share: 4.5, wine_share: 2.0, spirit_share: 4.5 },
    { country: "Bulgaria", year: 2020, total_liter: 11.3, beer_share: 4.6, wine_share: 2.0, spirit_share: 4.7 },
    { country: "Bulgaria", year: 2021, total_liter: 11.5, beer_share: 4.7, wine_share: 2.1, spirit_share: 4.7 },
    { country: "Bulgaria", year: 2022, total_liter: 11.5, beer_share: 4.7, wine_share: 2.1, spirit_share: 4.7 },
    { country: "Georgia", year: 2018, total_liter: 8.6, beer_share: 1.9, wine_share: 4.4, spirit_share: 2.3 },
    { country: "Georgia", year: 2019, total_liter: 8.3, beer_share: 1.8, wine_share: 4.2, spirit_share: 2.3 },
    { country: "Georgia", year: 2020, total_liter: 8.8, beer_share: 1.9, wine_share: 4.5, spirit_share: 2.4 },
    { country: "Georgia", year: 2021, total_liter: 8.2, beer_share: 1.8, wine_share: 4.2, spirit_share: 2.2 },
    { country: "Georgia", year: 2022, total_liter: 8.6, beer_share: 1.9, wine_share: 4.4, spirit_share: 2.3 },
    { country: "Italy", year: 2018, total_liter: 7.4, beer_share: 1.9, wine_share: 4.9, spirit_share: 0.6 },
    { country: "Italy", year: 2019, total_liter: 7.9, beer_share: 2.0, wine_share: 5.2, spirit_share: 0.7 },
    { country: "Italy", year: 2020, total_liter: 7.3, beer_share: 1.8, wine_share: 4.8, spirit_share: 0.7 },
    { country: "Italy", year: 2021, total_liter: 7.3, beer_share: 1.8, wine_share: 4.8, spirit_share: 0.7 },
    { country: "Italy", year: 2022, total_liter: 7.9, beer_share: 2.0, wine_share: 5.2, spirit_share: 0.7 },
    { country: "Namibia", year: 2018, total_liter: 10.9, beer_share: 6.6, wine_share: 3.1, spirit_share: 1.2 },
    { country: "Namibia", year: 2019, total_liter: 11.4, beer_share: 7.0, wine_share: 3.2, spirit_share: 1.2 },
    { country: "Namibia", year: 2020, total_liter: 11.0, beer_share: 6.7, wine_share: 3.1, spirit_share: 1.2 },
    { country: "Namibia", year: 2021, total_liter: 11.1, beer_share: 6.8, wine_share: 3.1, spirit_share: 1.2 },
    { country: "Namibia", year: 2022, total_liter: 11.3, beer_share: 6.9, wine_share: 3.2, spirit_share: 1.2 },
    { country: "Syrian Arab Republic", year: 2018, total_liter: 0.2, beer_share: 0.0, wine_share: 0.0, spirit_share: 0.2 },
    { country: "Syrian Arab Republic", year: 2019, total_liter: 0.2, beer_share: 0.0, wine_share: 0.0, spirit_share: 0.2 },
    { country: "Syrian Arab Republic", year: 2020, total_liter: 0.2, beer_share: 0.0, wine_share: 0.0, spirit_share: 0.2 },
    { country: "Syrian Arab Republic", year: 2021, total_liter: 0.2, beer_share: 0.0, wine_share: 0.0, spirit_share: 0.2 },
    { country: "Syrian Arab Republic", year: 2022, total_liter: 0.2, beer_share: 0.0, wine_share: 0.0, spirit_share: 0.2 },
    { country: "Philippines", year: 2018, total_liter: 5.3, beer_share: 1.5, wine_share: 0.1, spirit_share: 3.7 },
    { country: "Philippines", year: 2019, total_liter: 5.0, beer_share: 1.4, wine_share: 0.1, spirit_share: 3.5 },
    { country: "Philippines", year: 2020, total_liter: 5.1, beer_share: 1.4, wine_share: 0.1, spirit_share: 3.6 },
    { country: "Philippines", year: 2021, total_liter: 5.0, beer_share: 1.4, wine_share: 0.1, spirit_share: 3.5 },
    { country: "Philippines", year: 2022, total_liter: 5.3, beer_share: 1.5, wine_share: 0.1, spirit_share: 3.7 },
    { country: "Spain", year: 2018, total_liter: 10.8, beer_share: 5.4, wine_share: 2.2, spirit_share: 3.2 },
    { country: "Spain", year: 2019, total_liter: 10.2, beer_share: 5.1, wine_share: 2.0, spirit_share: 3.1 },
    { country: "Spain", year: 2020, total_liter: 10.4, beer_share: 5.2, wine_share: 2.1, spirit_share: 3.1 },
    { country: "Spain", year: 2021, total_liter: 10.7, beer_share: 5.3, wine_share: 2.1, spirit_share: 3.3 },
    { country: "Spain", year: 2022, total_liter: 10.2, beer_share: 5.1, wine_share: 2.0, spirit_share: 3.1 },
    { country: "France", year: 2018, total_liter: 11.8, beer_share: 2.4, wine_share: 6.8, spirit_share: 2.6 },
    { country: "France", year: 2019, total_liter: 11.6, beer_share: 2.3, wine_share: 6.7, spirit_share: 2.6 },
    { country: "France", year: 2020, total_liter: 11.5, beer_share: 2.3, wine_share: 6.7, spirit_share: 2.5 },
    { country: "France", year: 2021, total_liter: 11.0, beer_share: 2.2, wine_share: 6.4, spirit_share: 2.4 },
    { country: "France", year: 2022, total_liter: 11.1, beer_share: 2.2, wine_share: 6.4, spirit_share: 2.5 },
    { country: "United Kingdom", year: 2018, total_liter: 11.2, beer_share: 3.9, wine_share: 3.9, spirit_share: 3.4 },
    { country: "United Kingdom", year: 2019, total_liter: 10.7, beer_share: 3.7, wine_share: 3.7, spirit_share: 3.3 },
    { country: "United Kingdom", year: 2020, total_liter: 10.6, beer_share: 3.7, wine_share: 3.7, spirit_share: 3.2 },
    { country: "United Kingdom", year: 2021, total_liter: 11.2, beer_share: 3.9, wine_share: 3.9, spirit_share: 3.4 },
    { country: "United Kingdom", year: 2022, total_liter: 10.7, beer_share: 3.7, wine_share: 3.7, spirit_share: 3.3 },
    { country: "USA", year: 2018, total_liter: 10.0, beer_share: 4.5, wine_share: 1.8, spirit_share: 3.7 },
    { country: "USA", year: 2019, total_liter: 10.1, beer_share: 4.5, wine_share: 1.8, spirit_share: 3.8 },
    { country: "USA", year: 2020, total_liter: 9.6, beer_share: 4.3, wine_share: 1.7, spirit_share: 3.6 },
    { country: "USA", year: 2021, total_liter: 10.1, beer_share: 4.5, wine_share: 1.8, spirit_share: 3.8 },
    { country: "USA", year: 2022, total_liter: 9.4, beer_share: 4.2, wine_share: 1.7, spirit_share: 3.5 },
    { country: "Mexico", year: 2018, total_liter: 5.4, beer_share: 4.1, wine_share: 0.1, spirit_share: 1.2 },
    { country: "Mexico", year: 2019, total_liter: 5.5, beer_share: 4.1, wine_share: 0.1, spirit_share: 1.3 },
    { country: "Mexico", year: 2020, total_liter: 5.6, beer_share: 4.2, wine_share: 0.1, spirit_share: 1.3 },
    { country: "Mexico", year: 2021, total_liter: 5.7, beer_share: 4.3, wine_share: 0.1, spirit_share: 1.3 },
    { country: "Mexico", year: 2022, total_liter: 5.6, beer_share: 4.2, wine_share: 0.1, spirit_share: 1.3 },
    { country: "Brazil", year: 2018, total_liter: 7.6, beer_share: 4.6, wine_share: 0.3, spirit_share: 2.7 },
    { country: "Brazil", year: 2019, total_liter: 7.3, beer_share: 4.4, wine_share: 0.3, spirit_share: 2.6 },
    { country: "Brazil", year: 2020, total_liter: 7.6, beer_share: 4.6, wine_share: 0.3, spirit_share: 2.7 },
    { country: "Brazil", year: 2021, total_liter: 7.3, beer_share: 4.4, wine_share: 0.3, spirit_share: 2.6 },
    { country: "Brazil", year: 2022, total_liter: 7.3, beer_share: 4.4, wine_share: 0.3, spirit_share: 2.6 },
    { country: "Colombia", year: 2018, total_liter: 4.5, beer_share: 3.1, wine_share: 0.1, spirit_share: 1.3 },
    { country: "Colombia", year: 2019, total_liter: 4.5, beer_share: 3.1, wine_share: 0.1, spirit_share: 1.3 },
    { country: "Colombia", year: 2020, total_liter: 4.4, beer_share: 3.0, wine_share: 0.1, spirit_share: 1.3 },
    { country: "Colombia", year: 2021, total_liter: 4.4, beer_share: 3.0, wine_share: 0.1, spirit_share: 1.3 },
    { country: "Colombia", year: 2022, total_liter: 4.5, beer_share: 3.1, wine_share: 0.1, spirit_share: 1.3 },
    { country: "Peru", year: 2018, total_liter: 5.0, beer_share: 2.8, wine_share: 0.2, spirit_share: 2.0 },
    { country: "Peru", year: 2019, total_liter: 5.2, beer_share: 2.9, wine_share: 0.3, spirit_share: 2.0 },
    { country: "Peru", year: 2020, total_liter: 5.2, beer_share: 2.9, wine_share: 0.3, spirit_share: 2.0 },
    { country: "Peru", year: 2021, total_liter: 5.0, beer_share: 2.8, wine_share: 0.2, spirit_share: 2.0 },
    { country: "Peru", year: 2022, total_liter: 5.1, beer_share: 2.8, wine_share: 0.3, spirit_share: 2.0 },
    { country: "Chile", year: 2018, total_liter: 7.9, beer_share: 2.8, wine_share: 3.2, spirit_share: 1.9 },
    { country: "Chile", year: 2019, total_liter: 8.0, beer_share: 2.8, wine_share: 3.2, spirit_share: 2.0 },
    { country: "Chile", year: 2020, total_liter: 7.7, beer_share: 2.7, wine_share: 3.1, spirit_share: 1.9 },
    { country: "Chile", year: 2021, total_liter: 8.3, beer_share: 2.9, wine_share: 3.3, spirit_share: 2.1 },
    { country: "Chile", year: 2022, total_liter: 8.0, beer_share: 2.8, wine_share: 3.2, spirit_share: 2.0 },
    { country: "Canada", year: 2018, total_liter: 8.8, beer_share: 4.0, wine_share: 2.2, spirit_share: 2.6 },
    { country: "Canada", year: 2019, total_liter: 8.7, beer_share: 3.9, wine_share: 2.2, spirit_share: 2.6 },
    { country: "Canada", year: 2020, total_liter: 9.0, beer_share: 4.0, wine_share: 2.2, spirit_share: 2.8 },
    { country: "Canada", year: 2021, total_liter: 8.7, beer_share: 3.9, wine_share: 2.2, spirit_share: 2.6 },
    { country: "Canada", year: 2022, total_liter: 8.6, beer_share: 3.9, wine_share: 2.1, spirit_share: 2.6 },
    { country: "Australia", year: 2018, total_liter: 10.4, beer_share: 4.2, wine_share: 4.0, spirit_share: 2.2 },
    { country: "Australia", year: 2019, total_liter: 9.8, beer_share: 3.9, wine_share: 3.7, spirit_share: 2.2 },
    { country: "Australia", year: 2020, total_liter: 9.9, beer_share: 4.0, wine_share: 3.8, spirit_share: 2.1 },
    { country: "Australia", year: 2021, total_liter: 9.7, beer_share: 3.9, wine_share: 3.7, spirit_share: 2.1 },
    { country: "Australia", year: 2022, total_liter: 10.3, beer_share: 4.1, wine_share: 3.9, spirit_share: 2.3 },
    { country: "Japan", year: 2018, total_liter: 7.4, beer_share: 1.5, wine_share: 0.4, spirit_share: 5.5 },
    { country: "Japan", year: 2019, total_liter: 7.3, beer_share: 1.5, wine_share: 0.4, spirit_share: 5.4 },
    { country: "Japan", year: 2020, total_liter: 7.8, beer_share: 1.6, wine_share: 0.4, spirit_share: 5.8 },
    { country: "Japan", year: 2021, total_liter: 7.2, beer_share: 1.4, wine_share: 0.4, spirit_share: 5.4 },
    { country: "Japan", year: 2022, total_liter: 7.5, beer_share: 1.5, wine_share: 0.4, spirit_share: 5.6 },
    { country: "China", year: 2018, total_liter: 5.8, beer_share: 1.7, wine_share: 0.3, spirit_share: 3.8 },
    { country: "China", year: 2019, total_liter: 6.0, beer_share: 1.8, wine_share: 0.3, spirit_share: 3.9 },
    { country: "China", year: 2020, total_liter: 5.9, beer_share: 1.8, wine_share: 0.3, spirit_share: 3.8 },
    { country: "China", year: 2021, total_liter: 6.0, beer_share: 1.8, wine_share: 0.3, spirit_share: 3.9 },
    { country: "China", year: 2022, total_liter: 5.9, beer_share: 1.8, wine_share: 0.3, spirit_share: 3.8 },
    { country: "India", year: 2018, total_liter: 4.8, beer_share: 0.4, wine_share: 0.1, spirit_share: 4.3 },
    { country: "India", year: 2019, total_liter: 5.0, beer_share: 0.4, wine_share: 0.1, spirit_share: 4.5 },
    { country: "India", year: 2020, total_liter: 4.7, beer_share: 0.4, wine_share: 0.1, spirit_share: 4.2 },
    { country: "India", year: 2021, total_liter: 4.9, beer_share: 0.4, wine_share: 0.1, spirit_share: 4.4 },
    { country: "India", year: 2022, total_liter: 4.7, beer_share: 0.4, wine_share: 0.1, spirit_share: 4.2 },
    { country: "Russia", year: 2018, total_liter: 11.1, beer_share: 4.3, wine_share: 1.2, spirit_share: 5.6 },
    { country: "Russia", year: 2019, total_liter: 11.4, beer_share: 4.4, wine_share: 1.3, spirit_share: 5.7 },
    { country: "Russia", year: 2020, total_liter: 11.3, beer_share: 4.4, wine_share: 1.2, spirit_share: 5.7 },
    { country: "Russia", year: 2021, total_liter: 11.1, beer_share: 4.3, wine_share: 1.2, spirit_share: 5.6 },
    { country: "Russia", year: 2022, total_liter: 11.1, beer_share: 4.3, wine_share: 1.2, spirit_share: 5.6 },
    { country: "South Africa", year: 2018, total_liter: 7.9, beer_share: 4.3, wine_share: 1.4, spirit_share: 2.2 },
    { country: "South Africa", year: 2019, total_liter: 7.7, beer_share: 4.2, wine_share: 1.4, spirit_share: 2.1 },
    { country: "South Africa", year: 2020, total_liter: 7.7, beer_share: 4.2, wine_share: 1.4, spirit_share: 2.1 },
    { country: "South Africa", year: 2021, total_liter: 7.7, beer_share: 4.2, wine_share: 1.4, spirit_share: 2.1 },
    { country: "South Africa", year: 2022, total_liter: 7.8, beer_share: 4.3, wine_share: 1.4, spirit_share: 2.1 },
    { country: "Nigeria", year: 2018, total_liter: 10.5, beer_share: 0.8, wine_share: 0.2, spirit_share: 9.5 },
    { country: "Nigeria", year: 2019, total_liter: 10.4, beer_share: 0.8, wine_share: 0.2, spirit_share: 9.4 },
    { country: "Nigeria", year: 2020, total_liter: 10.6, beer_share: 0.8, wine_share: 0.2, spirit_share: 9.6 },
    { country: "Nigeria", year: 2021, total_liter: 10.5, beer_share: 0.8, wine_share: 0.2, spirit_share: 9.5 },
    { country: "Nigeria", year: 2022, total_liter: 10.9, beer_share: 0.9, wine_share: 0.2, spirit_share: 9.8 },
    { country: "Egypt", year: 2018, total_liter: 0.3, beer_share: 0.1, wine_share: 0.0, spirit_share: 0.2 },
    { country: "Egypt", year: 2019, total_liter: 0.3, beer_share: 0.1, wine_share: 0.0, spirit_share: 0.2 },
    { country: "Egypt", year: 2020, total_liter: 0.3, beer_share: 0.1, wine_share: 0.0, spirit_share: 0.2 },
    { country: "Egypt", year: 2021, total_liter: 0.3, beer_share: 0.1, wine_share: 0.0, spirit_share: 0.2 },
    { country: "Egypt", year: 2022, total_liter: 0.3, beer_share: 0.1, wine_share: 0.0, spirit_share: 0.2 },
    { country: "Turkey", year: 2018, total_liter: 1.5, beer_share: 0.9, wine_share: 0.2, spirit_share: 0.4 },
    { country: "Turkey", year: 2019, total_liter: 1.5, beer_share: 0.9, wine_share: 0.2, spirit_share: 0.4 },
    { country: "Turkey", year: 2020, total_liter: 1.5, beer_share: 0.9, wine_share: 0.2, spirit_share: 0.4 },
    { country: "Turkey", year: 2021, total_liter: 1.5, beer_share: 0.9, wine_share: 0.2, spirit_share: 0.4 },
    { country: "Turkey", year: 2022, total_liter: 1.5, beer_share: 0.9, wine_share: 0.2, spirit_share: 0.4 },
    { country: "Greece", year: 2018, total_liter: 8.8, beer_share: 2.5, wine_share: 4.0, spirit_share: 2.3 },
    { country: "Greece", year: 2019, total_liter: 8.7, beer_share: 2.4, wine_share: 3.9, spirit_share: 2.4 },
    { country: "Greece", year: 2020, total_liter: 9.0, beer_share: 2.5, wine_share: 4.0, spirit_share: 2.5 },
    { country: "Greece", year: 2021, total_liter: 9.3, beer_share: 2.6, wine_share: 4.2, spirit_share: 2.5 },
    { country: "Greece", year: 2022, total_liter: 8.6, beer_share: 2.4, wine_share: 3.9, spirit_share: 2.3 },
    { country: "Portugal", year: 2018, total_liter: 10.3, beer_share: 3.1, wine_share: 5.7, spirit_share: 1.5 },
    { country: "Portugal", year: 2019, total_liter: 10.1, beer_share: 3.0, wine_share: 5.6, spirit_share: 1.5 },
    { country: "Portugal", year: 2020, total_liter: 10.4, beer_share: 3.1, wine_share: 5.7, spirit_share: 1.6 },
    { country: "Portugal", year: 2021, total_liter: 10.4, beer_share: 3.1, wine_share: 5.7, spirit_share: 1.6 },
    { country: "Portugal", year: 2022, total_liter: 10.3, beer_share: 3.1, wine_share: 5.7, spirit_share: 1.5 },
    { country: "Ireland", year: 2018, total_liter: 10.8, beer_share: 5.2, wine_share: 3.0, spirit_share: 2.6 },
    { country: "Ireland", year: 2019, total_liter: 10.8, beer_share: 5.2, wine_share: 3.0, spirit_share: 2.6 },
    { country: "Ireland", year: 2020, total_liter: 11.1, beer_share: 5.3, wine_share: 3.1, spirit_share: 2.7 },
    { country: "Ireland", year: 2021, total_liter: 11.0, beer_share: 5.3, wine_share: 3.1, spirit_share: 2.6 },
    { country: "Ireland", year: 2022, total_liter: 10.6, beer_share: 5.1, wine_share: 3.0, spirit_share: 2.5 },
    { country: "Belgium", year: 2018, total_liter: 10.5, beer_share: 4.7, wine_share: 3.7, spirit_share: 2.1 },
    { country: "Belgium", year: 2019, total_liter: 10.9, beer_share: 4.9, wine_share: 3.8, spirit_share: 2.2 },
    { country: "Belgium", year: 2020, total_liter: 10.8, beer_share: 4.9, wine_share: 3.8, spirit_share: 2.1 },
    { country: "Belgium", year: 2021, total_liter: 10.7, beer_share: 4.8, wine_share: 3.7, spirit_share: 2.2 },
    { country: "Belgium", year: 2022, total_liter: 10.8, beer_share: 4.9, wine_share: 3.8, spirit_share: 2.1 },
    { country: "Netherlands", year: 2018, total_liter: 8.8, beer_share: 4.2, wine_share: 3.1, spirit_share: 1.5 },
    { country: "Netherlands", year: 2019, total_liter: 8.4, beer_share: 4.0, wine_share: 2.9, spirit_share: 1.5 },
    { country: "Netherlands", year: 2020, total_liter: 8.9, beer_share: 4.3, wine_share: 3.1, spirit_share: 1.5 },
    { country: "Netherlands", year: 2021, total_liter: 9.0, beer_share: 4.3, wine_share: 3.1, spirit_share: 1.6 },
    { country: "Netherlands", year: 2022, total_liter: 8.5, beer_share: 4.1, wine_share: 3.0, spirit_share: 1.4 },
    { country: "Sweden", year: 2018, total_liter: 8.3, beer_share: 2.9, wine_share: 3.7, spirit_share: 1.7 },
    { country: "Sweden", year: 2019, total_liter: 8.7, beer_share: 3.0, wine_share: 3.9, spirit_share: 1.8 },
    { country: "Sweden", year: 2020, total_liter: 8.3, beer_share: 2.9, wine_share: 3.7, spirit_share: 1.7 },
    { country: "Sweden", year: 2021, total_liter: 8.7, beer_share: 3.0, wine_share: 3.9, spirit_share: 1.8 },
    { country: "Sweden", year: 2022, total_liter: 8.2, beer_share: 2.9, wine_share: 3.7, spirit_share: 1.6 },
    { country: "Norway", year: 2018, total_liter: 6.9, beer_share: 3.0, wine_share: 2.6, spirit_share: 1.3 },
    { country: "Norway", year: 2019, total_liter: 6.6, beer_share: 2.8, wine_share: 2.5, spirit_share: 1.3 },
    { country: "Norway", year: 2020, total_liter: 6.6, beer_share: 2.8, wine_share: 2.5, spirit_share: 1.3 },
    { country: "Norway", year: 2021, total_liter: 6.8, beer_share: 2.9, wine_share: 2.6, spirit_share: 1.3 },
    { country: "Norway", year: 2022, total_liter: 7.1, beer_share: 3.1, wine_share: 2.7, spirit_share: 1.3 },
    { country: "Finland", year: 2018, total_liter: 9.2, beer_share: 4.4, wine_share: 2.3, spirit_share: 2.5 },
    { country: "Finland", year: 2019, total_liter: 9.3, beer_share: 4.5, wine_share: 2.3, spirit_share: 2.5 },
    { country: "Finland", year: 2020, total_liter: 9.2, beer_share: 4.4, wine_share: 2.3, spirit_share: 2.5 },
    { country: "Finland", year: 2021, total_liter: 9.9, beer_share: 4.8, wine_share: 2.5, spirit_share: 2.6 },
    { country: "Finland", year: 2022, total_liter: 9.2, beer_share: 4.4, wine_share: 2.3, spirit_share: 2.5 },
    { country: "Denmark", year: 2018, total_liter: 9.7, beer_share: 3.6, wine_share: 4.4, spirit_share: 1.7 },
    { country: "Denmark", year: 2019, total_liter: 9.6, beer_share: 3.6, wine_share: 4.3, spirit_share: 1.7 },
    { country: "Denmark", year: 2020, total_liter: 10.1, beer_share: 3.7, wine_share: 4.5, spirit_share: 1.9 },
    { country: "Denmark", year: 2021, total_liter: 9.6, beer_share: 3.6, wine_share: 4.3, spirit_share: 1.7 },
    { country: "Denmark", year: 2022, total_liter: 9.9, beer_share: 3.7, wine_share: 4.5, spirit_share: 1.7 },
    { country: "Poland", year: 2018, total_liter: 10.8, beer_share: 5.9, wine_share: 0.9, spirit_share: 4.0 },
    { country: "Poland", year: 2019, total_liter: 10.8, beer_share: 5.9, wine_share: 0.9, spirit_share: 4.0 },
    { country: "Poland", year: 2020, total_liter: 11.2, beer_share: 6.2, wine_share: 0.9, spirit_share: 4.1 },
    { country: "Poland", year: 2021, total_liter: 10.8, beer_share: 5.9, wine_share: 0.9, spirit_share: 4.0 },
    { country: "Poland", year: 2022, total_liter: 11.4, beer_share: 6.3, wine_share: 0.9, spirit_share: 4.2 },
    { country: "Czechia", year: 2018, total_liter: 14.8, beer_share: 7.8, wine_share: 3.0, spirit_share: 4.0 },
    { country: "Czechia", year: 2019, total_liter: 14.8, beer_share: 7.8, wine_share: 3.0, spirit_share: 4.0 },
    { country: "Czechia", year: 2020, total_liter: 14.9, beer_share: 7.9, wine_share: 3.0, spirit_share: 4.0 },
    { country: "Czechia", year: 2021, total_liter: 14.8, beer_share: 7.8, wine_share: 3.0, spirit_share: 4.0 },
    { country: "Czechia", year: 2022, total_liter: 14.7, beer_share: 7.8, wine_share: 2.9, spirit_share: 4.0 },
    { country: "Austria", year: 2018, total_liter: 12.1, beer_share: 6.0, wine_share: 4.2, spirit_share: 1.9 },
    { country: "Austria", year: 2019, total_liter: 12.0, beer_share: 6.0, wine_share: 4.2, spirit_share: 1.8 },
    { country: "Austria", year: 2020, total_liter: 12.2, beer_share: 6.1, wine_share: 4.3, spirit_share: 1.8 },
    { country: "Austria", year: 2021, total_liter: 11.6, beer_share: 5.8, wine_share: 4.1, spirit_share: 1.7 },
    { country: "Austria", year: 2022, total_liter: 11.4, beer_share: 5.7, wine_share: 4.0, spirit_share: 1.7 },
    { country: "Germany", year: 2016, total_liter: 11.0, beer_share: 5.6, wine_share: 3.1, spirit_share: 2.3 },
    { country: "Albania", year: 2016, total_liter: 4.8, beer_share: 1.9, wine_share: 1.6, spirit_share: 1.3 },
    { country: "Albania", year: 2017, total_liter: 4.8, beer_share: 1.9, wine_share: 1.6, spirit_share: 1.3 },
    { country: "Argentina", year: 2016, total_liter: 7.9, beer_share: 3.1, wine_share: 3.5, spirit_share: 1.3 },
    { country: "Argentina", year: 2017, total_liter: 7.9, beer_share: 3.1, wine_share: 3.5, spirit_share: 1.3 },
    { country: "Bulgaria", year: 2016, total_liter: 11.4, beer_share: 4.6, wine_share: 2.1, spirit_share: 4.7 },
    { country: "Bulgaria", year: 2017, total_liter: 11.4, beer_share: 4.6, wine_share: 2.1, spirit_share: 4.7 },
    { country: "Georgia", year: 2016, total_liter: 8.7, beer_share: 1.9, wine_share: 4.5, spirit_share: 2.3 },
    { country: "Georgia", year: 2017, total_liter: 8.7, beer_share: 1.9, wine_share: 4.5, spirit_share: 2.3 },
    { country: "Italy", year: 2016, total_liter: 7.5, beer_share: 1.9, wine_share: 5.0, spirit_share: 0.6 },
    { country: "Italy", year: 2017, total_liter: 7.5, beer_share: 1.9, wine_share: 5.0, spirit_share: 0.6 },
    { country: "Namibia", year: 2016, total_liter: 10.8, beer_share: 6.5, wine_share: 3.1, spirit_share: 1.2 },
    { country: "Namibia", year: 2017, total_liter: 10.8, beer_share: 6.5, wine_share: 3.1, spirit_share: 1.2 },
    { country: "Syrian Arab Republic", year: 2016, total_liter: 0.2, beer_share: 0.0, wine_share: 0.0, spirit_share: 0.2 },
    { country: "Syrian Arab Republic", year: 2017, total_liter: 0.2, beer_share: 0.0, wine_share: 0.0, spirit_share: 0.2 },
    { country: "Philippines", year: 2016, total_liter: 5.4, beer_share: 1.5, wine_share: 0.1, spirit_share: 3.8 },
    { country: "Philippines", year: 2017, total_liter: 5.4, beer_share: 1.5, wine_share: 0.1, spirit_share: 3.8 },
    { country: "Spain", year: 2016, total_liter: 10.9, beer_share: 5.4, wine_share: 2.3, spirit_share: 3.2 },
    { country: "Spain", year: 2017, total_liter: 10.9, beer_share: 5.4, wine_share: 2.3, spirit_share: 3.2 },
    { country: "France", year: 2016, total_liter: 11.9, beer_share: 2.4, wine_share: 6.9, spirit_share: 2.6 },
    { country: "France", year: 2017, total_liter: 11.9, beer_share: 2.4, wine_share: 6.9, spirit_share: 2.6 },
    { country: "United Kingdom", year: 2016, total_liter: 11.4, beer_share: 4.0, wine_share: 4.0, spirit_share: 3.4 },
    { country: "United Kingdom", year: 2017, total_liter: 11.4, beer_share: 4.0, wine_share: 4.0, spirit_share: 3.4 },
    { country: "USA", year: 2016, total_liter: 10.0, beer_share: 4.5, wine_share: 1.8, spirit_share: 3.7 },
    { country: "USA", year: 2017, total_liter: 10.0, beer_share: 4.5, wine_share: 1.8, spirit_share: 3.7 },
    { country: "Mexico", year: 2016, total_liter: 5.3, beer_share: 4.0, wine_share: 0.1, spirit_share: 1.2 },
    { country: "Mexico", year: 2017, total_liter: 5.3, beer_share: 4.0, wine_share: 0.1, spirit_share: 1.2 },
    { country: "Brazil", year: 2016, total_liter: 7.7, beer_share: 4.7, wine_share: 0.3, spirit_share: 2.7 },
    { country: "Brazil", year: 2017, total_liter: 7.7, beer_share: 4.7, wine_share: 0.3, spirit_share: 2.7 },
    { country: "Colombia", year: 2016, total_liter: 4.6, beer_share: 3.2, wine_share: 0.1, spirit_share: 1.3 },
    { country: "Colombia", year: 2017, total_liter: 4.6, beer_share: 3.2, wine_share: 0.1, spirit_share: 1.3 },
    { country: "Peru", year: 2016, total_liter: 5.1, beer_share: 2.8, wine_share: 0.2, spirit_share: 2.1 },
    { country: "Peru", year: 2017, total_liter: 5.1, beer_share: 2.8, wine_share: 0.2, spirit_share: 2.1 },
    { country: "Chile", year: 2016, total_liter: 8.0, beer_share: 2.9, wine_share: 3.2, spirit_share: 1.9 },
    { country: "Chile", year: 2017, total_liter: 8.0, beer_share: 2.9, wine_share: 3.2, spirit_share: 1.9 },
    { country: "Canada", year: 2016, total_liter: 8.9, beer_share: 4.1, wine_share: 2.2, spirit_share: 2.6 },
    { country: "Canada", year: 2017, total_liter: 8.9, beer_share: 4.1, wine_share: 2.2, spirit_share: 2.6 },
    { country: "Australia", year: 2016, total_liter: 10.5, beer_share: 4.3, wine_share: 4.0, spirit_share: 2.2 },
    { country: "Australia", year: 2017, total_liter: 10.5, beer_share: 4.3, wine_share: 4.0, spirit_share: 2.2 },
    { country: "Oman", year: 2016, total_liter: 0.1, beer_share: 0.0, wine_share: 0.0, spirit_share: 0.1 },
    { country: "Oman", year: 2017, total_liter: 0.1, beer_share: 0.0, wine_share: 0.0, spirit_share: 0.1 },
    { country: "Oman", year: 2018, total_liter: 0.1, beer_share: 0.0, wine_share: 0.0, spirit_share: 0.1 },
    { country: "Oman", year: 2019, total_liter: 0.1, beer_share: 0.0, wine_share: 0.0, spirit_share: 0.1 },
    { country: "Oman", year: 2020, total_liter: 0.1, beer_share: 0.0, wine_share: 0.0, spirit_share: 0.1 },
    { country: "Oman", year: 2021, total_liter: 0.1, beer_share: 0.0, wine_share: 0.0, spirit_share: 0.1 },
    { country: "Oman", year: 2022, total_liter: 0.1, beer_share: 0.0, wine_share: 0.0, spirit_share: 0.1 },

    { country: "South Korea", year: 2016, total_liter: 10.3, beer_share: 2.2, wine_share: 0.2, spirit_share: 7.9 },
    { country: "South Korea", year: 2017, total_liter: 10.3, beer_share: 2.2, wine_share: 0.2, spirit_share: 7.9 },
    { country: "South Korea", year: 2018, total_liter: 10.2, beer_share: 2.1, wine_share: 0.2, spirit_share: 7.9 },
    { country: "South Korea", year: 2019, total_liter: 10.1, beer_share: 2.1, wine_share: 0.2, spirit_share: 7.8 },
    { country: "South Korea", year: 2020, total_liter: 9.8, beer_share: 2.0, wine_share: 0.2, spirit_share: 7.6 },
    { country: "South Korea", year: 2021, total_liter: 9.9, beer_share: 2.1, wine_share: 0.2, spirit_share: 7.6 },
    { country: "South Korea", year: 2022, total_liter: 10.0, beer_share: 2.1, wine_share: 0.2, spirit_share: 7.7 },

    { country: "Romania", year: 2016, total_liter: 11.2, beer_share: 5.6, wine_share: 3.1, spirit_share: 2.5 },
    { country: "Romania", year: 2017, total_liter: 11.2, beer_share: 5.6, wine_share: 3.1, spirit_share: 2.5 },
    { country: "Romania", year: 2018, total_liter: 11.0, beer_share: 5.5, wine_share: 3.0, spirit_share: 2.5 },
    { country: "Romania", year: 2019, total_liter: 10.9, beer_share: 5.4, wine_share: 3.0, spirit_share: 2.5 },
    { country: "Romania", year: 2020, total_liter: 10.8, beer_share: 5.4, wine_share: 3.0, spirit_share: 2.4 },
    { country: "Romania", year: 2021, total_liter: 11.0, beer_share: 5.5, wine_share: 3.0, spirit_share: 2.5 },
    { country: "Romania", year: 2022, total_liter: 11.1, beer_share: 5.6, wine_share: 3.0, spirit_share: 2.5 },

    { country: "Hungary", year: 2016, total_liter: 11.4, beer_share: 4.1, wine_share: 4.1, spirit_share: 3.2 },
    { country: "Hungary", year: 2017, total_liter: 11.4, beer_share: 4.1, wine_share: 4.1, spirit_share: 3.2 },
    { country: "Hungary", year: 2018, total_liter: 11.2, beer_share: 4.0, wine_share: 4.0, spirit_share: 3.2 },
    { country: "Hungary", year: 2019, total_liter: 11.1, beer_share: 4.0, wine_share: 4.0, spirit_share: 3.1 },
    { country: "Hungary", year: 2020, total_liter: 10.9, beer_share: 3.9, wine_share: 3.9, spirit_share: 3.1 },
    { country: "Hungary", year: 2021, total_liter: 11.0, beer_share: 4.0, wine_share: 3.9, spirit_share: 3.1 },
    { country: "Hungary", year: 2022, total_liter: 11.1, beer_share: 4.0, wine_share: 4.0, spirit_share: 3.1 },

    { country: "Switzerland", year: 2016, total_liter: 9.1, beer_share: 3.5, wine_share: 4.6, spirit_share: 1.0 },
    { country: "Switzerland", year: 2017, total_liter: 9.1, beer_share: 3.5, wine_share: 4.6, spirit_share: 1.0 },
    { country: "Switzerland", year: 2018, total_liter: 9.0, beer_share: 3.5, wine_share: 4.5, spirit_share: 1.0 },
    { country: "Switzerland", year: 2019, total_liter: 8.9, beer_share: 3.4, wine_share: 4.5, spirit_share: 1.0 },
    { country: "Switzerland", year: 2020, total_liter: 8.8, beer_share: 3.4, wine_share: 4.4, spirit_share: 1.0 },
    { country: "Switzerland", year: 2021, total_liter: 8.9, beer_share: 3.5, wine_share: 4.4, spirit_share: 1.0 },
    { country: "Switzerland", year: 2022, total_liter: 8.9, beer_share: 3.5, wine_share: 4.4, spirit_share: 1.0 },

    { country: "New Zealand", year: 2016, total_liter: 9.2, beer_share: 4.6, wine_share: 3.1, spirit_share: 1.5 },
    { country: "New Zealand", year: 2017, total_liter: 9.2, beer_share: 4.6, wine_share: 3.1, spirit_share: 1.5 },
    { country: "New Zealand", year: 2018, total_liter: 9.0, beer_share: 4.5, wine_share: 3.0, spirit_share: 1.5 },
    { country: "New Zealand", year: 2019, total_liter: 8.9, beer_share: 4.4, wine_share: 3.0, spirit_share: 1.5 },
    { country: "New Zealand", year: 2020, total_liter: 8.8, beer_share: 4.4, wine_share: 2.9, spirit_share: 1.5 },
    { country: "New Zealand", year: 2021, total_liter: 8.9, beer_share: 4.5, wine_share: 3.0, spirit_share: 1.4 },
    { country: "New Zealand", year: 2022, total_liter: 8.9, beer_share: 4.5, wine_share: 3.0, spirit_share: 1.4 },

    { country: "Uruguay", year: 2016, total_liter: 6.6, beer_share: 2.6, wine_share: 3.0, spirit_share: 1.0 },
    { country: "Uruguay", year: 2017, total_liter: 6.6, beer_share: 2.6, wine_share: 3.0, spirit_share: 1.0 },
    { country: "Uruguay", year: 2018, total_liter: 6.5, beer_share: 2.5, wine_share: 3.0, spirit_share: 1.0 },
    { country: "Uruguay", year: 2019, total_liter: 6.4, beer_share: 2.5, wine_share: 2.9, spirit_share: 1.0 },
    { country: "Uruguay", year: 2020, total_liter: 6.3, beer_share: 2.4, wine_share: 2.9, spirit_share: 1.0 },
    { country: "Uruguay", year: 2021, total_liter: 6.4, beer_share: 2.5, wine_share: 2.9, spirit_share: 1.0 },
    { country: "Uruguay", year: 2022, total_liter: 6.5, beer_share: 2.5, wine_share: 3.0, spirit_share: 1.0 }
];

export const loadJLRA = (app) => {

    // =========================================================================
    // VERSIÓN 1 
    // =========================================================================

    app.get(`${BASE_API_URL_V1}/loadInitialData`, (req, res) => {
        db.find({}, function (err, docs) {
            if (err) return res.sendStatus(500);
            if (docs.length === 0) {
                db.insert(dataJLRA, function (err, newDocs) {
                    if (err) return res.sendStatus(500);
                    res.sendStatus(200); 
                });
            } else { res.sendStatus(409); }
        });
    });

    app.get(`${BASE_API_URL_V1}/docs`, (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52398088/2sBXigNZg3");
    });

    app.get(BASE_API_URL_V1, (req, res) => {
        let query = {};
        if (req.query.country) query.country = req.query.country;
        if (req.query.year) query.year = parseInt(req.query.year);
        if (req.query.total_liter) query.total_liter = parseFloat(req.query.total_liter);
        if (req.query.beer_share) query.beer_share = parseFloat(req.query.beer_share);
        if (req.query.wine_share) query.wine_share = parseFloat(req.query.wine_share);
        if (req.query.spirit_share) query.spirit_share = parseFloat(req.query.spirit_share);

        let offset = 0; let limit = 0;
        if (req.query.offset) {
            offset = parseInt(req.query.offset);
            if (isNaN(offset) || offset < 0) return res.sendStatus(400); 
        }
        if (req.query.limit) {
            limit = parseInt(req.query.limit);
           if (isNaN(limit) || limit <= 0) return res.sendStatus(400); 
        }
        
        db.find(query, { _id: 0 }).skip(offset).limit(limit).exec(function (err, docs) {
            if (err) return res.sendStatus(500);
            res.status(200).json(docs); 
        });
    });

    app.post(BASE_API_URL_V1, (req, res) => {
        const newData = req.body;
        if (!newData || Object.keys(newData).length !== 6 || newData.country === undefined || newData.year === undefined || newData.total_liter === undefined || newData.beer_share === undefined || newData.wine_share === undefined || newData.spirit_share === undefined) {
            return res.sendStatus(400);
        }
        db.find({ country: newData.country, year: newData.year }, function (err, docs) {
            if (err) return res.sendStatus(500);
            if (docs.length > 0) return res.sendStatus(409);
            db.insert(newData, function (err, newDoc) {
                if (err) return res.sendStatus(500);
                res.sendStatus(201);
            });
        });
    });

    app.put(BASE_API_URL_V1, (req, res) => res.sendStatus(405));

    app.delete(BASE_API_URL_V1, (req, res) => {
        db.remove({}, { multi: true }, function (err, numRemoved) {
            if (err) return res.sendStatus(500);
            res.sendStatus(200);
        });
    });

    app.get(`${BASE_API_URL_V1}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        db.find({ country: countryName, year: year }, { _id: 0 }, function (err, docs) {
            if (err) return res.sendStatus(500);
            if (docs.length > 0) res.status(200).json(docs[0]); 
            else res.sendStatus(404);
        });
    });

    app.post(`${BASE_API_URL_V1}/:country/:year`, (req, res) => res.sendStatus(405));

    app.put(`${BASE_API_URL_V1}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        const updatedData = req.body;
        if (!updatedData || Object.keys(updatedData).length !== 6 || updatedData.country === undefined || updatedData.year === undefined || updatedData.total_liter === undefined || updatedData.beer_share === undefined || updatedData.wine_share === undefined || updatedData.spirit_share === undefined) {
            return res.sendStatus(400);
        }
        if (updatedData.country !== countryName || updatedData.year !== year) return res.sendStatus(400);

        db.update({ country: countryName, year: year }, updatedData, {}, function (err, numReplaced) {
            if (err) return res.sendStatus(500);
            if (numReplaced === 0) return res.sendStatus(404);
            else res.sendStatus(200);
        });
    });

    app.delete(`${BASE_API_URL_V1}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        db.remove({ country: countryName, year: year }, {}, function (err, numRemoved) {
            if (err) return res.sendStatus(500);
            if (numRemoved === 0) return res.sendStatus(404);
            else res.sendStatus(200);
        });
    });


    // =========================================================================
    // VERSIÓN 2
    // =========================================================================


    app.get(`${BASE_API_URL_V2}/loadInitialData`, (req, res) => {
        // Usamos count() como en tu ejemplo, que es más eficiente que find()
        db.count({}, (err, count) => { 
            if (err) return res.sendStatus(500);
            
            if (count > 0) {
                // Backlog: Si ya hay datos, código 409 Conflict
                return res.sendStatus(409);
            }

            // Ruta hacia el archivo que acabas de descargar y guardar en tu proyecto
            const alcohol_csv = './data/alcohol_data.csv';

            csv().fromFile(alcohol_csv).then((datos) => {
                // Mapeamos y limpiamos los datos para quedarnos solo con TUS 6 columnas
                const datosLimpios = datos.map(m => ({
                    country: String(m.country).trim(),
                    year: Number(m.year),
                    total_liter: Number(m.total_liter) || 0,
                    beer_share: Number(m.beer_share) || 0,
                    wine_share: Number(m.wine_share) || 0,
                    spirit_share: Number(m.spirit_share) || 0
                }));

                db.insert(datosLimpios, (err, newDocs) => {
                    if (err) return res.sendStatus(500);
                    
                    res.sendStatus(200);
                });
            }).catch((err) => {
                console.error("Error leyendo el CSV:", err);
                res.sendStatus(500);
            });
        });
    });
    // ⚠️ ATENCIÓN: Aquí tendrás que poner el nuevo enlace de Postman cuando lo crees
    app.get(`${BASE_API_URL_V2}/docs`, (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52398088/2sBXiomA1M");
    });

    // GET LISTA V2 (¡LA MAGIA ESTÁ AQUÍ!)
    app.get(BASE_API_URL_V2, (req, res) => {
        let query = {};
        
        if (req.query.country) query.country = req.query.country;
        if (req.query.total_liter) query.total_liter = parseFloat(req.query.total_liter);
        if (req.query.beer_share) query.beer_share = parseFloat(req.query.beer_share);
        if (req.query.wine_share) query.wine_share = parseFloat(req.query.wine_share);
        if (req.query.spirit_share) query.spirit_share = parseFloat(req.query.spirit_share);

        // Si mandan 'from' o 'to', creamos el rango. Si mandan 'year', búsqueda exacta.
        if (req.query.from || req.query.to) {
            query.year = {};
            if (req.query.from) query.year.$gte = parseInt(req.query.from);
            if (req.query.to) query.year.$lte = parseInt(req.query.to);
        } else if (req.query.year) {
            query.year = parseInt(req.query.year);
        }

        let offset = 0; let limit = 0;
        if (req.query.offset) {
            offset = parseInt(req.query.offset);
            if (isNaN(offset) || offset < 0) return res.sendStatus(400); 
        }
        if (req.query.limit) {
            limit = parseInt(req.query.limit);
           if (isNaN(limit) || limit <= 0) return res.sendStatus(400); 
        }
        
        db.find(query, { _id: 0 }).skip(offset).limit(limit).exec(function (err, docs) {
            if (err) return res.sendStatus(500);
            res.status(200).json(docs); 
        });
    });

    // POST LISTA V2
    app.post(BASE_API_URL_V2, (req, res) => {
        const newData = req.body;
        if (!newData || Object.keys(newData).length !== 6 || newData.country === undefined || newData.year === undefined || newData.total_liter === undefined || newData.beer_share === undefined || newData.wine_share === undefined || newData.spirit_share === undefined) {
            return res.sendStatus(400);
        }
        db.find({ country: newData.country, year: newData.year }, function (err, docs) {
            if (err) return res.sendStatus(500);
            if (docs.length > 0) return res.sendStatus(409);
            db.insert(newData, function (err, newDoc) {
                if (err) return res.sendStatus(500);
                res.sendStatus(201);
            });
        });
    });

    app.put(BASE_API_URL_V2, (req, res) => res.sendStatus(405));

    app.delete(BASE_API_URL_V2, (req, res) => {
        db.remove({}, { multi: true }, function (err, numRemoved) {
            if (err) return res.sendStatus(500);
            res.sendStatus(200);
        });
    });

    // GET RECURSO CONCRETO V2
    app.get(`${BASE_API_URL_V2}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        db.find({ country: countryName, year: year }, { _id: 0 }, function (err, docs) {
            if (err) return res.sendStatus(500);
            if (docs.length > 0) res.status(200).json(docs[0]); 
            else res.sendStatus(404);
        });
    });

    app.post(`${BASE_API_URL_V2}/:country/:year`, (req, res) => res.sendStatus(405));

    app.put(`${BASE_API_URL_V2}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        const updatedData = req.body;
        if (!updatedData || Object.keys(updatedData).length !== 6 || updatedData.country === undefined || updatedData.year === undefined || updatedData.total_liter === undefined || updatedData.beer_share === undefined || updatedData.wine_share === undefined || updatedData.spirit_share === undefined) {
            return res.sendStatus(400);
        }
        if (updatedData.country !== countryName || updatedData.year !== year) return res.sendStatus(400);

        db.update({ country: countryName, year: year }, updatedData, {}, function (err, numReplaced) {
            if (err) return res.sendStatus(500);
            if (numReplaced === 0) return res.sendStatus(404);
            else res.sendStatus(200);
        });
    });

    app.delete(`${BASE_API_URL_V2}/:country/:year`, (req, res) => {
        const countryName = req.params.country;
        const year = parseInt(req.params.year);
        db.remove({ country: countryName, year: year }, {}, function (err, numRemoved) {
            if (err) return res.sendStatus(500);
            if (numRemoved === 0) return res.sendStatus(404);
            else res.sendStatus(200);
        });
    });
};