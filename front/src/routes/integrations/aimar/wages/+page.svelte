<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Cruzando datos de Turistas vs Salarios...");
    let chartContainer;
    let isLoading = $state(true);

    async function safeJson(res) {
        try { return res.ok ? await res.json() : []; } catch { return []; }
    }

    onMount(async () => {
        if (!browser) return;

        try {
            const c3 = (await import('c3')).default;

            const resMis = await fetch("/api/v2/international-tourist-arrivals");
            const misDatos = await safeJson(resMis);

            const resCompi = await fetch("https://sos2526-24.onrender.com/api/v1/average-monthly-wages");
            const compiDatos = await safeJson(resCompi);

            if (misDatos.length === 0 || compiDatos.length === 0) {
                message = "⚠️ Faltan datos en alguna de las APIs para cruzar.";
                isLoading = false; return;
            }

            const wagesMap = new Map();
            compiDatos.forEach(item => {
                if (item.country) {
                    let salario = Object.values(item).find(v => typeof v === 'number' && v > 0) || 0;
                    wagesMap.set(item.country.toLowerCase().trim(), salario);
                }
            });

            let paises = ['x']; 
            let turistas = ['Tus Turistas']; 
            let salarios = ['Salario Medio (€)']; 

            misDatos.forEach(d => {
                let pais = String(d.country || "").trim().toLowerCase();
                
                if (wagesMap.has(pais) && paises.length <= 8 && !paises.includes(d.country)) {
                    paises.push(d.country);
                    let misTuristas = d.air_arrival || d.arrivals_air || 0;
                    turistas.push(misTuristas);
                    salarios.push(wagesMap.get(pais));
                }
            });

            if (paises.length === 1) {
                message = "⚠️ No hay coincidencia de países. Añade 'Spain', 'Italy' o 'Germany'.";
                isLoading = false; return;
            }

            message = "";
            isLoading = false;

            // EL TRUCO ANTIMAGIA DE SVELTE 5: Clonamos el array para que C3.js lo lea como un array normal
            const columnasLimpias = JSON.parse(JSON.stringify([paises, turistas, salarios]));

            c3.generate({
                bindto: chartContainer,
                data: {
                    x: 'x',
                    columns: columnasLimpias,
                    type: 'spline', 
                    axes: {
                        'Tus Turistas': 'y', 
                        'Salario Medio (€)': 'y2' 
                    },
                    colors: {
                        'Tus Turistas': '#38bdf8', 
                        'Salario Medio (€)': '#f43f5e' 
                    }
                },
                axis: {
                    x: { type: 'category' },
                    y: { 
                        label: { text: 'Cantidad de Turistas', position: 'outer-middle' },
                        tick: { format: function (d) { return d.toLocaleString(); } }
                    },
                    y2: { 
                        show: true, 
                        label: { text: 'Euros (€)', position: 'outer-middle' },
                        tick: { format: function (d) { return d + " €"; } }
                    }
                },
                grid: { y: { show: true } },
                tooltip: {
                    format: {
                        title: function (x) { return 'País: ' + paises[x + 1]; }
                    }
                }
            });

        } catch (error) {
            console.error(error);
            message = "Error cargando C3.js";
            isLoading = false;
        }
    });
</script>

<svelte:head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/c3/0.7.20/c3.min.css">
</svelte:head>

<main>
    <div class="header-nav">
        <a href="/integrations/aimar" class="back-btn">⬅ Volver a Integraciones Aimar</a>
    </div>

    <div class="card">
        <div class="top-bar">
            <h2>🌍 Turistas vs Salario Medio (C3.js Spline)</h2>
            <p class="desc">
                Integración con SOS-24 usando Doble Escala.<br> 
                ¿Viajan más turistas a países con salarios altos o bajos?
            </p>
        </div>

        {#if isLoading || message}
            <div class="loading-state">
                {#if isLoading}<span class="spinner">⏳</span><br><br>{/if}
                {message}
            </div>
        {/if}

        <div class="chart-box" class:hidden={isLoading || (message && message.includes("⚠️") || message.includes("Error"))}>
            <div bind:this={chartContainer}></div>
        </div>
    </div>
</main>

<style>
    :global(body) { background: #0f172a; color: white; margin: 0; font-family: 'Segoe UI', sans-serif; }
    main { padding: 2rem; max-width: 1000px; margin: auto; }
    .header-nav { margin-bottom: 2rem; }
    .back-btn { color: #38bdf8; text-decoration: none; font-weight: bold; border: 1px solid #38bdf8; padding: 0.5rem 1rem; border-radius: 8px; transition: 0.3s; }
    .back-btn:hover { background: rgba(56, 189, 248, 0.2); }
    .card { background: #1e293b; padding: 2rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); border: 1px solid #334155;}
    .top-bar h2 { margin: 0 0 0.5rem 0; color: #38bdf8; }
    .desc { color: #94a3b8; margin-top: 0; margin-bottom: 2rem; }
    .loading-state { text-align: center; padding: 3rem; color: #facc15; font-size: 1.1rem;}
    .spinner { font-size: 2rem; display: inline-block; animation: pulse 1.5s infinite; }
    .chart-box { background: #0b1120; border-radius: 12px; padding: 1.5rem; border: 1px solid #334155; }
    .hidden { display: none !important; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

    /* FORZAR LA APARICIÓN DE LAS LÍNEAS DE C3.JS */
    :global(path.c3-line) {
        fill: none !important;
        stroke-width: 3px !important;
        opacity: 1 !important;
    }
    :global(circle.c3-circle) {
        r: 4 !important;
        opacity: 1 !important;
    }

    /* CSS GLOBAL C3.JS - TEXTOS DE LOS EJES */
    :global(.c3-axis-x text), :global(.c3-axis-y text), :global(.c3-axis-y2 text) { fill: #cbd5e1 !important; font-size: 12px; }
    :global(.c3-axis path), :global(.c3-axis line) { stroke: #475569 !important; }
    :global(.c3-legend-item text) { fill: #f8fafc !important; font-size: 14px; }
    :global(.c3-grid line) { stroke: #334155 !important; stroke-dasharray: 4; }

    /* ARREGLO DEL TOOLTIP Y EL CUADRO BLANCO */
    :global(.c3-tooltip-container) { background: transparent !important; }
    :global(.c3-tooltip) { background-color: #1e293b !important; color: white !important; border: 1px solid #38bdf8 !important; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.5) !important; opacity: 0.95; }
    :global(.c3-tooltip th) { background-color: #0f172a !important; color: #38bdf8 !important; border-bottom: 1px solid #334155 !important; padding: 8px !important; }
    :global(.c3-tooltip td) { background-color: #1e293b !important; color: white !important; border-bottom: 1px solid #334155 !important; padding: 8px !important; }
    :global(.c3-tooltip td.name span) { border: 1px solid #fff !important; }
</style>