<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Cruzando datos con el Banco Mundial...");
    let chartContainer;
    let chart;
    let isLoading = $state(true);

    async function safeJson(res) {
        try { return res.ok ? await res.json() : []; } catch { return []; }
    }

    onMount(async () => {
        if (!browser) return;

        try {
            // 1. Importamos ApexCharts dinámicamente
            const ApexCharts = (await import('apexcharts')).default;

            // 2. Fetch a tu API
            const resMis = await fetch("/api/v2/social-drinking-behaviors");
            const misDatos = await safeJson(resMis);

            // 3. Fetch a la API del BANCO MUNDIAL (Esperanza de vida al nacer, datos del último año disponible)
            const resWB = await fetch("https://api.worldbank.org/v2/country/all/indicator/SP.DYN.LE00.IN?format=json&date=2021&per_page=300");
            const wbDatos = await safeJson(resWB);

            if (misDatos.length === 0 || !wbDatos[1]) {
                message = "⚠️ Faltan datos para cruzar.";
                isLoading = false;
                return;
            }

            // 4. Mapeamos los datos del Banco Mundial
            // El Banco Mundial devuelve [ {metadata}, [ {country: {value: "Spain"}, value: 83.2}, ... ] ]
            const esperanzaVidaMap = new Map();
            wbDatos[1].forEach(item => {
                if (item.country && item.value) {
                    let nombre = item.country.value.toLowerCase();
                    // Normalizamos un par de nombres comunes para que coincidan con tu BD
                    if (nombre.includes("united states")) nombre = "united states of america";
                    if (nombre.includes("united kingdom")) nombre = "united kingdom";
                    if (nombre.includes("russia")) nombre = "russian federation";
                    
                    esperanzaVidaMap.set(nombre, item.value);
                }
            });

            // 5. Preparamos las series de burbujas para ApexCharts
            let seriesData = [];
            let paisesProcesados = new Set();

            misDatos.forEach(d => {
                let pais = String(d.country).trim().toLowerCase();
                
                if (esperanzaVidaMap.has(pais) && !paisesProcesados.has(pais)) {
                    paisesProcesados.add(pais);
                    
                    let esperanzaVida = esperanzaVidaMap.get(pais);
                    let vino = Number(d.wine_share) || 0;
                    let cerveza = Number(d.beer_share) || 0;

                    // ApexCharts Bubble formato: [X, Y, Z (Tamaño de burbuja)]
                    // X = Esperanza de Vida, Y = % Vino, Z = % Cerveza
                    seriesData.push({
                        name: d.country,
                        data: [[esperanzaVida, vino, cerveza]]
                    });
                }
            });

            if (seriesData.length === 0) {
                message = "⚠️ No hubo coincidencias exactas de países.";
                isLoading = false;
                return;
            }

            message = "";
            isLoading = false;

            // 6. Configuración Visual de ApexCharts
            const options = {
                series: seriesData,
                chart: {
                    type: 'bubble',
                    height: 600,
                    background: 'transparent',
                    toolbar: { show: false },
                    animations: { dynamicAnimation: { speed: 1000 } }
                },
                dataLabels: { enabled: false },
                fill: { opacity: 0.8 },
                title: {
                    text: 'Esperanza de Vida vs Consumo (Vino y Cerveza)',
                    align: 'left',
                    style: { color: '#38bdf8', fontSize: '20px' }
                },
                xaxis: {
                    title: { text: 'Esperanza de Vida (Años)', style: { color: '#cbd5e1' } },
                    labels: { style: { colors: '#cbd5e1' }, formatter: (val) => val.toFixed(1) },
                    tickAmount: 8
                },
                yaxis: {
                    title: { text: 'Cuota de Vino (%)', style: { color: '#cbd5e1' } },
                    labels: { style: { colors: '#cbd5e1' } }
                },
                theme: { mode: 'dark', palette: 'palette1' },
                tooltip: {
                    theme: 'dark',
                    custom: function({ seriesIndex, w }) {
                        let data = w.globals.initialSeries[seriesIndex];
                        let coords = data.data[0];
                        return `
                            <div style="padding: 10px; background: #1e293b; border: 1px solid #38bdf8; border-radius: 5px;">
                                <strong style="color: #38bdf8; font-size: 16px;">${data.name}</strong><br/>
                                🏥 Esperanza de Vida: <b>${coords[0].toFixed(1)} años</b><br/>
                                🍷 Consumo de Vino: <b>${coords[1]}%</b><br/>
                                🍺 Consumo de Cerveza: <b>${coords[2]}%</b>
                            </div>
                        `;
                    }
                },
                grid: { borderColor: '#334155', strokeDashArray: 4 }
            };

            chart = new ApexCharts(chartContainer, options);
            chart.render();

        } catch (error) {
            console.error(error);
            message = "Error cargando la gráfica.";
            isLoading = false;
        }
    });
</script>

<main>
    <div class="header-nav">
        <a href="/integrations/juan-luis" class="back-btn">⬅ Volver al Panel</a>
    </div>

    <div class="card">
        <div class="top-bar">
            <h2>🌍 Salud Pública y Consumo (ApexCharts)</h2>
            <p class="desc">
                Datos de Esperanza de Vida extraídos de la API oficial del <strong>Banco Mundial (World Bank)</strong>. <br>
                Eje X: Años de vida | Eje Y: % de Vino | Tamaño de la Burbuja: % de Cerveza.
            </p>
        </div>

        {#if isLoading}
            <div class="loading-state">
                <span class="spinner">⏳ Procesando datos globales...</span>
            </div>
        {:else if message}
            <p class="status-msg">{message}</p>
        {/if}

        <div class="chart-box" class:hidden={isLoading || !!message}>
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
    .desc { color: #94a3b8; margin-top: 0; margin-bottom: 1.5rem; line-height: 1.5; }

    .loading-state { text-align: center; padding: 3rem; }
    .spinner { color: #facc15; font-size: 1.2rem; animation: pulse 1.5s infinite; font-weight: bold; }
    
    .status-msg { color: #ef4444; font-size: 1.2rem; text-align: center; border: 2px dashed #ef4444; padding: 1rem; border-radius: 8px; }

    .chart-box { background: #0b1120; border-radius: 12px; padding: 1rem; border: 1px solid #334155; }
    .hidden { display: none !important; }

    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>