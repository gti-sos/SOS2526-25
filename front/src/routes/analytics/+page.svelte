<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';

    let chartContainer;
    let message = "Cargando datos grupales...";

    onMount(async () => {
        try {
            // Hacemos las 3 peticiones en paralelo para Alemania (Germany)
            const [resTemp, resArrivals, resDrinks] = await Promise.all([
                fetch('/api/v2/average-annual-temperatures?country=Germany'),
                fetch('/api/v2/international-tourist-arrivals?country=Germany'),
                fetch('/api/v2/social-drinking-behaviors?country=Germany')
            ]);

            const temp = await resTemp.json();
            const arrivals = await resArrivals.json();
            const drinks = await resDrinks.json();

            // Extraemos los años comunes o simulamos una pequeña serie
            // (Usamos datos crudos para el ejemplo, asegurando que se pinta aunque falten años exactos)
            const years = ['2015', '2017', '2021']; 
            
            const tempData = years.map(y => temp.find(t => t.year == y)?.temperature || 0);
            // Dividimos entre 1000 para escalar visualmente las llegadas
            const arrivalsData = years.map(y => (arrivals.find(a => a.year == y)?.air_arrival || 0) / 1000); 
            const drinksData = years.map(y => drinks.find(d => d.year == y)?.total_liter || 0);

            message = "";

            Highcharts.chart(chartContainer, {
                chart: { type: 'column' }, // TIPO 1: COLUMNAS
                title: { text: 'Análisis Integrado: Alemania (SOS2526-25)' },
                subtitle: { text: 'Comparativa de Temperatura, Llegadas (x1000) y Litros de Alcohol' },
                xAxis: { categories: years, crosshair: true },
                yAxis: { min: 0, title: { text: 'Valores Mixtos' } },
                series: [
                    { name: 'Temperatura ºC (Pablo)', data: tempData },
                    { name: 'Llegadas Aéreas x1000 (Aimar)', data: arrivalsData },
                    { name: 'Consumo Alcohol L. (Juanlu)', data: drinksData }
                ]
            });
        } catch (error) {
            message = "Error al cargar los datos de las APIs.";
        }
    });
</script>

<main>
    <a href="/" class="back-btn">⬅ Volver al Inicio</a>
    <h2>📊 Analíticas Grupales</h2>
    
    {#if message}
        <p class="alert">{message}</p>
    {/if}

    <div bind:this={chartContainer} style="width: 100%; height: 500px;"></div>
</main>

<style>
    :global(body) { margin: 0; background-color: #0f172a; color: white; font-family: sans-serif; }
    main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h2 { text-align: center; color: #00f2fe; margin-bottom: 2rem; }
    .back-btn { display: inline-block; margin-bottom: 1rem; color: #94a3b8; text-decoration: none; font-weight: bold; }
    .alert { background: rgba(255, 50, 50, 0.2); border-left: 4px solid #ff5252; padding: 1rem; color: white; }
</style>