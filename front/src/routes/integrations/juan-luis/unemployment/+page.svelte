<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Consultando tasas de desempleo globales...");
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

            // API Banco Mundial: Desempleo Total (% de la fuerza laboral)
            const resWB = await fetch("https://api.worldbank.org/v2/country/all/indicator/SL.UEM.TOTL.ZS?format=json&date=2015:2022&per_page=3000");
            const wbDatos = await safeJson(resWB);

            if (misDatos.length === 0 || !wbDatos[1]) {
                message = "⚠️ Faltan datos para cruzar.";
                return;
            }

            const desempleoMap = new Map();
            wbDatos[1].forEach(item => {
                if (item.country && item.value !== null && item.date) {
                    let nombre = item.country.value.toLowerCase();
                    if (nombre.includes("united states")) nombre = "united states of america";
                    if (nombre.includes("united kingdom")) nombre = "united kingdom";
                    if (nombre.includes("russia")) nombre = "russian federation";
                    
                    desempleoMap.set(`${nombre}_${item.date}`, item.value);
                }
            });

            let tempYears = new Set();
            let cruzados = [];

            misDatos.forEach(d => {
                let pais = String(d.country).trim().toLowerCase();
                let anio = String(d.year); 
                let clave = `${pais}_${anio}`;
                
                if (desempleoMap.has(clave)) {
                    tempYears.add(anio);
                    cruzados.push({
                        country: d.country,
                        year: anio,
                        desempleo: Number(desempleoMap.get(clave).toFixed(1)),
                        alcoholTotal: (Number(d.beer_share) || 0) + (Number(d.wine_share) || 0) + (Number(d.spirits_share) || 0)
                    });
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
        // Cogemos el Top 15 países con MÁS desempleo
        datosFiltrados.sort((a, b) => b.desempleo - a.desempleo);
        datosFiltrados = datosFiltrados.slice(0, 15);

        const data = {
            labels: datosFiltrados.map(d => d.country),
            datasets: [
                { name: "Paro (%)", type: "bar", values: datosFiltrados.map(d => d.desempleo) },
                { name: "Alcohol Total (%)", type: "line", values: datosFiltrados.map(d => d.alcoholTotal) }
            ]
        };

        if (chartInstance) {
            chartInstance.update(data);
        } else {
            chartInstance = new window.frappe.Chart(chartContainer, {
                data: data,
                title: "Top 15: Tasa de Paro vs Consumo",
                type: 'axis-mixed', // Gráfico mixto
                height: 400,
                colors: ['#ef4444', '#38bdf8'],
                tooltipOptions: { formatTooltipY: d => d + ' %' }
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
            <h2>💼 Desempleo vs Consumo (Frappe Charts)</h2>
            <p class="desc">Cruce con la tasa de desempleo del Banco Mundial. Diseño mixto minimalista.</p>
        </div>

        {#if message}
            <div class="loading-state">{message}</div>
        {:else}
            <div class="controls">
                <label>📅 Año:</label>
                <select bind:value={selectedYear}>
                    {#each availableYears as yr} <option value={yr}>{yr}</option> {/each}
                </select>
            </div>
            <div class="chart-box">
                <!-- Frappe necesita fondo blanco/claro por defecto, lo adaptamos -->
                <div bind:this={chartContainer} style="background: white; border-radius: 8px; padding: 10px;"></div>
            </div>
        {/if}
    </div>
</main>

<style>
    :global(body) { background: #0f172a; color: white; margin: 0; font-family: sans-serif; }
    main { padding: 2rem; max-width: 900px; margin: auto; }
    .header-nav { margin-bottom: 2rem; }
    .back-btn { color: #ef4444; text-decoration: none; border: 1px solid #ef4444; padding: 0.5rem 1rem; border-radius: 8px; }
    .card { background: #1e293b; padding: 2rem; border-radius: 20px; border: 1px solid #334155; }
    .top-bar h2 { color: #ef4444; margin: 0 0 0.5rem 0; }
    .desc { color: #94a3b8; margin-bottom: 1.5rem; }
    .controls { background: #0b1120; padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; }
    select { background: #1e293b; color: #ef4444; padding: 0.5rem; border-radius: 5px; }
    .loading-state { color: #facc15; padding: 2rem; text-align: center; }
</style>