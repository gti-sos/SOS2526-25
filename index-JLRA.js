let data = [
    { country: "Germany", year: 2021, total_liter: 10.4, beer_share: 4.7, wine_share: 3.3, spirit_share: 2.4 },
    { country: "Albania", year: 2022, total_liter: 4.6, beer_share: 1.8, wine_share: 1.6, spirit_share: 1.1 },
    { country: "Albania", year: 2021, total_liter: 4.5, beer_share: 1.8, wine_share: 1.5, spirit_share: 1.2 },
    { country: "Argentina", year: 2018, total_liter: 7.6, beer_share: 3.3, wine_share: 2.5, spirit_share: 0.7 },
    { country: "Bulgaria", year: 2019, total_liter: 10.8, beer_share: 4.6, wine_share: 1.3, spirit_share: 4.8 },
    { country: "Georgia", year: 2020, total_liter: 8.5, beer_share: 1.9, wine_share: 4.4, spirit_share: 2.2 },
    { country: "Italy", year: 2019, total_liter: 7.6, beer_share: 1.8, wine_share: 5.3, spirit_share: 0.5 },
    { country: "Nambia", year: 2017, total_liter: 11.0, beer_share: 6.7, wine_share: 3.1, spirit_share: 0.7 },
    { country: "Syrian Arab Republic", year: 2020, total_liter: 0.1, beer_share: 0.0, wine_share: 0.0, spirit_share: 0.1 },
    { country: "Philippines", year: 2020, total_liter: 4.5, beer_share: 0.9, wine_share: 0.0, spirit_share: 3.5 },
    { country: "Philippines", year: 2019, total_liter: 5.1, beer_share: 1.5, wine_share: 0.0, spirit_share: 3.5 }, 
    { country: "Philippines", year: 2016, total_liter: 5.2, beer_share: 1.6, wine_share: 0.0, spirit_share: 3.1 }
];

function average_data(data){
    let philippines = data.filter( (n) => n.country === "Philippines");
    let beer = philippines.map( (n) => n.beer_share);
    let numerator = beer.reduce( (n, b) => n +=b);
    return numerator/beer.length;
}

console.log(average_data(data))