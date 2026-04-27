<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';

    let chartContainer;
    let message = $state("Cargando datos..."); 
    
    // Añadimos el control para el año
    let selectedYear = $state(2020); 

    onMount(async () => {
        await updateChart();
    });

    async function updateChart() {
        message = `Cargando datos del año ${selectedYear}...`;
        try {
            // 1. Pedimos SOLO los datos del año seleccionado
            const res = await fetch(`/api/v2/social-drinking-behaviors?year=${selectedYear}`);
            let data = await res.json();
            
            if (data.length === 0) {
                 message = `⚠️ No hay datos para el año ${selectedYear}.`;
                 Highcharts.chart(chartContainer, { series: [] }); // Vaciamos si no hay nada
                 return;
            }
            
            message = "";

            // 2. Ordenamos alfabéticamente para que sea fácil buscar un país
            data.sort((a, b) => a.country.localeCompare(b.country));

            // Extraemos los datos numéricos (¡AQUÍ ESTÁN TODOS AHORA!)
            const countries = data.map(d => d.country);
            const beer = data.map(d => d.beer_share);
            const wine = data.map(d => d.wine_share);
            const spirit = data.map(d => d.spirit_share);
            const total = data.map(d => d.total_liter); 
            Highcharts.chart(chartContainer, {
                chart: { 
                    type: 'bar',
                    backgroundColor: 'transparent',
                    scrollablePlotArea: {
                        // Aumentamos un pelín el alto mínimo porque ahora hay 4 barras por país
                        minHeight: data.length * 45, 
                        scrollPositionX: 0
                    }
                }, 
                title: { 
                    text: `Preferencias de Consumo de Alcohol en ${selectedYear}`,
                    style: { color: '#00f2fe' } 
                },
                xAxis: { 
                    categories: countries, 
                    title: { text: null },
                    labels: { style: { color: '#94a3b8', fontSize: '13px' } }, 
                    lineColor: '#334155',
                    tickColor: '#334155'
                },
                yAxis: { 
                    min: 0, 
                    title: { 
                        // 🚀 NUEVO: Cambiamos el título para que tenga sentido con los dos tipos de datos
                        text: 'Valores (% de Preferencia y Litros Per Cápita)', 
                        align: 'high',
                        style: { color: '#94a3b8' } 
                    },
                    labels: { style: { color: '#94a3b8' } },
                    gridLineColor: '#1e293b',
                    opposite: true 
                },
                plotOptions: { 
                    bar: { 
                        pointPadding: 0.1, 
                        groupPadding: 0.1,
                        dataLabels: { 
                            enabled: true,
                            style: { color: 'white', textOutline: 'none', fontWeight: 'normal' } 
                        },
                        borderWidth: 0 
                    } 
                },
                legend: { 
                    layout: 'horizontal', 
                    align: 'center', 
                    verticalAlign: 'bottom',
                    itemStyle: { color: 'white', fontWeight: 'bold' }, 
                    itemHoverStyle: { color: '#00f2fe' } 
                },
                credits: { enabled: false },
                // 🚀 NUEVO: Hemos añadido un cuarto color (Cian neón) para los Litros Totales
                colors: ['#00f2fe', '#f59e0b', '#9d174d', '#3b82f6'], 
                series: [
                    // 🚀 NUEVO: Añadimos la serie de Litros a la gráfica
                    { name: 'Litros Totales (L)', data: total }, 
                    { name: 'Cerveza (%)', data: beer },
                    { name: 'Vino (%)', data: wine },
                    { name: 'Licores (%)', data: spirit }
                ]
            });
        } catch (error) {
            message = "❌ Error al cargar la gráfica.";
            console.error(error);
        }
    }
</script>

<main>
    <a href="/social-drinking-behaviors" class="back-btn">⬅ Volver a la Tabla</a>
    
    <h2>📊 Analíticas de Bebidas (Juanlu)</h2>

    <div class="controls card">
        <div class="input-group">
            <label for="year">Filtrar por Año:</label>
            <input type="number" id="year" bind:value={selectedYear}>
            <button class="btn-update" onclick={updateChart}>Actualizar Gráfica</button>
        </div>
    </div>
    
    {#if message}
        <div class="alert">{message}</div>
    {/if}
    
    <div class="card">
        <div class="chart-box" bind:this={chartContainer}></div>
    </div>
</main>

<style>
    :global(body) { margin: 0; background-color: #0f172a; color: white; font-family: sans-serif; }
    main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h2 { text-align: center; color: #00f2fe; margin-bottom: 2rem; }
    .back-btn { display: inline-block; margin-bottom: 1rem; color: #94a3b8; text-decoration: none; font-weight: bold; }
    
    .controls .input-group { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 1rem; }
    label { font-weight: bold; color: #94a3b8; }
    input { padding: 0.8rem; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(0, 0, 0, 0.3); color: white; outline: none; text-align: center; width: 100px; }
    .btn-update { background: #a855f7; color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.2s; }
    .btn-update:hover { filter: brightness(1.2); }

    .alert { background: rgba(0, 242, 254, 0.2); border-left: 4px solid #00f2fe; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; text-align: center; }
    
    .card { 
        background: rgba(255, 255, 255, 0.05); 
        border: 1px solid rgba(255, 255, 255, 0.1); 
        border-radius: 15px; 
        padding: 1.5rem; 
        box-shadow: 0 4px 6px rgba(0,0,0,0.3); 
        margin-bottom: 2rem;
    }
    
    .chart-box {
        width: 100%;
        height: 600px; 
        overflow: hidden; 
    }
</style>