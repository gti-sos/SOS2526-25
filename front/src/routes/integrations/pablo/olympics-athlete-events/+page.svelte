<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let chartElement;
    let message = $state("Obteniendo datos de Atletas (G30) y Clima...");
    let chartInstance = null;

    onMount(async () => {
        if (!browser) return;

        // Esperamos a que ECharts se cargue desde el CDN
        const checkEcharts = setInterval(async () => {
            if (window.echarts) {
                clearInterval(checkEcharts);
                await loadAndDraw();
            }
        }, 100);
    });

    async function loadAndDraw() {
        try {
            // 1. Fetch a la API de Pablo (Temperaturas)
            const resTemp = await fetch('/api/v2/average-annual-temperatures');
            
            // 2. Fetch directo a la API del G30 (Olympics) - Atacamos a su backend en Render
            // Su API devuelve hasta 100 registros con el parámetro limit=100
            const resOlympics = await fetch('https://sos2526-30.onrender.com/api/v2/olympics-athlete-events?limit=100');

            if (!resTemp.ok || !resOlympics.ok) throw new Error("Error al conectar con las APIs");

            const dataTemp = await resTemp.json();
            const responseOlympics = await resOlympics.json();
            
            // OJO: Su API devuelve un objeto { data: [...], pagination: {...} }
            const dataOlympics = responseOlympics.data || [];

            // 3. Cruzar datos: Agrupamos los atletas por país (team)
            const athletesCountByCountry = {};
            dataOlympics.forEach(athlete => {
                const country = athlete.team;
                if (!athletesCountByCountry[country]) {
                    athletesCountByCountry[country] = 0;
                }
                athletesCountByCountry[country]++;
            });

            // Creamos la estructura para el Rose Chart
            let roseData = [];

            // Buscamos si tenemos temperatura para los países con atletas
            Object.keys(athletesCountByCountry).forEach(country => {
                // Buscamos el país en los datos de Pablo (ignorando mayúsculas)
                const tempMatch = dataTemp.find(t => t.country.toLowerCase() === country.toLowerCase());

                if (tempMatch) {
                    roseData.push({
                        name: country,
                        value: athletesCountByCountry[country], // El tamaño del trozo será el nº de atletas
                        temperature: tempMatch.temperature,     // Guardamos la temp para mostrarla al pasar el ratón
                        co2: tempMatch.co2_emission
                    });
                }
            });

            if (roseData.length === 0) {
                message = "⚠️ No hay coincidencias exactas de países entre ambas APIs en esta muestra.";
                return;
            }

            message = ""; // Limpiamos mensaje

            // 4. Dibujar la gráfica con Apache ECharts
            chartInstance = window.echarts.init(chartElement);

            const option = {
                title: {
                    text: 'Atletas Olímpicos vs Temperatura',
                    subtext: 'Tamaño: Nº de Atletas registrados',
                    left: 'center',
                    textStyle: { color: '#00f2fe' }
                },
                tooltip: {
                    trigger: 'item',
                    formatter: function (params) {
                        const d = params.data;
                        return `
                            <b>🌍 ${d.name}</b><br/>
                            🏃‍♂️ Atletas: ${d.value}<br/>
                            🌡️ Temperatura: ${d.temperature} ºC<br/>
                            ☁️ CO2: ${d.co2}
                        `;
                    }
                },
                legend: {
                    left: 'center',
                    top: 'bottom',
                    textStyle: { color: '#cbd5e1' }
                },
                series: [
                    {
                        name: 'Atletas y Clima',
                        type: 'pie',
                        radius: [30, 150],
                        center: ['50%', '50%'],
                        roseType: 'area', // Esto lo convierte en un Nightingale Rose Chart
                        itemStyle: {
                            borderRadius: 8
                        },
                        label: {
                            color: '#fff'
                        },
                        data: roseData
                    }
                ]
            };

            chartInstance.setOption(option);

            // Hacer la gráfica responsive si se cambia el tamaño de la ventana
            window.addEventListener('resize', () => {
                chartInstance.resize();
            });

        } catch (error) {
            console.error(error);
            message = "❌ Error en la integración de datos: " + error.message;
        }
    }
</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>
</svelte:head>

<main>
    <a href="/integrations" class="back-btn">⬅ Volver al Panel</a>
    <h2>🏅 Olimpiadas vs Clima (Pablo)</h2>
    <p class="subtitle">Integración con G30 usando <b>Apache ECharts</b> (Nightingale Rose Chart) vía fetch directo.</p>

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="card chart-container" class:hidden={!!message}>
        <div bind:this={chartElement} style="width: 100%; height: 600px;"></div>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0; }
    main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h2 { color: #facc15; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 2rem; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 1rem; }
    .back-btn:hover { color: #facc15; }
    
    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    .alert { background: rgba(250, 204, 21, 0.2); border-left: 4px solid #facc15; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; text-align: center; }
    
    .chart-container { position: relative; width: 100%; }
    .hidden { display: none; }
</style>