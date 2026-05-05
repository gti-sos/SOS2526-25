<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Calculando estimaciones de gasto y ocio...");
    let chartCanvas;
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
            // 1. Fetch de tu API
            const resMis = await fetch("/api/v2/social-drinking-behaviors");
            const misDatos = await safeJson(resMis);

            // 2. Fetch a la API del Banco Mundial (PIB per Cápita del 2015 al 2022)
            const resWB = await fetch("https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.CD?format=json&date=2015:2022&per_page=3000");
            const wbDatos = await safeJson(resWB);

            if (misDatos.length === 0 || !wbDatos[1]) {
                message = "⚠️ Faltan datos para cruzar.";
                return;
            }

            // 3. Mapeamos la riqueza (PIB) por País y Año
            const riquezaMap = new Map();
            wbDatos[1].forEach(item => {
                if (item.country && item.value && item.date) {
                    let nombre = item.country.value.toLowerCase();
                    if (nombre.includes("united states")) nombre = "united states of america";
                    if (nombre.includes("united kingdom")) nombre = "united kingdom";
                    if (nombre.includes("russia")) nombre = "russian federation";
                    
                    riquezaMap.set(`${nombre}_${item.date}`, item.value);
                }
            });

            let tempYears = new Set();
            let cruzados = [];

            misDatos.forEach(d => {
                let pais = String(d.country).trim().toLowerCase();
                let anio = String(d.year); 
                let clave = `${pais}_${anio}`;
                
                if (riquezaMap.has(clave)) {
                    tempYears.add(anio);
                    
                    let pibPerCapita = riquezaMap.get(clave);
                    
                    // IMPUTACIÓN DE DATOS PROXY (Ocio y Vicios)
                    // Asumimos un 1.5% del PIB per cápita gastado en ocio nocturno/casinos
                    let gastoCasino = (pibPerCapita * 0.015).toFixed(0); 
                    // Asumimos visitas en base a la riqueza
                    let visitas = (pibPerCapita / 1000).toFixed(1);

                    cruzados.push({
                        country: d.country,
                        year: anio,
                        gasto: Number(gastoCasino),
                        visitas: Number(visitas),
                        cerveza: Number(d.beer_share) || 0,
                        vino: Number(d.wine_share) || 0,
                        alcohol: Number(d.spirits_share) || 0
                    });
                }
            });

            if (cruzados.length === 0) {
                message = "⚠️ No hay coincidencias temporales.";
                return;
            }

            datosCompletos = cruzados;
            availableYears = Array.from(tempYears).sort().reverse(); 
            selectedYear = availableYears[0]; 
            message = "";

            // Esperamos a que el CDN de Chart.js termine de cargar en el head
            esperarYRenderizar();

        } catch (error) {
            console.error(error);
            message = "Error cargando datos del simulador.";
        }
    });

    function esperarYRenderizar() {
        const checkChart = setInterval(() => {
            if (window.Chart && chartCanvas) {
                clearInterval(checkChart);
                dibujarGrafica();
            }
        }, 100);
    }

    $effect(() => {
        if (selectedYear && datosCompletos.length > 0 && browser && window.Chart) {
            dibujarGrafica();
        }
    });

    function dibujarGrafica() {
        if (!window.Chart || !chartCanvas) return;

        // Filtramos por año y cogemos solo los 12 países que MÁS gastan 
        // para que la "Ruleta" no se sature de porciones diminutas
        let datosFiltrados = datosCompletos.filter(d => d.year === selectedYear);
        datosFiltrados.sort((a, b) => b.gasto - a.gasto);
        datosFiltrados = datosFiltrados.slice(0, 12); 

        const labels = datosFiltrados.map(d => d.country);
        const dataValues = datosFiltrados.map(d => d.gasto);
        
        // Destruimos la gráfica anterior si existe para redibujar la nueva
        if (chartInstance) {
            chartInstance.destroy();
        }

        // Paleta de colores estilo Casino (Verde tapete, Rojos, Dorados, Negros)
        const coloresCasino = [
            '#ef4444', '#facc15', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899',
            '#f97316', '#14b8a6', '#6366f1', '#eab308', '#f43f5e', '#84cc16'
        ];

        chartInstance = new window.Chart(chartCanvas, {
            type: 'polarArea', // El gráfico de la "Ruleta"
            data: {
                labels: labels,
                datasets: [{
                    label: 'Gasto Medio en Ocio/Casinos ($)',
                    data: dataValues,
                    backgroundColor: coloresCasino.map(color => color + '80'), // Le damos 50% de opacidad (Hex 80)
                    borderColor: coloresCasino,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        ticks: { backdropColor: 'transparent', color: '#cbd5e1' },
                        grid: { color: '#334155' }
                    }
                },
                plugins: {
                    legend: { position: 'right', labels: { color: '#cbd5e1', padding: 20 } },
                    // EL TOOLTIP PERSONALIZADO CON TUS REQUISITOS
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#38bdf8',
                        bodyColor: '#ffffff',
                        borderColor: '#38bdf8',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const index = context.dataIndex;
                                const paisData = datosFiltrados[index];
                                // Array de strings para generar saltos de línea
                                return [
                                    `💵 Gasto por persona: $${paisData.gasto}`,
                                    `🎲 Frecuencia/Casinos: ${paisData.visitas} /1000 hab.`,
                                    `---------------------------------`,
                                    `🍺 Cerveza: ${paisData.cerveza}%`,
                                    `🍷 Vino: ${paisData.vino}%`,
                                    `🥃 Licores Fuertes: ${paisData.alcohol}%`
                                ];
                            }
                        }
                    }
                }
            }
        });
    }
</script>

<svelte:head>
    <!-- Chart.js oficial vía CDN -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</svelte:head>

<main>
    <div class="header-nav">
        <a href="/integrations/juan-luis" class="back-btn">⬅ Volver al Panel</a>
    </div>

    <div class="card">
        <div class="top-bar">
            <h2>🎰 Vicios, Juego y Alcohol (Chart.js)</h2>
            <p class="desc">
                Análisis Proxy combinando consumo de alcohol e indicadores de riqueza del Banco Mundial 
                para estimar el gasto en Casinos y Ocio. Visualización en <strong>Área Polar (Ruleta)</strong>.
            </p>
        </div>

        {#if message}
            <div class="loading-state">
                <span class="spinner">{message}</span>
            </div>
        {:else}
            <!-- EL FILTRO DE AÑO -->
            <div class="controls">
                <label for="yearSelector">📅 Año del Análisis:</label>
                <select id="yearSelector" bind:value={selectedYear}>
                    {#each availableYears as yr}
                        <option value={yr}>Año {yr}</option>
                    {/each}
                </select>
                <span class="badge">Top 12 países del año seleccionado</span>
            </div>

            <div class="chart-box">
                <!-- Chart.js necesita un canvas, no un div -->
                <canvas bind:this={chartCanvas}></canvas>
            </div>
        {/if}
    </div>
</main>

<style>
    :global(body) { background: #0f172a; color: white; margin: 0; font-family: 'Segoe UI', sans-serif; }
    main { padding: 2rem; max-width: 1000px; margin: auto; }
    .header-nav { margin-bottom: 2rem; }
    
    .back-btn { color: #facc15; text-decoration: none; font-weight: bold; border: 1px solid #facc15; padding: 0.5rem 1rem; border-radius: 8px; transition: 0.3s; }
    .back-btn:hover { background: rgba(250, 204, 21, 0.2); }
    
    .card { background: #1e293b; padding: 2rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); border: 1px solid #334155;}
    
    .top-bar h2 { margin: 0 0 0.5rem 0; color: #facc15; }
    .desc { color: #94a3b8; margin-top: 0; margin-bottom: 1.5rem; line-height: 1.5; }

    .controls { background: #0b1120; padding: 1.5rem; border-radius: 12px; border: 1px solid #334155; margin-bottom: 2rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .controls label { color: #cbd5e1; font-weight: bold; font-size: 1.1rem; }
    select { background: #1e293b; color: #facc15; border: 1px solid #facc15; padding: 0.6rem 1rem; border-radius: 8px; font-size: 1rem; cursor: pointer; outline: none; font-weight: bold;}
    
    .badge { background: rgba(250, 204, 21, 0.1); color: #facc15; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.9rem; border: 1px solid #facc15; }

    .loading-state { text-align: center; padding: 3rem; color: #facc15; font-size: 1.2rem; border: 2px dashed #facc15; border-radius: 8px;}
    
    .chart-box { 
        background: #0b1120; 
        border-radius: 12px; 
        padding: 1rem; 
        border: 1px solid #334155;
        height: 600px; /* Chart.js funciona mejor con alturas fijas en el contenedor */
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>