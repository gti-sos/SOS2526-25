<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    // ¡AQUÍ ESTABA EL ERROR! Faltaba el $state para que la pantalla se actualice
    let message = $state("Cruzando datos de Turistas y Terremotos...");
    let isLoading = $state(true);
    let chartContainer;
    let chart;

    async function fetchWithTimeout(url, timeout = 10000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        return response;
    }

    async function safeJson(res) {
        try { return res.ok ? await res.json() : []; } catch { return []; }
    }

    onMount(async () => {
        if (!browser) return;

        try {
            const ApexCharts = (await import('apexcharts')).default;

            const resMis = await fetch("/api/v2/international-tourist-arrivals");
            const misDatos = await safeJson(resMis);

            let compiDatos = [];
            try {
                const resCompi = await fetchWithTimeout("https://sos2526-19.onrender.com/api/v1/earthquakes");
                compiDatos = await safeJson(resCompi);
            } catch (e) {
                message = "⚠️ La API del Grupo 19 está dormida o bloqueada. Abre su API en otra pestaña para despertarla.";
                isLoading = false; return;
            }

            if (misDatos.length === 0 || compiDatos.length === 0) {
                message = "⚠️ Faltan datos para cruzar. Verifica las APIs.";
                isLoading = false; return;
            }

            const sismosMap = new Map();
            compiDatos.forEach(item => {
                if (item.country && item.severity) {
                    let pais = String(item.country).trim().toLowerCase();
                    let mag = parseFloat(item.severity);
                    if (!sismosMap.has(pais) || sismosMap.get(pais) < mag) {
                        sismosMap.set(pais, mag);
                    }
                }
            });

            const diccionario = {
                "spain": "españa", "españa": "spain",
                "france": "francia", "francia": "france",
                "japan": "japón", "japón": "japan",
                "brazil": "brasil", "brasil": "brazil",
                "australia": "australia",
                "poland": "polonia", "polonia": "poland",
                "mexico": "méxico"
            };

            let seriesData = [];
            let labelsData = [];
            let touristsData = []; 
            let maxPaises = 6; 

            misDatos.forEach(d => {
                let miPais = String(d.country || "").trim().toLowerCase();
                let paisTraducido = diccionario[miPais] || miPais;
                
                let magnitudEncontrada = 0;
                if (sismosMap.has(miPais)) magnitudEncontrada = sismosMap.get(miPais);
                else if (sismosMap.has(paisTraducido)) magnitudEncontrada = sismosMap.get(paisTraducido);

                if (magnitudEncontrada > 0 && labelsData.length < maxPaises && !labelsData.includes(d.country)) {
                    labelsData.push(d.country);
                    seriesData.push(Math.round(magnitudEncontrada * 10)); 
                    let misTuristas = d.air_arrival || d.arrivals_air || 0;
                    touristsData.push(misTuristas); 
                }
            });

            if (seriesData.length === 0) {
                message = "⚠️ No compartís países. Añade 'France', 'Japan' o 'Mexico' a tu API.";
                isLoading = false; return;
            }

            message = "";
            isLoading = false;

            const options = {
                series: seriesData,
                chart: {
                    height: 600,
                    type: 'radialBar',
                    background: 'transparent'
                },
                plotOptions: {
                    radialBar: {
                        hollow: { size: '30%' }, 
                        track: { background: '#1e293b', margin: 15 },
                        dataLabels: {
                            name: { fontSize: '22px', color: '#cbd5e1' },
                            value: { 
                                fontSize: '18px', 
                                color: '#38bdf8',
                                formatter: function (val) {
                                    return "Severidad: " + (val / 10).toFixed(1);
                                }
                            },
                            total: { show: true, label: 'Top Sismos', color: '#a855f7' }
                        }
                    }
                },
                labels: labelsData,
                theme: { mode: 'dark', palette: 'palette1' },
                stroke: { lineCap: 'round' },
                tooltip: {
                    enabled: true,
                    theme: 'dark',
                    y: {
                        formatter: function(val, opts) {
                            let realMag = (val / 10).toFixed(1);
                            let turistas = touristsData[opts.seriesIndex] || 0;
                            return `Severidad: ${realMag} | 🛬 Turistas: ${turistas.toLocaleString()}`;
                        }
                    }
                },
                legend: {
                    show: true,
                    position: 'right',
                    labels: { colors: '#cbd5e1' },
                    fontSize: '14px',
                    formatter: function(seriesName, opts) {
                        let index = opts.seriesIndex !== undefined ? opts.seriesIndex : 0;
                        let turistas = touristsData[index] || 0;
                        return `${seriesName} (🛬 ${turistas.toLocaleString()} turistas)`;
                    }
                }
            };

            chart = new ApexCharts(chartContainer, options);
            chart.render();

        } catch (error) {
            console.error(error);
            message = "Error interno cargando la gráfica.";
            isLoading = false;
        }
    });
</script>

<main>
    <div class="header-nav">
        <a href="/integrations/aimar" class="back-btn">⬅ Volver a Integraciones Aimar</a>
    </div>

    <div class="card">
        <div class="top-bar">
            <h2>🌍 Turistas vs Terremotos (ApexCharts)</h2>
            <p class="desc">
                Integración directa con el grupo SOS2526-19.<br>
                Compara la intensidad de los sismos en tus destinos turísticos.
            </p>
        </div>

        {#if isLoading || message}
            <div class="loading-state">
                {#if isLoading}<span class="spinner">⏳</span><br><br>{/if}
                {message}
            </div>
        {/if}

        <div class="chart-box" class:hidden={isLoading || (message && message.includes("⚠️") || message.includes("Error"))}>
            <div bind:this={chartContainer} class="apex-center"></div>
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
    .desc { color: #94a3b8; margin-top: 0; margin-bottom: 1.5rem; }
    .loading-state { text-align: center; padding: 3rem; color: #facc15; font-size: 1.1rem;}
    .spinner { font-size: 2rem; display: inline-block; animation: pulse 1.5s infinite; }
    .chart-box { background: #0b1120; border-radius: 12px; padding: 1rem; border: 1px solid #334155; }
    .hidden { display: none !important; }
    .apex-center { display: flex; justify-content: center; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>