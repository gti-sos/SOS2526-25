<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Consultando registros globales de COVID-19...");
    let chartContainer;
    let chartInstance;
    let datosCompletos = $state([]); 
    
    let availableYears = $state([]);
    let selectedYear = $state("");

    async function safeJson(res) {
        try { return res.ok ? await res.json() : []; } catch { return []; }
    }

    onMount(async () => {
        if (!browser) return;

        try {
            const resMis = await fetch("/api/v2/social-drinking-behaviors");
            const misDatos = await safeJson(resMis);

            // NUEVA API: disease.sh (Open Disease Data API)
            // Devuelve estadísticas globales acumuladas de COVID-19 por país. ¡Ni CORS ni keys!
            const resCovid = await fetch("https://disease.sh/v3/covid-19/countries");
            const covidDatos = await safeJson(resCovid);

            if (misDatos.length === 0 || covidDatos.length === 0) {
                message = "⚠️ Faltan datos para cruzar.";
                return;
            }

            // 1. Mapeamos Casos de COVID por Millón
            const covidMap = new Map();
            covidDatos.forEach(c => {
                if (c.country && c.casesPerOneMillion) {
                    let nombre = c.country.toLowerCase();
                    
                    // Adaptamos los nombres que usa disease.sh a tu base de datos
                    if (nombre === "usa") nombre = "united states of america";
                    if (nombre === "uk") nombre = "united kingdom";
                    if (nombre === "s. korea") nombre = "south korea";
                    if (nombre === "russia") nombre = "russian federation";

                    // Dividimos entre 1000 para que sea "Miles de casos" y la gráfica mixta se lea bien
                    covidMap.set(nombre, c.casesPerOneMillion / 1000);
                }
            });

            let tempYears = new Set();
            let cruzados = [];
            let paisesProcesados = new Set();

            // 2. Cruzamos con tus datos de consumo
            misDatos.forEach(d => {
                let pais = String(d.country).trim().toLowerCase();
                let anio = String(d.year); 
                
                if (covidMap.has(pais)) {
                    tempYears.add(anio);
                    let claveUnica = `${pais}_${anio}`;

                    if (!paisesProcesados.has(claveUnica)) {
                        paisesProcesados.add(claveUnica);
                        cruzados.push({
                            country: d.country,
                            year: anio,
                            casosCovid: Number(covidMap.get(pais).toFixed(1)),
                            alcoholTotal: (Number(d.beer_share) || 0) + (Number(d.wine_share) || 0) + (Number(d.spirits_share) || 0)
                        });
                    }
                }
            });

            if (cruzados.length === 0) {
                message = "⚠️ No hay suficientes coincidencias.";
                return;
            }

            datosCompletos = cruzados;
            availableYears = Array.from(tempYears).sort().reverse(); 
            selectedYear = availableYears[0]; 
            message = "";

            esperarYRenderizar();

        } catch (error) {
            console.error(error);
            message = "Error crítico cargando los datos.";
        }
    });

    function esperarYRenderizar() {
        const check = setInterval(() => {
            if (window.frappe && chartContainer) {
                clearInterval(check);
                dibujarGrafica();
            }
        }, 100);
    }

    $effect(() => {
        if (selectedYear && datosCompletos.length > 0 && browser && window.frappe) {
            dibujarGrafica();
        }
    });

    function dibujarGrafica() {
        if (!window.frappe || !chartContainer) return;

        let datosFiltrados = datosCompletos.filter(d => d.year === selectedYear);
        
        // Cogemos el Top 15 países con MÁS incidencia de COVID
        datosFiltrados.sort((a, b) => b.casosCovid - a.casosCovid);
        datosFiltrados = datosFiltrados.slice(0, 15);

        const data = {
            labels: datosFiltrados.map(d => d.country),
            datasets: [
                { name: "COVID (Miles/1M hab.)", type: "bar", values: datosFiltrados.map(d => d.casosCovid) },
                { name: "Alcohol Total (%)", type: "line", values: datosFiltrados.map(d => d.alcoholTotal) }
            ]
        };

        if (chartInstance) {
            chartInstance.update(data);
        } else {
            chartInstance = new window.frappe.Chart(chartContainer, {
                data: data,
                title: `Top 15: Incidencia COVID-19 vs Consumo (${selectedYear})`,
                type: 'axis-mixed', 
                height: 400,
                colors: ['#ef4444', '#38bdf8'],
                tooltipOptions: { formatTooltipY: d => d }
            });
        }
    }
</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/frappe-charts@1.6.2/dist/frappe-charts.min.umd.js"></script>
</svelte:head>

<main>
    <div class="header-nav">
        <a href="/integrations/juan-luis" class="back-btn">⬅ Volver a Integraciones Juan Luis</a>
    </div>

    <div class="card">
        <div class="top-bar">
            <h2>🦠 Salud y Consumo (Frappe Charts)</h2>
            <p class="desc">Cruce mundial con la incidencia histórica de COVID-19 extraída de <strong>disease.sh</strong>. Compara casos confirmados con los hábitos de consumo.</p>
        </div>

        {#if message}
            <div class="loading-state">{message}</div>
        {:else}
            <div class="controls">
                <label>📅 Año de consumo:</label>
                <select bind:value={selectedYear}>
                    {#each availableYears as yr} <option value={yr}>{yr}</option> {/each}
                </select>
            </div>
            <div class="chart-box">
                <!-- Frappe necesita fondo blanco/claro por defecto -->
                <div bind:this={chartContainer} style="background: white; border-radius: 8px; padding: 10px;"></div>
            </div>
        {/if}
    </div>
</main>

<style>
    :global(body) { background: #0f172a; color: white; margin: 0; font-family: sans-serif; }
    main { padding: 2rem; max-width: 900px; margin: auto; }
    .header-nav { margin-bottom: 2rem; }
    .back-btn { color: #ef4444; text-decoration: none; border: 1px solid #ef4444; padding: 0.5rem 1rem; border-radius: 8px; font-weight: bold; transition: 0.3s; }
    .back-btn:hover { background: rgba(239, 68, 68, 0.2); }
    .card { background: #1e293b; padding: 2rem; border-radius: 20px; border: 1px solid #334155; }
    .top-bar h2 { color: #ef4444; margin: 0 0 0.5rem 0; }
    .desc { color: #94a3b8; margin-bottom: 1.5rem; }
    .controls { background: #0b1120; padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; font-weight: bold; color: #cbd5e1; }
    select { background: #1e293b; color: #ef4444; padding: 0.5rem; border-radius: 5px; font-weight: bold; border: 1px solid #ef4444; }
    .loading-state { color: #facc15; padding: 2rem; text-align: center; font-weight: bold; font-size: 1.2rem; }
</style>