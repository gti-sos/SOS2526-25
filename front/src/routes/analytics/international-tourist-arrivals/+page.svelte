<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';

    let chartContainer;
    let message = "Cargando datos...";

    onMount(async () => {
        try {
            const res = await fetch('/api/v2/international-tourist-arrivals');
            const data = await res.json();
            message = "";

            // Sumamos los totales de todos los países
            let totalAir = 0, totalWater = 0, totalLand = 0;
            data.forEach(d => {
                totalAir += d.air_arrival || 0;
                totalWater += d.water_arrival || 0;
                totalLand += d.land_arrival || 0;
            });

            Highcharts.chart(chartContainer, {
                chart: { type: 'pie' }, // TIPO 2: TARTA
                title: { text: 'Distribución Global de Llegadas Turísticas' },
                tooltip: { pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>' },
                plotOptions: {
                    pie: { allowPointSelect: true, cursor: 'pointer', dataLabels: { enabled: true, format: '<b>{point.name}</b>: {point.percentage:.1f} %' } }
                },
                series: [{
                    name: 'Porcentaje',
                    colorByPoint: true,
                    data: [
                        { name: 'Aire', y: totalAir, sliced: true, selected: true },
                        { name: 'Agua', y: totalWater },
                        { name: 'Tierra', y: totalLand }
                    ]
                }]
            });
        } catch (error) {
            message = "Error al cargar la gráfica.";
        }
    });
</script>

<main>
    <a href="/international-tourist-arrivals" class="back-btn">⬅ Volver a Llegadas</a>
    <h2>✈️ Analíticas de Llegadas</h2>
    {#if message}<p class="alert">{message}</p>{/if}
    <div bind:this={chartContainer} style="width: 100%; height: 500px;"></div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; }
    main { max-width: 900px; margin: 0 auto; padding: 2rem; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; }
</style>