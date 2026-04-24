<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';

    let chartContainer;
    let message = "Cargando datos...";

    onMount(async () => {
        try {
            const res = await fetch('/api/v2/average-annual-temperatures');
            const data = await res.json();
            message = "";

            // Formateamos los datos para un scatter: [Emisiones CO2, Temperatura]
            const scatterData = data.map(d => [d.co2_emission, d.temperature]);

            Highcharts.chart(chartContainer, {
                chart: { type: 'scatter', zoomType: 'xy' }, // TIPO 3: DISPERSIÓN
                title: { text: 'Relación: Emisiones CO2 vs Temperatura' },
                xAxis: { title: { enabled: true, text: 'Emisiones CO2' }, startOnTick: true, endOnTick: true, showLastLabel: true },
                yAxis: { title: { text: 'Temperatura (ºC)' } },
                plotOptions: { scatter: { marker: { radius: 5, states: { hover: { enabled: true, lineColor: 'rgb(100,100,100)' } } }, tooltip: { headerFormat: '<b>{series.name}</b><br>', pointFormat: '{point.x} CO2, {point.y} ºC' } } },
                series: [{ name: 'Registros', color: 'rgba(223, 83, 83, .5)', data: scatterData }]
            });
        } catch (error) {
            message = "Error al cargar la gráfica.";
        }
    });
</script>

<main>
    <a href="/average-annual-temperatures" class="back-btn">⬅ Volver a Temperaturas</a>
    <h2>🌍 Analíticas de Temperaturas</h2>
    {#if message}<p class="alert">{message}</p>{/if}
    <div bind:this={chartContainer} style="width: 100%; height: 500px;"></div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; }
    main { max-width: 900px; margin: 0 auto; padding: 2rem; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; }
</style>