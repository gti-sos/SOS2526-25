<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let chartContainer;
    let message = $state("Cruzando Turistas con datos geográficos (Zippopotam)...");
    let isLoading = $state(true);

    async function safeJson(res) {
        try { return res.ok ? await res.json() : null; } catch { return null; }
    }

    onMount(async () => {
        if (!browser) return;

        try {
            // 1. Obtener datos
            const resMis = await fetch("/api/v2/international-tourist-arrivals");
            let misDatos = await safeJson(resMis);

            if (!misDatos || misDatos.length === 0) {
                await fetch("/api/v2/international-tourist-arrivals/loadInitialData");
                const resRetry = await fetch("/api/v2/international-tourist-arrivals");
                misDatos = await safeJson(resRetry);
            }

            // 2. Agrupar por país
            const unicos = new Map();
            if (misDatos) {
                misDatos.forEach(d => {
                    let p = String(d.country || "").trim();
                    let t = Number(d.air_arrival) || Number(d.arrivals_air) || 0;
                    if (!unicos.has(p)) unicos.set(p, t);
                    else unicos.set(p, unicos.get(p) + t);
                });
            }

            // 3. Diccionario
            const zipMapping = {
                "Spain": { cc: "es", zip: "41001" },
                "Germany": { cc: "de", zip: "10115" },
                "France": { cc: "fr", zip: "75001" },
                "Italy": { cc: "it", zip: "00184" },
                "Mexico": { cc: "mx", zip: "01000" },
                "USA": { cc: "us", zip: "90210" },
                "Canada": { cc: "ca", zip: "K1A" }
            };

            const chartData = [];

            const listaPaises = Array.from(unicos.entries())
                .filter(([pais, _]) => zipMapping[pais])
                .slice(0, 10);

            for (const [pais, turistas] of listaPaises) {
                const config = zipMapping[pais];
                
                // 4. API Externa
                const resZippo = await fetch(`https://api.zippopotam.us/${config.cc}/${config.zip}`);
                const dataZippo = await safeJson(resZippo);
                
                if (dataZippo && dataZippo.places) {
                    const infoGeo = dataZippo.places[0];
                    const lat = parseFloat(infoGeo.latitude);
                    
                    // LÓGICA DE COLOR REAL POR LATITUD
                    let colorWord = "#38bdf8"; // Sur -> Azul (Ej: Mexico, USA sur)
                    if (lat >= 45) colorWord = "#f43f5e"; // Norte -> Rojo (Ej: Canada, Alemania)
                    else if (lat >= 35) colorWord = "#facc15"; // Centro -> Amarillo (Ej: España, Italia)

                    chartData.push({
                        x: pais,
                        value: turistas, 
                        latitud: lat,
                        lugar: infoGeo["place name"],
                        estado: infoGeo["state"],
                        fill: colorWord // AnyChart usa esto para pintar cada palabra correctamente
                    });
                }
            }

            const initChart = () => {
                if (!window.anychart) return;
                
                // Limpieza drástica para evitar el solapamiento del que te quejabas
                chartContainer.innerHTML = '';

                const chart = anychart.tagCloud(chartData);
                chart.background().fill("transparent");
                chart.angles([0]); 
                chart.fontFamily('Segoe UI, sans-serif');
                
                chart.tooltip().useHtml(true);
                chart.tooltip().format(function() {
                    return `
                        <div style="font-family: sans-serif; padding: 5px;">
                            <span style="color: #38bdf8; font-weight: bold; font-size: 14px;">${this.x}</span><br/>
                            <hr style="border: 0.1px solid #444; margin: 5px 0;">
                            🛬 Turistas (Acumulado): <b>${this.value.toLocaleString()}</b><br/>
                            🌍 Latitud (Zippo): <b>${this.getData('latitud')}°</b><br/>
                            📍 Ref. Postal: <b>${this.getData('lugar')} (${this.getData('estado')})</b>
                        </div>
                    `;
                });

                chart.container(chartContainer);
                chart.draw();
                isLoading = false;
                message = "";
            };

            if (window.anychart) {
                initChart();
            } else {
                const script = document.createElement('script');
                script.src = "https://cdn.anychart.com/releases/8.11.0/js/anychart-bundle.min.js";
                document.head.appendChild(script);
                script.onload = initChart;
            }

        } catch (e) {
            console.error(e);
            message = "Error en la nube geográfica.";
            isLoading = false;
        }
    });
</script>

<main>
    <div class="header-nav"><a href="/integrations/aimar" class="back-btn">⬅ Volver al panel</a></div>

    <div class="card">
        <div class="top-bar">
            <h2>☁️ Nube: Turistas vs Latitud Geográfica</h2>
            <p class="desc">Cruce de datos con <strong>Zippopotam API</strong>. Tamaño: Turistas | Color: Latitud (Norte=Rojo, Centro=Amarillo, Sur=Azul).</p>
        </div>

        {#if isLoading}
            <div class="loading-state">
                <span class="spinner">🌍</span>
                <p>{message}</p>
            </div>
        {:else if message}
            <div class="error-msg">{message}</div>
        {/if}

        <div class="chart-box" style:display={isLoading || message ? 'none' : 'block'}>
            <div bind:this={chartContainer} style="width: 100%; height: 500px;"></div>
        </div>
    </div>
</main>

<style>
    :global(body) { background: #0f172a; color: white; margin: 0; font-family: 'Segoe UI', sans-serif; }
    main { padding: 2rem; max-width: 1000px; margin: auto; }
    .card { background: #1e293b; padding: 2rem; border-radius: 24px; border: 1px solid #334155; }
    .top-bar h2 { color: #38bdf8; margin: 0; font-size: 1.8rem; }
    .desc { color: #94a3b8; margin-bottom: 2rem; }
    .loading-state { text-align: center; padding: 5rem; color: #38bdf8; }
    .spinner { font-size: 3rem; display: inline-block; animation: rotate 2s linear infinite; }
    .chart-box { background: #0b1120; border-radius: 16px; padding: 1rem; border: 1px solid #334155; }
    .back-btn { color: #38bdf8; text-decoration: none; border: 1px solid #38bdf8; padding: 0.5rem 1rem; border-radius: 8px; font-weight: bold; }
    
    @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    :global(.anychart-ui-support) { color: white !important; }
</style>