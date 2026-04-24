<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';

    let chartContainer;
    let message = "Cargando datos...";

    onMount(async () => {
        try {
            const res = await fetch('/api/v2/social-drinking-behaviors');
            const data = await res.json();
            message = "";

            // Extraemos los países (categorías del eje Y) y los datos de cada bebida
            const countries = data.map(d => `${d.country} (${d.year})`);
            const beer = data.map(d => d.beer_share);
            const wine = data.map(d => d.wine_share);
            const spirit = data.map(d => d.spirit_share);

            Highcharts.chart(chartContainer, {
                chart: { type: 'bar' }, // TIPO 4: BARRAS HORIZONTALES
                title: { text: 'Preferencias de Consumo de Alcohol por País' },
                xAxis: { categories: countries, title: { text: null } },
                yAxis: { min: 0, title: { text: 'Porcentaje Compartido (%)', align: 'high' } },
                plotOptions: { bar: { dataLabels: { enabled: true } } },
                legend: { layout: 'vertical', align: 'right', verticalAlign: 'top', x: -40, y: 80, floating: true, borderWidth: 1, backgroundColor: '#FFFFFF', shadow: true },
                credits: { enabled: false },
                series: [
                    { name: 'Cerveza', data: beer },
                    { name: 'Vino', data: wine },
                    { name: 'Licores', data: spirit }
                ]
            });
        } catch (error) {
            message = "Error al cargar la gráfica.";
        }
    });
</script>

<main>
    <a href="/social-drinking-behaviors" class="back-btn">⬅ Volver a Bebidas</a>
    <h2>🍺 Analíticas de Bebidas</h2>
    {#if message}<p class="alert">{message}</p>{/if}
    <div bind:this={chartContainer} style="width: 100%; height: 500px;"></div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; }
    main { max-width: 900px; margin: 0 auto; padding: 2rem; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; }
</style>