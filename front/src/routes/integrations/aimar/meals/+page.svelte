<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let chartContainer;
    let message = $state("Cruzando Turistas con potencias gastronómicas (TheMealDB)...");
    let isLoading = $state(true);

    async function safeJson(res) {
        try { return res.ok ? await res.json() : []; } catch { return []; }
    }

    onMount(async () => {
        if (!browser) return;

        try {
            // 1. Obtener tus datos
            const resMis = await fetch("/api/v2/international-tourist-arrivals");
            let misDatos = await safeJson(resMis);

            if (!misDatos || misDatos.length === 0) {
                await fetch("/api/v2/international-tourist-arrivals/loadInitialData");
                const resRetry = await fetch("/api/v2/international-tourist-arrivals");
                misDatos = await safeJson(resRetry);
            }

            if (!misDatos || misDatos.length === 0) {
                message = "⚠️ No hay datos de turistas para analizar.";
                isLoading = false; return;
            }

            // 2. AGRUPAR POR PAÍS
            const unicos = new Map();
            misDatos.forEach(d => {
                let p = String(d.country || "").trim();
                let t = Number(d.air_arrival) || Number(d.arrivals_air) || 0;
                if (!unicos.has(p)) unicos.set(p, t);
                else unicos.set(p, unicos.get(p) + t);
            });

            // 3. Diccionario SIN Francia ni USA
            const countryToDemonym = {
                "United Kingdom": "British",
                "Canada": "Canadian",
                "Italy": "Italian",
                "China": "Chinese",
                "Spain": "Spanish",
                "Japan": "Japanese",
                "Thailand": "Thai",
                "Turkey": "Turkish",
                "Mexico": "Mexican",
                "Greece": "Greek",
                "India": "Indian"
            };

            const labels = [];
            const dataTuristas = [];
            const dataPlatos = [];

            // Filtramos los 6 países top que tengan traducción a la API de comida
            const listaPaises = Array.from(unicos.entries())
                .filter(([pais, _]) => countryToDemonym[pais])
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6);

            for (const [pais, turistas] of listaPaises) {
                const gentilicio = countryToDemonym[pais];
                
                const resExt = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${gentilicio}`);
                const dataApi = await safeJson(resExt);
                
                const numeroDePlatos = dataApi.meals ? dataApi.meals.length : 0;

                labels.push(pais);
                dataTuristas.push(turistas);
                
                // Multiplicador visual x10 ajustado
                dataPlatos.push(numeroDePlatos * 10); 
            }

            // 4. Cargar Chartist
            const loadChartist = () => {
                return new Promise((resolve) => {
                    const link = document.createElement("link");
                    link.rel = "stylesheet";
                    link.href = "https://cdn.jsdelivr.net/chartist.js/latest/chartist.min.css";
                    document.head.appendChild(link);

                    const script = document.createElement("script");
                    script.src = "https://cdn.jsdelivr.net/chartist.js/latest/chartist.min.js";
                    document.head.appendChild(script);
                    script.onload = () => resolve(window.Chartist);
                });
            };

            const Chartist = await loadChartist();

            new Chartist.Bar(chartContainer, {
                labels: labels,
                series: [dataTuristas, dataPlatos]
            }, {
                seriesBarDistance: 25, 
                axisY: {
                    onlyInteger: true,
                    offset: 50
                },
                axisX: {
                    offset: 40
                }
            });

            isLoading = false;
            message = "";

        } catch (e) {
            console.error(e);
            message = "Error crítico conectando con la API Gastronómica.";
            isLoading = false;
        }
    });
</script>

<main>
    <div class="header-nav"><a href="/integrations/aimar" class="back-btn">⬅ Volver al panel</a></div>
    
    <div class="card">
        <div class="top-bar">
            <h2>🥘 Turistas vs Oferta Gastronómica (Chartist)</h2>
            <p class="desc">Cruce con <strong>TheMealDB</strong>. ¿Tienen los países más visitados un catálogo de recetas más extenso?</p>
            <div class="leyenda">
                <span class="l-t">■ Turistas</span> | <span class="l-l">■ Platos Registrados (x10 visual)</span>
            </div>
        </div>

        {#if isLoading || message}
            <div class="loading-state">
                {#if isLoading}<span class="spinner">🥘</span><br><br>{/if}
                {message}
            </div>
        {/if}

        <div class="chart-box" class:hidden={isLoading || !!message}>
            <div bind:this={chartContainer} class="ct-chart"></div>
        </div>
    </div>
</main>

<style>
    :global(body) { background: #0f172a; color: white; margin: 0; font-family: 'Segoe UI', sans-serif; }
    main { padding: 2rem; max-width: 1000px; margin: auto; }
    .card { background: #1e293b; padding: 2.5rem; border-radius: 20px; border: 1px solid #334155; }
    .top-bar h2 { color: #38bdf8; margin: 0; font-size: 1.8rem; }
    .leyenda { margin-top: 1rem; font-size: 1rem; font-weight: bold; }
    
    .l-t { color: #38bdf8; } 
    .l-l { color: #facc15; } 
    
    .desc { color: #94a3b8; margin-top: 0.5rem; }
    .chart-box { background: #f8fafc; border-radius: 12px; padding: 2rem 1rem 1rem 1rem; border: 1px solid #334155; height: 450px; margin-top: 1rem;}
    .hidden { display: none !important; }
    .loading-state { text-align: center; padding: 5rem; color: #facc15; }
    .spinner { font-size: 3rem; display: inline-block; animation: pulse 1.5s infinite; }
    .back-btn { color: #38bdf8; text-decoration: none; border: 1px solid #38bdf8; padding: 0.5rem 1rem; border-radius: 8px; font-weight: bold; }
    
    /* === AJUSTES GRÁFICA CHARTIST === */
    :global(.ct-chart) { height: 100%; width: 100%; }
    
    /* Nombres de los países */
    :global(.ct-label.ct-horizontal) { 
        font-size: 14px; 
        fill: #1e293b; 
        color: #1e293b; 
        font-weight: bold;
        padding-top: 10px;
        display: block;
    }
    
    :global(.ct-label.ct-vertical) { font-size: 14px; fill: #1e293b; color: #1e293b; font-weight: bold; }
    
    /* Barra 1 (Turistas) - Azul */
    :global(.ct-series-a .ct-bar) { stroke: #38bdf8 !important; stroke-width: 25px; stroke-linecap: round; } 
    
    /* Barra 2 (Platos) - Amarilla */
    :global(.ct-series-b .ct-bar) { stroke: #facc15 !important; stroke-width: 25px; stroke-linecap: round; }

    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>