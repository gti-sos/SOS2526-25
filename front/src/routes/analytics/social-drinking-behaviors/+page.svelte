<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';

    let chartContainer;
    let message = $state("");

    // Variables interactivas para el usuario (Por defecto 2019 y Litros)
    let selectedYear = $state(2019); 
    let selectedMetric = $state("total_liter"); 

    // Diccionario para que los títulos de la gráfica queden bonitos
    const metricNames = {
        "total_liter": "Litros Totales",
        "beer_share": "% de Cerveza",
        "wine_share": "% de Vino",
        "spirit_share": "% de Licores"
    };

    const API_URL = "/api/v2/social-drinking-behaviors";

    onMount(async () => {
        await updateChart();
    });

    async function updateChart() {
        message = "Cargando datos...";
        try {
            // Buscamos TODOS los países que tengan datos en el año seleccionado
            const res = await fetch(`${API_URL}?year=${selectedYear}`);
            
            if (res.ok) {
                const data = await res.json();
                
                if (data.length > 0) {
                    message = ""; // Quitamos el mensaje de carga
                    drawChart(data);
                } else {
                    message = `⚠️ No hay países registrados en el año ${selectedYear}.`;
                    // Vaciamos la gráfica si no hay datos
                    Highcharts.chart(chartContainer, { series: [] }); 
                }
            } else {
                message = "❌ Error al cargar los datos de la API.";
            }
        } catch (error) {
            message = "⚠️ Error de conexión con el servidor.";
        }
    }

    function drawChart(data) {
        // LA MAGIA: Convertimos el array de tu API al formato de trozos de quesito
        const chartData = data.map(item => {
            return {
                name: item.country, // El nombre del país es la etiqueta
                y: item[selectedMetric] // El valor depende del desplegable que eligió el usuario
            };
        });

        Highcharts.chart(chartContainer, {
            chart: {
                type: 'pie', 
                backgroundColor: 'transparent'
            },
            title: {
                text: `Comparativa de ${metricNames[selectedMetric]} por País en ${selectedYear}`,
                style: { color: '#00f2fe' }
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.y}</b>'
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.y}',
                        style: { color: 'white', textOutline: 'none' }
                    }
                }
            },
            series: [{
                name: metricNames[selectedMetric],
                colorByPoint: true,
                data: chartData // Le inyectamos los datos transformados
            }],
            credits: {
                enabled: false
            }
        });
    }
</script>

<main>
    <a href="/social-drinking-behaviors" class="back-btn">⬅ Volver a la Tabla</a>
    
    <h2>📊 Visualización Dinámica (Juanlu)</h2>
    
    <div class="controls card">
        <div class="input-group">
            <label for="year">Año:</label>
            <input type="number" id="year" bind:value={selectedYear}>
            
            <label for="metric">Dato a comparar:</label>
            <select id="metric" bind:value={selectedMetric}>
                <option value="total_liter">Litros Totales</option>
                <option value="beer_share">% de Cerveza</option>
                <option value="wine_share">% de Vino</option>
                <option value="spirit_share">% de Licores</option>
            </select>
            
            <button class="btn-update" onclick={updateChart}>Actualizar Gráfica</button>
        </div>
    </div>

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="chart-box" bind:this={chartContainer}></div>
</main>

<style>
    :global(body) { margin: 0; background-color: #0f172a; color: white; font-family: sans-serif; }
    main { max-width: 900px; margin: 0 auto; padding: 2rem; }
    h2 { text-align: center; color: #00f2fe; margin-bottom: 2rem; }
    .back-btn { display: inline-block; margin-bottom: 1rem; color: #94a3b8; text-decoration: none; font-weight: bold; }
    
    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 1.5rem; margin-bottom: 2rem; backdrop-filter: blur(10px); }
    .controls .input-group { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 1rem; }
    
    label { font-weight: bold; color: #94a3b8; }
    input, select { padding: 0.8rem; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(0, 0, 0, 0.3); color: white; outline: none; cursor: pointer; }
    select option { background: #0f172a; color: white; } /* Para que las opciones del desplegable se lean bien */
    
    .btn-update { background: #a855f7; color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.2s; }
    .btn-update:hover { filter: brightness(1.2); }

    .alert { background: rgba(255, 193, 7, 0.2); border-left: 4px solid #ffc107; color: #ffc107; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; text-align: center; }
    
    .chart-box {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        padding: 2rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        height: 550px; 
    }
</style>