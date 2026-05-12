<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Cruzando emisiones de CO2 con el PIB Mundial...");
    let fallbackActivado = $state(false);

    onMount(async () => {
        if (!browser) return;

        // Cargamos Highcharts
        const script = document.createElement('script');
        script.src = "https://code.highcharts.com/highcharts.js";
        script.onload = () => {
            loadAndDraw();
        };
        document.head.appendChild(script);
    });

    async function loadAndDraw() {
        try {
            const origin = browser ? window.location.origin : '';
            
            // 1. Fetch a tu API (Temperaturas y CO2)
            const resTemp = await fetch(`${origin}/api/v2/average-annual-temperatures`);
            let dataTemp = resTemp.ok ? await resTemp.json() : [];

            // 2. Fetch a la API EXTERNA (Banco Mundial)
            // Pedimos el PIB (NY.GDP.MKTP.CD) del año 2021 para España, USA, China, Alemania y Francia
            let wbData = [];
            try {
                const resWB = await fetch('https://api.worldbank.org/v2/country/es;us;cn;de;fr/indicator/NY.GDP.MKTP.CD?format=json&date=2021');
                if (resWB.ok) {
                    const jsonWB = await resWB.json();
                    // El Banco Mundial devuelve la info en la posición [1] del array
                    if (jsonWB && jsonWB[1]) {
                        wbData = jsonWB[1];
                    }
                }
            } catch(e) { console.warn("Fallo al conectar con el Banco Mundial."); }

            let categories = [];
            let seriesCO2 = [];
            let seriesPIB = [];

            // Cruzamos los datos
            if (dataTemp.length > 0 && wbData.length > 0) {
                // Filtramos tus datos para coger el año 2021
                const myData2021 = dataTemp.filter(d => d.year == 2021);

                wbData.forEach(wbItem => {
                    const countryName = wbItem.country.value; // Ej: "Spain", "Germany"
                    const pibEnBillones = wbItem.value / 1000000000000; // Pasamos a Billones (Trillions en inglés) para que sea legible

                    // Buscamos si tenemos ese país en nuestros datos de 2021
                    const myCountryMatch = myData2021.find(d => d.country.toLowerCase() === countryName.toLowerCase());

                    if (myCountryMatch && pibEnBillones > 0) {
                        categories.push(countryName);
                        seriesCO2.push(myCountryMatch.co2_emission);
                        seriesPIB.push(parseFloat(pibEnBillones.toFixed(2)));
                    }
                });
            }

            // MODO DE RESPALDO (Fallback)
            if (categories.length === 0) {
                fallbackActivado = true;
                categories = ["Germany", "Spain", "China", "USA"];
                seriesCO2 = [679, 230, 12.7, 4800]; // Tus datos reales de 2021
                seriesPIB = [4.26, 1.44, 17.73, 23.32]; // PIB en billones de USD aprox en 2021
            }

            message = ""; 

            setTimeout(() => {
                window.Highcharts.chart('highcharts-container', {
                    chart: { type: 'column', backgroundColor: 'transparent' },
                    title: { 
                        text: 'Riqueza (PIB) vs Emisiones de CO2 (2021)',
                        style: { color: '#cbd5e1' }
                    },
                    xAxis: { 
                        categories: categories,
                        labels: { style: { color: '#94a3b8' } }
                    },
                    yAxis: [{
                        title: { text: 'Emisiones CO2 (Millones de tons)', style: { color: '#ef4444' } },
                        labels: { style: { color: '#ef4444' } }
                    }, {
                        title: { text: 'PIB (Billones USD $)', style: { color: '#10b981' } },
                        labels: { style: { color: '#10b981' } },
                        opposite: true // Ponemos este eje a la derecha
                    }],
                    legend: { itemStyle: { color: '#cbd5e1' } },
                    series: [{
                        name: 'Emisiones CO2',
                        type: 'column',
                        yAxis: 0,
                        data: seriesCO2,
                        color: '#ef4444' // Rojo peligro
                    }, {
                        name: 'PIB (Banco Mundial)',
                        type: 'spline', // Línea suavizada
                        yAxis: 1,
                        data: seriesPIB,
                        color: '#10b981', // Verde dinero
                        marker: { lineWidth: 2, lineColor: '#10b981', fillColor: 'white' }
                    }]
                });
            }, 100);

        } catch (error) { 
            message = "❌ Error en la integración: " + error.message; 
        }
    }
</script>

<main>
    <a href="/integrations" class="back-btn" data-sveltekit-reload>⬅ Volver al Panel</a>
    <h2>🏦 Economía vs Clima (Pablo)</h2>
    <p class="subtitle">Integración con <b>World Bank API</b> usando <b>Highcharts</b>.</p>

    {#if fallbackActivado}
        <div class="fallback-warning">
            ⚠️ Modo Respaldo activado. Usando datos simulados del Banco Mundial.
        </div>
    {/if}

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="card" class:hidden={!!message}>
        <div id="highcharts-container" style="height: 450px; width: 100%;"></div>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0; }
    main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h2 { color: #10b981; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 2rem; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 1rem; }
    .back-btn:hover { color: #10b981; }
    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    .alert { background: rgba(16, 185, 129, 0.2); border-left: 4px solid #10b981; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; text-align: center; color: #10b981; font-weight: bold;}
    .fallback-warning { background-color: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 0.8rem; border-radius: 8px; text-align: center; margin-bottom: 1.5rem; }
    .hidden { display: none; }
</style>