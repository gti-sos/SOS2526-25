<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Cargando y cruzando datos con NASA POWER...");
    let fallbackActivado = $state(false);

    const countries = [
        { name: "Germany", lat: 51.16, lon: 10.45 },
        { name: "Spain", lat: 40.46, lon: -3.75 },
        { name: "USA", lat: 37.09, lon: -95.71 },
        { name: "China", lat: 35.86, lon: 104.19 },
        { name: "France", lat: 46.60, lon: 1.88 },
        { name: "Italy", lat: 41.87, lon: 12.57 },
        { name: "Turkey", lat: 38.96, lon: 35.24 },
        { name: "Mexico", lat: 23.63, lon: -102.55 }
    ];

    onMount(async () => {
        if (!browser) return;

        const scriptD3 = document.createElement('script');
        scriptD3.src = "https://d3js.org/d3.v5.min.js";
        scriptD3.onload = () => {
            const scriptC3 = document.createElement('script');
            scriptC3.src = "https://cdnjs.cloudflare.com/ajax/libs/c3/0.7.20/c3.min.js";
            scriptC3.onload = loadAndDraw;
            document.head.appendChild(scriptC3);
        };
        document.head.appendChild(scriptD3);
    });

    async function loadAndDraw() {
        try {
            let chartCategories = [];
            let seriesTemp = ['Temperatura Media (ºC)'];
            let seriesSolar = ['Radiación Solar Anual (kWh/m²)'];

            console.log("1. Obteniendo datos de temperaturas (tu API)...");
            const tempRes = await fetch('/api/v2/average-annual-temperatures');
            if (!tempRes.ok) throw new Error("Fallo al cargar tu API local de temperaturas.");
            const allTemps = await tempRes.json();

            let tempByCountry = {};
            allTemps.forEach(d => {
                if (!tempByCountry[d.country]) tempByCountry[d.country] = [];
                tempByCountry[d.country].push(d.temperature);
            });

            console.log("2. Cruzando con NASA POWER...");
            
            for (const country of countries) {
                if (tempByCountry[country.name]) {
                    const tempsArray = tempByCountry[country.name];
                    const avgTemp = tempsArray.reduce((a, b) => a + b, 0) / tempsArray.length;

                    let radiacionAnual = null;

                    try {
                        const proxyRes = await fetch(`/api/proxy/pablo/nasa-power?lat=${country.lat}&lon=${country.lon}`);
                        
                        if (proxyRes.ok) {
                            const proxyData = await proxyRes.json();
                            if (proxyData.solar_radiation !== undefined) {
                                radiacionAnual = proxyData.solar_radiation;
                            }
                        } else {
                            console.warn(`El Proxy falló para ${country.name}. Llamando a la NASA directamente...`);
                            
                            const nasaUrl = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN&community=re&longitude=${country.lon}&latitude=${country.lat}&format=json`;
                            const nasaRes = await fetch(nasaUrl);
                            
                            if (nasaRes.ok) {
                                const data = await nasaRes.json();
                                const monthly = data.properties.parameter.ALLSKY_SFC_SW_DWN;
                                
                                // Corrección meses NASA
                                const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
                                const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                                
                                let annualSum = 0;
                                months.forEach((month, i) => {
                                    annualSum += (monthly[month] || 0) * daysInMonth[i];
                                });
                                radiacionAnual = Math.round(annualSum);
                            }
                        }

                        if (radiacionAnual !== null) {
                            chartCategories.push(country.name);
                            seriesTemp.push(parseFloat(avgTemp.toFixed(2)));
                            seriesSolar.push(radiacionAnual);
                        }

                    } catch (err) {
                        console.error(`Error de red con la NASA para ${country.name}:`, err);
                    }
                }
            }

            if (chartCategories.length === 0) {
                console.log("❌ No se ha cruzado ningún dato. Activando modo respaldo (Fallback).");
                fallbackActivado = true;
                chartCategories = ["Germany", "Spain", "USA", "China", "France", "Italy"];
                seriesTemp = ['Temperatura Media (ºC)', 10.3, 13.7, 11.6, 8.1, 12.5, 13.5];
                seriesSolar = ['Radiación Solar Anual (kWh/m²)', 1100, 1650, 1540, 1200, 1350, 1580];
            } else {
                console.log("✅ Integración NASA completada con éxito. Países cruzados:", chartCategories.length);
                message = ""; 
            }

            setTimeout(() => {
                window.c3.generate({
                    bindto: '#c3-chart',
                    data: {
                        columns: [seriesSolar, seriesTemp],
                        type: 'bar',
                        types: { 'Temperatura Media (ºC)': 'line' },
                        axes: {
                            'Radiación Solar Anual (kWh/m²)': 'y',
                            'Temperatura Media (ºC)': 'y2'
                        },
                        colors: {
                            'Temperatura Media (ºC)': '#00f2fe',
                            'Radiación Solar Anual (kWh/m²)': '#f59e0b'
                        }
                    },
                    axis: {
                        x: { type: 'category', categories: chartCategories },
                        y: { label: { text: 'Radiación solar (kWh/m²)', position: 'outer-middle' } },
                        y2: { show: true, label: { text: 'Temperatura (ºC)', position: 'outer-middle' } }
                    }
                });
            }, 150);

        } catch (error) {
            console.error(error);
            message = "❌ Error en la integración: " + error.message;
        }
    }
</script>

<svelte:head>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/c3/0.7.20/c3.min.css" rel="stylesheet">
</svelte:head>

<main>
    <a href="/integrations" class="back-btn">⬅ Volver al Panel de Integraciones</a>
    
    <h2>☀️ Radiación Solar vs 🌡️ Temperatura</h2>
    <p class="subtitle">Comparativa usando la API de <b>NASA POWER</b> y <b>C3.js</b></p>

    {#if fallbackActivado}
        <div class="fallback-warning">
            ⚠️ <b>Modo Respaldo Activado:</b> No se pudo conectar ni por Proxy ni Directamente. Mostrando datos de ejemplo.
        </div>
    {/if}

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="card" class:hidden={!!message && !fallbackActivado}>
        <div id="c3-chart" style="height: 450px;"></div>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0; }
    main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    
    h2 { color: #f59e0b; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 2rem; }
    
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 1rem; transition: color 0.2s; }
    .back-btn:hover { color: #f59e0b; }
    
    .card { background: white; border-radius: 15px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
    
    :global(.c3-axis-y text), :global(.c3-axis-y2 text), :global(.c3-axis-x text) {
        font-size: 12px;
    }
    
    .alert {
        background: rgba(0, 242, 254, 0.1);
        border-left: 4px solid #00f2fe;
        padding: 1rem;
        margin-bottom: 1.5rem;
        border-radius: 5px;
        text-align: center;
        color: #00f2fe;
        font-weight: bold;
    }
    
    .fallback-warning {
        background-color: rgba(239, 68, 68, 0.15);
        border: 1px solid #ef4444;
        color: #fca5a5;
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
        font-size: 0.95rem;
        margin-bottom: 1.5rem;
    }
    
    .hidden { display: none; }
    /* --- ARREGLO DEL TOOLTIP DE C3.JS (Modo Oscuro) --- */
    :global(.c3-tooltip) {
        border-collapse: collapse;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 15px rgba(0,0,0,0.5) !important;
    }
    
    /* Cabecera del tooltip (Nombre del país) */
    :global(.c3-tooltip th) {
        background-color: #0f172a !important; 
        color: #00f2fe !important; 
        font-size: 14px;
        padding: 8px 12px !important;
        border-bottom: 2px solid #334155;
    }
    
    /* Filas de datos del tooltip */
    :global(.c3-tooltip td) {
        background-color: #1e293b !important; 
        color: white !important; 
        font-size: 13px;
        padding: 5px 10px !important;
        border-bottom: 1px solid #334155 !important;
    }
    
    /* Columna de los nombres de la variable */
    :global(.c3-tooltip td.name) {
        color: #94a3b8 !important; 
        font-weight: bold;
    }
</style>