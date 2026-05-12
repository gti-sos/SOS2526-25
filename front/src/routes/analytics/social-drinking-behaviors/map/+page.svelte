<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let chartContainer;
    let message = $state("🌍 Cargando mapa interactivo...");
    let topology; 
    let Highcharts; 

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

    // DICCIONARIO AMPLIADO: Mapea nombres de tu API -> Nombres oficiales de Highcharts
    const nameFixes = {
        "usa": "United States of America",
        "united states": "United States of America",
        "eeuu": "United States of America",
        "uk": "United Kingdom",
        "great britain": "United Kingdom",
        "czechia": "Czech Republic",
        "republic of korea": "South Korea",
        "korea, south": "South Korea",
        "russia": "Russian Federation",
        "russian federation": "Russia",
        "syria": "Syrian Arab Republic",
        "vietnam": "Viet Nam",
        "iran": "Iran (Islamic Republic of)",
        "venezuela": "Venezuela (Bolivarian Republic of)",
        "congo dr": "Democratic Republic of the Congo",
        "congo, dem. rep.": "Democratic Republic of the Congo"
    };

    onMount(async () => {
        if (browser) {
            const checkHighcharts = setInterval(async () => {
                if (window.Highcharts && window.Highcharts.mapChart) {
                    clearInterval(checkHighcharts);
                    Highcharts = window.Highcharts;

                    try {
                        const topoRes = await fetch('https://code.highcharts.com/mapdata/custom/world.topo.json');
                        topology = await topoRes.json();
                        
                        // CHIVATO: Descomenta esto para ver en consola qué nombres espera el mapa
                        // console.log("Nombres válidos en el mapa:", topology.objects.default.geometries.map(g => g.properties.name));
                        
                        await updateMap();
                    } catch (error) {
                        message = "❌ Error al cargar el mapamundi base.";
                    }
                }
            }, 100);
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
                Highcharts.mapChart(chartContainer, { series: [] });
                return;
            }

            // PROCESAMIENTO DE DATOS: Limpiamos y traducimos nombres
            const chartData = drinksData.map(drink => {
                const rawName = drink.country.trim();
                const normalized = rawName.toLowerCase();
                
                // Si el nombre está en nuestro diccionario, lo cambiamos, si no, lo dejamos igual
                const finalName = nameFixes[normalized] || rawName;

                return {
                    name: finalName, 
                    value: drink[selectedMetric],
                    custom: drink 
                };
            });

            message = `✅ Datos de ${drinksData.length} países listos.`;

            Highcharts.mapChart(chartContainer, {
                chart: {
                    map: topology,
                    backgroundColor: 'transparent'
                },
                title: {
                    text: `Distribución de ${metricNames[selectedMetric]} (${selectedYear})`,
                    style: { color: '#00f2fe', fontWeight: 'bold' }
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
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    style: { color: '#ffffff' },
                    formatter: function () {
                        if (!this.point.custom) return `<b>${this.point.name}</b><br>Sin registros`;
                        
                        const d = this.point.custom;
                        return `
                            <div style="text-align: center; padding: 5px;">
                                <h3 style="margin: 0 0 5px 0; color: #00f2fe;">${d.country}</h3>
                                <hr style="border-color: rgba(255,255,255,0.1)">
                                <b>💧 Totales:</b> ${d.total_liter} L<br>
                                <b>🍺 Cerveza:</b> ${d.beer_share}%<br>
                                <b>🍷 Vino:</b> ${d.wine_share}%<br>
                                <b>🥃 Licores:</b> ${d.spirit_share}%
                            </div>
                        `;
                    }
                },
                series: [{
                    data: chartData,
                    joinBy: ['name', 'name'], // Compara el 'name' del mapa con el 'name' de nuestro JSON
                    name: metricNames[selectedMetric],
                    states: {
                        hover: {
                            color: '#ffffff',
                            borderColor: '#a855f7'
                        }
                    },
                    dataLabels: {
                        enabled: false
                    }
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
    
    <h2>🗺️ Análisis Geográfico de Consumo</h2>
    
    <div class="controls card">
        <div class="input-group">
            <label for="year">Año:</label>
            <input type="number" id="year" bind:value={selectedYear} min="1900" max="2026">
            
            <label for="metric">Métrica:</label>
            <select id="metric" bind:value={selectedMetric}>
                <option value="total_liter">Litros Totales</option>
                <option value="beer_share">% de Cerveza</option>
                <option value="wine_share">% de Vino</option>
                <option value="spirit_share">% de Licores</option>
            </select>
            
            <button class="btn-update" onclick={updateMap}>Actualizar Mapa</button>
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
    :global(body) { margin: 0; background-color: #0f172a; color: white; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    main { max-width: 1100px; margin: 0 auto; padding: 2rem; }
    h2 { text-align: center; color: #00f2fe; margin-bottom: 2rem; font-size: 2rem; text-transform: uppercase; letter-spacing: 2px; }
    
    .back-btn { display: inline-block; margin-bottom: 1.5rem; color: #94a3b8; text-decoration: none; font-weight: bold; transition: 0.3s; }
    .back-btn:hover { color: #00f2fe; transform: translateX(-5px); }

    .controls .input-group { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 1.5rem; }
    
    label { font-weight: bold; color: #94a3b8; font-size: 0.9rem; }
    
    input, select { 
        padding: 0.8rem; 
        border-radius: 8px; 
        border: 1px solid rgba(255, 255, 255, 0.1); 
        background: rgba(15, 23, 42, 0.6); 
        color: white; 
        outline: none; 
        transition: 0.3s;
    }
    
    input:focus, select:focus { border-color: #00f2fe; box-shadow: 0 0 10px rgba(0, 242, 254, 0.2); }

    .btn-update { 
        background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); 
        color: white; 
        border: none; 
        padding: 0.8rem 2rem; 
        border-radius: 8px; 
        cursor: pointer; 
        font-weight: bold; 
        box-shadow: 0 4px 15px rgba(168, 85, 247, 0.3);
        transition: 0.3s; 
    }
    
    .btn-update:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(168, 85, 247, 0.5); }

    .alert { 
        background: rgba(0, 242, 254, 0.1); 
        border: 1px solid rgba(0, 242, 254, 0.3);
        color: #00f2fe; 
        padding: 1rem; 
        margin-bottom: 1.5rem; 
        border-radius: 10px; 
        text-align: center; 
        font-weight: 500;
    }

    .card { 
        background: rgba(30, 41, 59, 0.5); 
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1); 
        border-radius: 20px; 
        padding: 2rem; 
        box-shadow: 0 10px 30px rgba(0,0,0,0.5); 
        margin-bottom: 2.5rem; 
    }

    .map-container { height: 650px; width: 100%; border-radius: 15px; }

    /* Estilos para el tooltip de Highcharts */
    :global(.highcharts-tooltip-box) { fill: rgba(15, 23, 42, 0.9); stroke-width: 1px; stroke: #00f2fe; }
</style>