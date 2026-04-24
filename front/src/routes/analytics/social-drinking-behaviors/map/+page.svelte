<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let chartContainer;
    let message = $state("🌍 Cargando mapa interactivo...");
    let topology; 
    let Highcharts; // La variable que llenaremos desde la web

    // Controles interactivos
    let selectedYear = $state(2020); 
    let selectedMetric = $state("total_liter"); 

    const metricNames = {
        "total_liter": "Litros Totales",
        "beer_share": "% de Cerveza",
        "wine_share": "% de Vino",
        "spirit_share": "% de Licores"
    };

    const API_URL = "/api/v2/social-drinking-behaviors";

    onMount(async () => {
        if (browser) {
            // ESPERAMOS a que los scripts de <svelte:head> se descarguen e instalen en la ventana
            const checkHighcharts = setInterval(async () => {
                if (window.Highcharts && window.Highcharts.mapChart) {
                    clearInterval(checkHighcharts); // Ya se ha cargado
                    Highcharts = window.Highcharts;

                    // Descargamos el dibujo del mapamundi oficial
                    try {
                        const topoRes = await fetch('https://code.highcharts.com/mapdata/custom/world.topo.json');
                        topology = await topoRes.json();
                        
                        await updateMap();
                    } catch (error) {
                        message = "❌ Error al cargar el mapamundi base.";
                    }
                }
            }, 100); // Comprueba cada 100ms si la librería ya está lista
        }
    });

    async function updateMap() {
        if (!browser || !topology || !Highcharts) return;
        message = `Buscando datos de ${selectedYear}...`;

        try {
            const res = await fetch(`${API_URL}?year=${selectedYear}`);
            if (!res.ok) throw new Error("Fallo al contactar con la API.");
            const drinksData = await res.json();

            if (drinksData.length === 0) {
                message = `⚠️ No hay datos registrados en el año ${selectedYear}.`;
                Highcharts.mapChart(chartContainer, { series: [] }); // Vacía el mapa
                return;
            }

            message = `✅ Mostrando datos de ${drinksData.length} países.`;

            // Arreglo de nombres para que encajen con el mapa oficial
            const nameFixes = {
                "USA": "United States of America",
                "Syrian Arab Republic": "Syria",
                "Czechia": "Czech Republic"
            };

            const chartData = drinksData.map(drink => ({
                name: nameFixes[drink.country] || drink.country, 
                value: drink[selectedMetric],
                custom: drink 
            }));

            // Dibujamos el mapa
            Highcharts.mapChart(chartContainer, {
                chart: {
                    map: topology,
                    backgroundColor: 'transparent'
                },
                title: {
                    text: `Mapa de ${metricNames[selectedMetric]} en ${selectedYear}`,
                    style: { color: '#00f2fe' }
                },
                mapNavigation: {
                    enabled: true,
                    buttonOptions: { verticalAlign: 'bottom' }
                },
                colorAxis: {
                    min: 0,
                    stops: [
                        [0, '#1e293b'], 
                        [0.5, '#a855f7'], 
                        [1, '#00f2fe']  
                    ]
                },
                tooltip: {
                    useHTML: true,
                    formatter: function () {
                        if (!this.point.custom) return `<b>${this.point.name}</b><br>Sin datos en ${selectedYear}`;
                        
                        const d = this.point.custom;
                        return `
                            <div style="text-align: center; padding: 5px;">
                                <h3 style="margin: 0 0 5px 0; color: #a855f7;">${d.country}</h3>
                                <b>💧 L. Totales:</b> ${d.total_liter} L<br>
                                <b>🍺 Cerveza:</b> ${d.beer_share}%<br>
                                <b>🍷 Vino:</b> ${d.wine_share}%<br>
                                <b>🥃 Licores:</b> ${d.spirit_share}%
                            </div>
                        `;
                    }
                },
                series: [{
                    data: chartData,
                    joinBy: ['name', 'name'], 
                    name: metricNames[selectedMetric],
                    states: { hover: { color: '#ffffff' } },
                    dataLabels: { enabled: false }
                }],
                credits: { enabled: false }
            });

        } catch (error) {
            message = `❌ Error: No se pudo cargar la información.`;
            console.error(error);
        }
    }
</script>

<svelte:head>
    <script src="https://code.highcharts.com/maps/highmaps.js"></script>
    <script src="https://code.highcharts.com/maps/modules/exporting.js"></script>
</svelte:head>

<main>
    <a href="/analytics/social-drinking-behaviors" class="back-btn">⬅ Volver a mis Gráficas</a>
    
    <h2>🗺️ Mapa Highcharts (Juanlu)</h2>
    
    <div class="controls card">
        <div class="input-group">
            <label for="year">Año:</label>
            <input type="number" id="year" bind:value={selectedYear}>
            
            <label for="metric">Colorear mapa según:</label>
            <select id="metric" bind:value={selectedMetric}>
                <option value="total_liter">Litros Totales</option>
                <option value="beer_share">% de Cerveza</option>
                <option value="wine_share">% de Vino</option>
                <option value="spirit_share">% de Licores</option>
            </select>
            
            <button class="btn-update" onclick={updateMap}>Pintar Mapa</button>
        </div>
    </div>

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="card map-container-box">
        <div class="map-container" bind:this={chartContainer}></div>
    </div>
</main>

<style>
    /* ... Tus mismos estilos exactos de antes ... */
    :global(body) { margin: 0; background-color: #0f172a; color: white; font-family: sans-serif; }
    main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h2 { text-align: center; color: #00f2fe; margin-bottom: 2rem; }
    .back-btn { display: inline-block; margin-bottom: 1rem; color: #94a3b8; text-decoration: none; font-weight: bold; }
    .controls .input-group { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 1rem; }
    label { font-weight: bold; color: #94a3b8; }
    input, select { padding: 0.8rem; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(0, 0, 0, 0.3); color: white; outline: none; cursor: pointer; }
    select option { background: #0f172a; color: white; }
    .btn-update { background: #a855f7; color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.2s; }
    .btn-update:hover { filter: brightness(1.2); }
    .alert { background: rgba(0, 242, 254, 0.2); border-left: 4px solid #00f2fe; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; text-align: center; }
    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.3); margin-bottom: 2rem; }
    .map-container { height: 600px; width: 100%; border-radius: 10px; }
</style>