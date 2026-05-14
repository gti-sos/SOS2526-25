<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Cargando datos de temperaturas...");
    let chartContainer;
    let chartInstance;
    let Highcharts;

    let datosCompletos = $state([]);
    let availableYears = $state([]);
    let selectedYear = $state("");

    onMount(async () => {
        if (!browser) return;

        try {
            // 🚀 FIX SSR: Descargamos Highcharts solo en el cliente
            const HighchartsModule = await import('highcharts');
            Highcharts = HighchartsModule.default;

            // Llamada a la API de Temperaturas
            const res = await fetch('/api/v2/average-annual-temperatures');
            if (!res.ok) throw new Error("Fallo al obtener datos de la API");
            
            const data = await res.json();

            if (data.length === 0) {
                message = "⚠️ No hay datos en la base de datos.";
                return;
            }

            let tempYears = new Set();
            data.forEach(d => {
                if (d.year) tempYears.add(d.year.toString());
            });

            datosCompletos = data;
            // Ordenamos los años de más reciente a más antiguo
            availableYears = Array.from(tempYears).sort().reverse();
            selectedYear = availableYears[0];
            message = "";

        } catch (error) {
            console.error(error);
            message = "❌ Error al conectar con la API.";
        }
    });

    // Efecto reactivo: Se actualiza solo al cambiar el año en el desplegable
    $effect(() => {
        if (selectedYear && datosCompletos.length > 0 && browser && chartContainer && Highcharts) {
            dibujarGrafica();
        }
    });

    function dibujarGrafica() {
        // 1. Filtramos los datos por el año seleccionado
        let datosFiltrados = datosCompletos
            .filter(d => d.year.toString() === selectedYear)
            .map(d => ({
                name: d.country,
                y: Number(d.temperature),
                co2: d.co2_emission // Guardamos el CO2 extra para mostrarlo en el tooltip
            }));

        // 2. Opciones de configuración para el Semi-Circle Donut
        const options = {
            chart: {
                type: 'pie', // El medio donut es un pie chart modificado
                backgroundColor: '#1e293b',
                borderRadius: 12
            },
            title: {
                text: `Temperaturas Medias Anuales (${selectedYear})`,
                style: { color: '#38bdf8', fontWeight: 'bold' }
            },
            tooltip: {
                // Personalizamos el cuadro flotante
                pointFormat: 'Temperatura: <b>{point.y} °C</b><br>Emisiones CO2: <b>{point.co2}</b>'
            },
            plotOptions: {
                pie: {
                    dataLabels: {
                        enabled: true,
                        distance: -30, // Mete las etiquetas dentro del gráfico
                        style: {
                            fontWeight: 'bold',
                            color: 'white',
                            textOutline: 'none',
                            fontSize: '12px'
                        },
                        formatter: function() {
                            // Solo mostramos el nombre si la porción es mayor al 4% para no saturar
                            return this.percentage > 4 ? this.point.name : null;
                        }
                    },
                    startAngle: -90, // Lo corta por la izquierda
                    endAngle: 90,    // Lo corta por la derecha (hace el semicírculo)
                    center: ['50%', '75%'], // Lo baja para que ocupe bien el espacio
                    size: '110%',
                    innerSize: '50%', // Le hace el agujero en el medio (Donut)
                    colors: ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef']
                }
            },
            series: [{
                name: 'Temperatura',
                data: datosFiltrados
            }],
            credits: { enabled: false }
        };

        if (chartInstance) {
            chartInstance.update(options, true, true);
        } else {
            chartInstance = Highcharts.chart(chartContainer, options);
        }
    }
</script>

<main>
    <div class="header-nav">
        <!-- Ajusta este enlace a tu ruta de integraciones si es necesario -->
        <a href="/integrations" class="back-btn">⬅ Volver a Integraciones</a>
    </div>

    <div class="card">
        <div class="top-bar">
            <h2>🌡️ Temperaturas (Semi-Circle Donut)</h2>
            <p class="desc">Distribución de las temperaturas medias por país. Selecciona el año para ver cómo cambian las proporciones.</p>
        </div>

        {#if message}
            <div class="loading-state">{message}</div>
        {:else}
            <div class="controls">
                <label>📅 Año registrado:</label>
                <select bind:value={selectedYear}>
                    {#each availableYears as yr}
                        <option value={yr}>{yr}</option>
                    {/each}
                </select>
            </div>

            <div class="chart-box">
                <div bind:this={chartContainer} style="width: 100%; height: 450px;"></div>
            </div>
        {/if}
    </div>
</main>

<style>
    :global(body) { background: #0f172a; color: white; margin: 0; font-family: 'Segoe UI', sans-serif; }
    main { padding: 2rem; max-width: 1000px; margin: auto; }
    .header-nav { margin-bottom: 2rem; }
    .back-btn { color: #38bdf8; text-decoration: none; font-weight: bold; border: 1px solid #38bdf8; padding: 0.5rem 1rem; border-radius: 8px; transition: 0.3s; }
    .back-btn:hover { background: rgba(56, 189, 248, 0.2); }
    .card { background: #1e293b; padding: 2rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); border: 1px solid #334155; }
    .top-bar h2 { margin: 0 0 0.5rem 0; color: #38bdf8; }
    .desc { color: #94a3b8; margin-bottom: 1.5rem; }
    .controls { background: #0b1120; padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; font-weight: bold; color: #cbd5e1; }
    select { background: #1e293b; color: #38bdf8; padding: 0.5rem; border-radius: 5px; font-weight: bold; border: 1px solid #38bdf8; cursor: pointer; }
    .loading-state { color: #facc15; font-size: 1.2rem; text-align: center; border: 2px dashed #facc15; padding: 2rem; border-radius: 8px; font-weight: bold; }
</style>