<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let chartContainer;
    let message = $state("Generando nube de infraestructura logística...");
    let isLoading = $state(true);

    async function safeJson(res) {
        try { return res.ok ? await res.json() : null; } catch { return null; }
    }

    onMount(async () => {
        if (!browser) return;

        try {
            // 1. Tus datos (Ruta absoluta a Render)
            const resMis = await fetch("https://sos2526-25.onrender.com/api/v2/international-tourist-arrivals");
            const misDatos = await safeJson(resMis);

            if (!misDatos || misDatos.length === 0) {
                message = "⚠️ No hay datos de turistas. Carga el initialData.";
                isLoading = false; return;
            }

            const unicos = new Map();
            misDatos.forEach(d => {
                let p = String(d.country || "").trim();
                let t = Number(d.air_arrival) || Number(d.arrivals_air) || 0;
                if (!unicos.has(p)) unicos.set(p, t);
                else unicos.set(p, unicos.get(p) + t);
            });

            const listaPaises = Array.from(unicos.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10); // Cogemos 10 para que la nube se vea llena

            const cpMapping = {
                "Spain": { iso: "ES", cp: "28001" },
                "France": { iso: "FR", cp: "75001" },
                "USA": { iso: "US", cp: "90210" },
                "Germany": { iso: "DE", cp: "10115" },
                "Italy": { iso: "IT", cp: "00118" },
                "Mexico": { iso: "MX", cp: "01000" }
            };

            const chartData = [];

            for (const [pais, turistas] of listaPaises) {
                const conf = cpMapping[pais] || { iso: "ES", cp: "28001" };
                
                // 2. API EXTERNA: Zippopotam.us (SIN PROXY)
                const resExt = await fetch(`https://api.zippopotam.us/${conf.iso}/${conf.cp}`);
                const dataExt = await safeJson(resExt);

                chartData.push({
                    x: pais,
                    value: turistas, // Define el TAMAÑO en la nube
                    puntos: dataExt && dataExt.places ? dataExt.places.length : 0,
                    lugar: dataExt && dataExt.places ? dataExt.places[0]["place name"] : "N/A"
                });
            }

            const initChart = () => {
                anychart.onDocumentReady(() => {
                    chartContainer.innerHTML = ''; 
                    const chart = anychart.tagCloud(chartData);
                    
                    chart.angles([0, -45, 90]);
                    chart.colorRange(false);
                    chart.background().fill("transparent");
                    
                    // Paleta de colores atractiva
                    chart.palette(["#38bdf8", "#fb7185", "#c084fc", "#4ade80", "#fbbf24"]);

                    // TOOLTIP con el cruce
                    chart.tooltip().useHtml(true);
                    chart.tooltip().format(function() {
                        return `🛬 Turistas: <b style="color:#38bdf8">${this.getData("value").toLocaleString()}</b><br/>
                                📍 Puntos en zona: <b style="color:#fb7185">${this.getData("puntos")}</b><br/>
                                🏙️ Referencia: <i>${this.getData("lugar")}</i>`;
                    });

                    chart.container(chartContainer);
                    chart.draw();
                    isLoading = false;
                    message = "";
                });
            };

            if (window.anychart) {
                initChart();
            } else {
                let script = document.getElementById('anychart-script');
                if (!script) {
                    script = document.createElement('script');
                    script.id = 'anychart-script';
                    script.src = "https://cdn.anychart.com/releases/8.11.0/js/anychart-bundle.min.js";
                    document.head.appendChild(script);
                }
                script.addEventListener('load', initChart);
            }

        } catch (e) {
            console.error(e);
            message = "Error cargando la Nube de Etiquetas.";
            isLoading = false;
        }
    });
</script>

<main>
    <div class="header-nav">
        <a href="/integrations/aimar" class="back-btn">⬅ Volver al Panel</a>
    </div>

    <div class="card">
        <div class="top-bar">
            <h2>☁️ Nube: Turismo vs Infraestructura (Zippopotam)</h2>
            <p class="desc">El tamaño de la palabra indica el volumen de turistas. El tooltip muestra datos de geolocalización externa.</p>
        </div>

        {#if isLoading || message}
            <div class="loading-state">
                {#if isLoading}<span class="spinner">☁️</span><br><br>{/if}
                {message}
            </div>
        {/if}

        <div class="chart-box" class:hidden={isLoading || (message && message.includes("Error"))}>
            <div bind:this={chartContainer} style="width: 100%; height: 500px;"></div>
        </div>
    </div>
</main>

<style>
    :global(body) { background: #0f172a; color: white; margin: 0; font-family: 'Segoe UI', sans-serif; }
    main { padding: 2rem; max-width: 1000px; margin: auto; }
    .card { background: #1e293b; padding: 2rem; border-radius: 24px; border: 1px solid #334155; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
    .top-bar h2 { color: #38bdf8; margin: 0; }
    .desc { color: #94a3b8; margin-top: 0.5rem; margin-bottom: 2rem; }
    .loading-state { text-align: center; padding: 5rem; color: #38bdf8; }
    .spinner { font-size: 3rem; display: inline-block; animation: pulse 1.5s infinite; }
    .chart-box { background: #0b1120; border-radius: 16px; padding: 1rem; border: 1px solid #334155; }
    .hidden { display: none !important; }
    .back-btn { color: #38bdf8; text-decoration: none; border: 1px solid #38bdf8; padding: 0.5rem 1rem; border-radius: 8px; font-weight: bold; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>