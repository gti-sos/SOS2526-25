<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Cargando visualización profesional con Highcharts...");
    let chartContainer;
    let chartInstance;
    let datosCompletos = $state([]); 
    
    let availableYears = $state([]);
    let selectedYear = $state("");

    async function safeJson(res) {
        try { return res.ok ? await res.json() : []; } catch { return []; }
    }

    onMount(async () => {
        if (!browser) return;

        try {
            // Cargamos tus datos locales (country, year, beer_share, wine_share, spirits_share, etc.)
            const resMis = await fetch("/api/v2/social-drinking-behaviors");
            const misDatos = await safeJson(resMis);

            if (misDatos.length === 0) {
                message = "⚠️ No hay datos en tu API local.";
                return;
            }

            // Extraemos años únicos para el desplegable
            const years = [...new Set(misDatos.map(d => String(d.year)))];
            availableYears = years.sort().reverse();
            selectedYear = availableYears[0];

            datosCompletos = misDatos;
            message = "";

            esperarYRenderizar();

        } catch (error) {
            console.error(error);
            message = "Error crítico cargando Highcharts.";
        }
    });

    function esperarYRenderizar() {
        const check = setInterval(() => {
            if (window.Highcharts && chartContainer) {
                clearInterval(check);
                dibujarGrafica();
            }
        }, 100);
    }

    // Reactividad: Si cambia el año, redibujamos
    $effect(() => {
        if (selectedYear && datosCompletos.length > 0 && browser && window.Highcharts) {
            dibujarGrafica();
        }
    });

    function dibujarGrafica() {
        if (!window.Highcharts || !chartContainer) return;

        // Filtramos por año seleccionado
        const filtrados = datosCompletos.filter(d => String(d.year) === selectedYear);
        
        // Ordenamos por consumo total (litros) para que sea estético
        filtrados.sort((a, b) => (Number(b.total_liter) || 0) - (Number(a.total_liter) || 0));

        const categoriasPaises = filtrados.map(d => d.country);
        const serieCerveza = filtrados.map(d => Number(d.beer_share) || 0);
        const serieVino = filtrados.map(d => Number(d.wine_share) || 0);
        const serieLicores = filtrados.map(d => Number(d.spirit_share) || 0);

        chartInstance = window.Highcharts.chart(chartContainer, {
            chart: {
                type: 'bar', // Barras horizontales
                backgroundColor: 'transparent',
                height: Math.max(500, categoriasPaises.length * 40) // Ajuste dinámico según nº de países
            },
            title: {
                text: `Consumo de Alcohol por País (${selectedYear})`,
                style: { color: '#ffffff' }
            },
            xAxis: {
                categories: categoriasPaises,
                labels: { style: { color: '#cbd5e1' } },
                lineColor: '#334155'
            },
            yAxis: {
                min: 0,
                max: 100,
                title: { text: 'Porcentaje del total (%)', style: { color: '#cbd5e1' } },
                labels: { style: { color: '#cbd5e1' } },
                gridLineColor: '#334155'
            },
            legend: {
                itemStyle: { color: '#cbd5e1' },
                itemHoverStyle: { color: '#ffffff' }
            },
            tooltip: {
                shared: true,
                backgroundColor: '#1e293b',
                style: { color: '#ffffff' },
                pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}%</b><br/>'
            },
            plotOptions: {
                series: {
                    stacking: 'normal', // Apilado para ver el desglose
                    dataLabels: {
                        enabled: true,
                        color: '#ffffff',
                        format: '{point.y}%' // Muestra los datos numéricos directamente en la barra
                    }
                }
            },
            series: [{
                name: 'Cerveza',
                data: serieCerveza,
                color: '#facc15'
            }, {
                name: 'Vino',
                data: serieVino,
                color: '#ef4444'
            }, {
                name: 'Licores',
                data: serieLicores,
                color: '#3b82f6'
            }]
        });
    }
</script>

<svelte:head>
    <!-- Cargamos Highcharts desde su CDN oficial -->
    <script src="https://code.highcharts.com/highcharts.js"></script>
    <script src="https://code.highcharts.com/modules/exporting.js"></script>
</svelte:head>

<main>
    <div class="header-nav">
        <a href="/integrations/juan-luis" class="back-btn">⬅ Volver a Integraciones</a>
    </div>

    <div class="card">
        <div class="top-bar">
            <h2>📊 Desglose de Consumo (Highcharts)</h2>
            <p class="desc">
                Visualización detallada de las cuotas de alcohol. Las barras muestran el porcentaje relativo de cada tipo de bebida por país.
            </p>
        </div>

        {#if message}
            <div class="loading-state">{message}</div>
        {:else}
            <div class="controls">
                <label for="yearSelector">📅 Seleccionar Año:</label>
                <select id="yearSelector" bind:value={selectedYear}>
                    {#each availableYears as yr}
                        <option value={yr}>Año {yr}</option>
                    {/each}
                </select>
                <span class="badge">{availableYears.length} Años disponibles</span>
            </div>

            <div class="chart-box">
                <!-- Contenedor del gráfico -->
                <div bind:this={chartContainer}></div>
            </div>
        {/if}
    </div>
</main>

<style>
    :global(body) { background: #0f172a; color: white; margin: 0; font-family: sans-serif; }
    main { padding: 2rem; max-width: 1100px; margin: auto; }
    .header-nav { margin-bottom: 2rem; }
    .back-btn { color: #facc15; text-decoration: none; border: 1px solid #facc15; padding: 0.5rem 1rem; border-radius: 8px; font-weight: bold; transition: 0.3s; }
    .back-btn:hover { background: rgba(250, 204, 21, 0.2); }
    .card { background: #1e293b; padding: 2rem; border-radius: 20px; border: 1px solid #334155; }
    .top-bar h2 { color: #facc15; margin: 0 0 0.5rem 0; }
    .desc { color: #94a3b8; margin-bottom: 1.5rem; line-height: 1.5; }
    .controls { background: #0b1120; padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem; }
    select { background: #1e293b; color: #facc15; padding: 0.5rem; border-radius: 5px; border: 1px solid #facc15; font-weight: bold; }
    .badge { color: #64748b; font-size: 0.9rem; }
    .loading-state { color: #facc15; padding: 2rem; text-align: center; }
    .chart-box { 
        background: #0b1120; 
        border-radius: 12px; 
        padding: 1rem; 
        border: 1px solid #334155;
        max-height: 700px;
        overflow-y: auto; /* Para poder ver todos los países si hay muchos */
    }
</style>