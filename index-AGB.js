let data = [
    { country: "Germany", year: 2021, air_arrival: 34307, water_arrival: 3110, land_arrival: 0 },
    { country: "India", year: 2020, air_arrival: 2170, water_arrival: 41, land_arrival: 528 },
    { country: "India", year: 2021, air_arrival: 1267, water_arrival: 8, land_arrival: 243 },
    { country: "Maldives", year: 2020, air_arrival: 555, water_arrival: 0, land_arrival: 0 },
    { country: "Maldives", year: 2021, air_arrival: 1321, water_arrival: 1, land_arrival: 0 },
    { country: "Nepal", year: 2020, air_arrival: 230, water_arrival: 0, land_arrival: 0 },
    { country: "Nepal", year: 2021, air_arrival: 150, water_arrival: 0, land_arrival: 0 },
    { country: "Sri Lanka", year: 2020, air_arrival: 507, water_arrival: 0, land_arrival: 0 },
    { country: "Sri Lanka", year: 2021, air_arrival: 194, water_arrival: 0, land_arrival: 0 },
    { country: "Philippines", year: 2020, air_arrival: 1482, water_arrival: 0, land_arrival: 0 },
    { country: "Philippines", year: 2021, air_arrival: 164, water_arrival: 0, land_arrival: 0 }
];

function average_data(data){
    let targetCountry = data.filter( (n) => n.country === "India");
    
    let arrivals = targetCountry.map( (n) => n.air_arrival);
    
    let numerator = arrivals.reduce( (n, b) => n += b);
    
    return numerator / arrivals.length;
}

console.log(average_data(data));
