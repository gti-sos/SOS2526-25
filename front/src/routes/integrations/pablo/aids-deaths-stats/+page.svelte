<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Cruzando datos de SIDA (G21) y Clima (Pablo)...");
    let chartElement;

    onMount(async () => {
        if (!browser) return;
        
        // Esperamos a que Billboard.js esté cargado
        const checkLib = setInterval(async () => {
            if (window.bb) {
                clearInterval(checkLib);
                await loadAndDraw();
            }
        }, 100);
    });

    async function loadAndDraw() {
        try {
            // Buscamos directamente Afganistán 2015 en TU api
            const resTemp = await fetch('/api/v2/average-annual-temperatures?country=Afghanistan&year=2015');
            // Llamamos al proxy (que ahora ya trae Afganistán 2015 filtrado)
            const resAids = await fetch('/api/proxy/pablo/aids');

            if (!resTemp.ok || !resAids.ok) throw new Error("Error al obtener datos");

            const dataTemp = await resTemp.json();
            const dataAids = await resAids.json();

            // Extraemos los objetos (si las APIs devuelven un array, cogemos el primero)
            const myData = Array.isArray(dataTemp) ? dataTemp[0] : dataTemp;
            const partnerData = Array.isArray(dataAids) ? dataAids[0] : dataAids;

            if (!myData || !partnerData) {
                message = `⚠️ No hay datos coincidentes en las bases de datos para Afganistán 2015.`;
                return;
            }

            message = ""; 

            window.bb.generate({
                data: {
                    x: "x",
                    columns: [
                        ["x", "Menores 5", "5-14 años", "15-49 años", "50-69 años", "Mayores 70"],
                        ["Muertes SIDA", 
                            partnerData.death_count_hiv_aids_under_5, 
                            partnerData.death_count_hiv_aids_5_14, 
                            partnerData.death_count_hiv_aids_15_49, 
                            partnerData.death_count_hiv_aids_50_69, 
                            partnerData.death_count_hiv_aids_70_plus
                        ]
                    ],
                    type: "radar",
                    labels: true
                },
                radar: { axis: { max: 200 } },
                bindto: chartElement,
                color: { pattern: ["#aa3bff"] },
                legend: { show: true },
                title: { text: `Distribución de muertes SIDA vs Clima (${myData.country}, 2015)` }
            });

        } catch (e) {
            message = "❌ Error en la carga: " + e.message;
        }
    }
</script>

<svelte:head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/billboard.js/dist/billboard.min.css">
    <script src="https://cdn.jsdelivr.net/npm/billboard.js/dist/billboard.pkgd.min.js"></script>
</svelte:head>

<main>
    <a href="/integrations" class="back-btn">⬅ Volver al Panel</a>
    <h2>📊 SIDA vs Clima (Pablo + Grupo 21)</h2>
    <p class="description">Uso de <b>Billboard.js</b> (Radar Chart) consumiendo API externa vía <b>Proxy</b>.</p>

    {#if message}
        <div class="status">{message}</div>
    {/if}

    <div class="card">
        <div bind:this={chartElement}></div>
        <div class="info-footer">
            <p>🌍 <b>Dato Clima (Pablo):</b> {message ? '---' : 'Afganistán (2015)'}</p>
            <p>🌡️ <b>Temp Media:</b> 10.33 ºC | 🌧️ <b>Precipitación:</b> 654.88</p>
        </div>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; }
    main { max-width: 900px; margin: 0 auto; padding: 2rem; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; }
    .card { background: rgba(255, 255, 255, 0.05); padding: 2rem; border-radius: 20px; border: 1px solid #aa3bff; }
    .status { text-align: center; padding: 1rem; color: #facc15; }
    .info-footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px dashed #334155; color: #94a3b8; font-size: 0.9rem; }
</style>