<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let chartContainer;
    let message = $state("Cruzando turistas con extensión territorial...");
    let isLoading = $state(true);

    async function safeJson(res) {
        try { return res.ok ? await res.json() : []; } catch { return []; }
    }

    onMount(async () => {
        if (!browser) return;

        try {
            // 1. Tus datos (Llegadas)
            const resMis = await fetch("/api/v2/international-tourist-arrivals");
            const misDatos = await safeJson(resMis);

            // 2. API Externa: RestCountries (Área en km2)
            const resExt = await fetch("https://restcountries.com/v3.1/all?fields=name,area");
            const countries = await safeJson(resExt);

            if (misDatos.length === 0 || countries.length === 0) {
                message = "⚠️ Faltan datos para realizar el cruce.";
                isLoading = false; return;
            }

            // Mapa para buscar el área rápidamente
            const areaMap = new Map();
            countries.forEach(c => areaMap.set(c.name.common.toLowerCase(), c.area));

            // Agrupamos tus países y cruzamos con el área
            const unicos = new Map();
            misDatos.forEach(d => {
                let pais = String(d.country || "").toLowerCase().trim();
                
                if (areaMap.has(pais)) {
                    if(!unicos.has(pais)) {
                        let area = areaMap.get(pais);
                        unicos.set(pais, { 
                            nombre: d.country,
                            turistas: Number(d.air_arrival) || 0, 
                            area: area
                        });
                    } else {
                        unicos.get(pais).turistas += (Number(d.air_arrival) || 0);
                    }
                }
            });

            if (unicos.size === 0) {
                message = "⚠️ Sin coincidencias con RestCountries.";
                isLoading = false; return;
            }

            // Preparamos formato para AnyChart Tag Cloud
            const chartData = [];
            unicos.forEach((val) => {
                chartData.push({
                    x: val.nombre, 
                    value: val.turistas, // El tamaño de la letra lo define TUS turistas
                    area: val.area,
                });
            });

            // CARGA SEGURA DE ANYCHART PARA SVELTEKIT
            const initChart = () => {
                anychart.onDocumentReady(() => {
                    chartContainer.innerHTML = ''; // Limpiamos por si hay recargas
                    
                    const chart = anychart.tagCloud(chartData);
                    chart.background().fill("transparent");
                    chart.angles([0, -45, 90]);
                    chart.colorRange(false);
                    
                    // Paleta de colores neón
                    chart.palette(["#38bdf8", "#f43f5e", "#a855f7", "#4ade80", "#facc15"]);
                    
                    // TOOLTIP CON EL CRUCE DE DATOS
                    chart.tooltip().useHtml(true);
                    chart.tooltip().format(function() {
                        return `🛬 Tus Turistas: <b style="color:#38bdf8">${this.getData("value").toLocaleString()}</b><br/>
                                🗺️ Área País: ${this.getData("area").toLocaleString()} km²`;
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

        } catch (error) {
            console.error(error);
            message = "Error crítico cargando la Nube de Etiquetas."; 
            isLoading = false; 
        }
    });
</script>

<main>
    <div class="header-nav">
        <a href="/integrations/aimar" class="back-btn">⬅ Volver a Integraciones</a>
    </div>
    
    <div class="card">
        <div class="top-bar">
            <h2>☁️ Turistas vs Tamaño del País (AnyChart)</h2>
            <p class="desc">Cruce de tu API con RestCountries (Área en km²). El tamaño del texto indica el volumen de llegadas.</p>
        </div>

        {#if isLoading || message} 
            <div class="loading-state">
                {#if isLoading}<span class="spinner">⏳</span><br><br>{/if}
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
    .header-nav { margin-bottom: 2rem; }
    .back-btn { color: #38bdf8; text-decoration: none; font-weight: bold; border: 1px solid #38bdf8; padding: 0.5rem 1rem; border-radius: 8px; transition: 0.3s; }
    .back-btn:hover { background: rgba(56, 189, 248, 0.2); }
    .card { background: #1e293b; padding: 2rem; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); border: 1px solid #334155;}
    .top-bar h2 { margin: 0 0 0.5rem 0; color: #38bdf8; }
    .desc { color: #94a3b8; margin-top: 0; margin-bottom: 2rem; }
    .loading-state { text-align: center; padding: 3rem; color: #facc15; font-size: 1.1rem;}
    .spinner { font-size: 2rem; display: inline-block; animation: pulse 1.5s infinite; }
    .chart-box { background: #0b1120; border-radius: 16px; padding: 1.5rem; border: 1px solid #334155; }
    .hidden { display: none !important; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>