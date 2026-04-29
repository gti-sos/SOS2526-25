<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let chartContainer;
    let message = $state("Cruzando datos de Fertilidad (G12) y Temperaturas (Pablo)...");

    onMount(async () => {
        if (!browser) return;

        // Esperamos a que AnyChart se cargue desde el CDN
        const checkAnyChart = setInterval(async () => {
            if (window.anychart) {
                clearInterval(checkAnyChart);
                await loadAndDraw();
            }
        }, 100);
    });

    async function loadAndDraw() {
        try {
            // 1. Fetch a la API de Pablo (Temperaturas)
            const resTemp = await fetch('/api/v2/average-annual-temperatures');
            
            // 2. Fetch directo a la API del G12 (Fertilidad)
            const resFertility = await fetch('https://sos2526-12.onrender.com/api/v2/age-specific-fertility-rates');

            if (!resTemp.ok || !resFertility.ok) throw new Error("Error al conectar con las APIs");

            const dataTemp = await resTemp.json();
            const dataFertility = await resFertility.json();

            // 3. Cruzar datos: Buscamos coincidencias exactas por nombre de país
            let treeChildren = [];

            dataFertility.forEach(fert => {
                const tempMatch = dataTemp.find(t => t.country.toLowerCase() === fert.country_name.toLowerCase());

                if (tempMatch) {
                    treeChildren.push({
                        name: fert.country_name,
                        value: fert.fert_20_24,       // El tamaño de la caja será la fertilidad
                        temperature: tempMatch.temperature, // Info extra para el tooltip
                        co2: tempMatch.co2_emission,
                        year: fert.year
                    });
                }
            });

            if (treeChildren.length === 0) {
                message = "⚠️ No hay coincidencias de países entre ambas APIs.";
                return;
            }

            // AnyChart Treemap necesita un formato jerárquico
            let treeData = [
                {
                    name: "Datos Cruzados",
                    children: treeChildren
                }
            ];

            message = ""; // Limpiamos mensaje

            // 4. Dibujar la gráfica con AnyChart
            const chart = window.anychart.treeMap(treeData, "as-tree");

            // Configuración visual del Treemap
            chart.title("Tasa de Fertilidad (20-24 años) vs Temperatura Media");
            chart.title().fontColor("#00f2fe").fontSize(18);
            chart.background().fill("transparent");
            
            // Paleta de colores para las cajas
            chart.colorScale(window.anychart.scales.linearColor().colors(["#4facfe", "#00f2fe", "#aa3bff"]));

            // Configurar Tooltip (lo que sale al pasar el ratón)
            chart.tooltip().useHtml(true);
            chart.tooltip().format(function() {
                return `
                    <div style="font-family: sans-serif; color: white;">
                        <b>Año:</b> ${this.getData("year")}<br/>
                        <b>👶 Fertilidad (20-24):</b> ${this.value}<br/>
                        <b>🌡️ Temperatura Media:</b> ${this.getData("temperature")} ºC<br/>
                        <b>☁️ Emisiones CO2:</b> ${this.getData("co2")}
                    </div>
                `;
            });

            // Estilo de las etiquetas de las cajas
            chart.labels().fontColor("white").fontWeight("bold");
            chart.stroke("#0f172a");

            // Renderizamos en el contenedor div
            chart.container(chartContainer);
            chart.draw();

        } catch (error) {
            console.error(error);
            message = "❌ Error en la integración de datos: " + error.message;
        }
    }
</script>

<svelte:head>
    <script src="https://cdn.anychart.com/releases/8.11.1/js/anychart-core.min.js"></script>
    <script src="https://cdn.anychart.com/releases/8.11.1/js/anychart-treemap.min.js"></script>
</svelte:head>

<main>
    <a href="/integrations" class="back-btn">⬅ Volver al Panel</a>
    <h2>👶 Fertilidad vs Clima (Pablo)</h2>
    <p class="subtitle">Integración con G12 usando <b>AnyChart</b> (Treemap) vía fetch directo.</p>

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="card chart-wrapper" class:hidden={!!message}>
        <div bind:this={chartContainer} style="width: 100%; height: 600px;"></div>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0; }
    main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h2 { color: #ff007f; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 2rem; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 1rem; }
    .back-btn:hover { color: #ff007f; }
    
    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    .alert { background: rgba(255, 0, 127, 0.2); border-left: 4px solid #ff007f; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; text-align: center; }
    
    .chart-wrapper { position: relative; width: 100%; }
    .hidden { display: none; }
</style>