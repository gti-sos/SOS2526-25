<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let chartContainer;
    let message = $state("Cruzando Turistas con interés literario...");
    let isLoading = $state(true);

    async function safeJson(res) {
        try { return res.ok ? await res.json() : []; } catch { return []; }
    }

    onMount(async () => {
        if (!browser) return;

        try {
            // 1. Tus datos
            const resMis = await fetch("/api/v2/international-tourist-arrivals");
            const misDatos = await safeJson(resMis);

            // 2. API Externa: OpenLibrary (Buscamos libros sobre "turismo")
            // Usamos un pequeño truco: pedimos libros cuyo tema sea el país
            const labels = [];
            const dataTuristas = [];
            const dataLibros = [];

            // Para no saturar, elegimos 7 países de tu API
            const seleccion = misDatos.slice(0, 7);

            for (const d of seleccion) {
                const pais = d.country;
                // Consultamos cuántos libros hay sobre ese país en la Open Library
                const resExt = await fetch(`https://openlibrary.org/subjects/${pais.toLowerCase().replace(" ", "_")}.json?limit=1`);
                const libros = await resExt.json();
                
                labels.push(pais);
                dataTuristas.push(Number(d.air_arrival) || Number(d.arrivals_air) || 0);
                dataLibros.push(libros.work_count || 0);
            }

            // 3. Carga de Chartist (Librería súper ligera)
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
                series: [dataTuristas, dataLibros]
            }, {
                seriesBarDistance: 15,
                reverseData: true,
                horizontalBars: true,
                axisY: { offset: 70 }
            });

            isLoading = false;
            message = "";

        } catch (e) {
            console.error(e);
            message = "Error en la integración de Libros.";
            isLoading = false;
        }
    });
</script>

<main>
    <div class="header-nav"><a href="/integrations/aimar" class="back-btn">⬅ Volver</a></div>
    
    <div class="card">
        <div class="top-bar">
            <h2>📚 Turistas vs Cultura Literaria (Chartist)</h2>
            <p class="desc">Cruce con <strong>Open Library</strong>. ¿Es el país más visitado el que más libros inspira?</p>
            <div class="leyenda">
                <span class="l-t">■ Turistas</span> | <span class="l-l">■ Libros Publicados</span>
            </div>
        </div>

        {#if isLoading || message}
            <div class="loading-state">
                {#if isLoading}<span class="spinner">📖</span><br><br>{/if}
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
    main { padding: 2rem; max-width: 900px; margin: auto; }
    .card { background: #1e293b; padding: 2rem; border-radius: 20px; border: 1px solid #334155; }
    .top-bar h2 { color: #38bdf8; margin: 0; }
    .leyenda { margin-top: 1rem; font-size: 0.9rem; font-weight: bold; }
    .l-t { color: #d70206; } /* Color por defecto de Chartist serie A */
    .l-l { color: #f05b4f; } /* Color por defecto de Chartist serie B */
    .desc { color: #94a3b8; margin-top: 0.5rem; }
    .chart-box { background: #f8fafc; border-radius: 12px; padding: 2rem; border: 1px solid #334155; height: 400px; }
    .hidden { display: none !important; }
    .loading-state { text-align: center; padding: 5rem; color: #facc15; }
    .spinner { font-size: 2.5rem; display: inline-block; animation: pulse 1.5s infinite; }
    .back-btn { color: #38bdf8; text-decoration: none; border: 1px solid #38bdf8; padding: 0.5rem 1rem; border-radius: 8px; }
    
    /* Ajustes para que Chartist quepa bien */
    :global(.ct-chart) { height: 100%; width: 100%; }
    :global(.ct-label) { font-size: 14px; fill: #1e293b; color: #1e293b; }

    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>