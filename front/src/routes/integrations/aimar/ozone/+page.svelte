<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    // 1. Reactividad Svelte 5 activada
    let message = $state("Cruzando datos de Turistas vs Ozono...");
    let isLoading = $state(true);
    
    // ZingChart necesita un ID en el div sí o sí
    const chartId = "zingchart-ozone";

    // 2. Límite de tiempo por si la API del Grupo 22 está apagada (Render)
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
            // Fetch a tu API
            const resMis = await fetch("/api/v2/international-tourist-arrivals");
            const misDatos = await safeJson(resMis);

            // Fetch a la API de Ozono con temporizador de seguridad
            let compiDatos = [];
            try {
                const resCompi = await fetchWithTimeout("https://sos2526-22.onrender.com/api/v1/ozone-depleting-substance-consumptions");
                compiDatos = await safeJson(resCompi);
            } catch (e) {
                message = "⚠️ La API del Grupo 22 está dormida. Abre su enlace en otra pestaña.";
                isLoading = false; return;
            }

            if (misDatos.length === 0 || compiDatos.length === 0) {
                message = "⚠️ Faltan datos para cruzar. Verifica las APIs.";
                isLoading = false; return;
            }

            // Mapeamos los datos de Ozono (Buscamos cualquier valor numérico válido)
            const ozoneMap = new Map();
            compiDatos.forEach(item => {
                if (item.country) {
                    let nombre = String(item.country).trim().toLowerCase();
                    let valorNumerico = Object.values(item).find(v => typeof v === 'number' && v > 0) || 0;
                    
                    if (!ozoneMap.has(nombre) || ozoneMap.get(nombre) < valorNumerico) {
                        ozoneMap.set(nombre, valorNumerico);
                    }
                }
            });

            // Agrupamos tus datos para que no haya duplicados
            let labels = [];
            let dataLlegadas = [];
            let dataOzone = [];

            misDatos.forEach(d => {
                let pais = String(d.country || "").trim().toLowerCase();
                
                // Salvavidas: Busca air_arrival o arrivals_air
                let misTuristas = Number(d.air_arrival) || Number(d.arrivals_air) || 0;

                if (ozoneMap.has(pais) && !labels.includes(d.country)) {
                    labels.push(d.country);
                    dataLlegadas.push(misTuristas);
                    dataOzone.push(ozoneMap.get(pais));
                }
            });

            if (labels.length === 0) {
                message = "⚠️ No compartís países con el Grupo 22.";
                isLoading = false; return;
            }

            message = "";
            isLoading = false;

            // 3. Carga segura de ZingChart (espera a que el script exista)
            const initZingChart = () => {
                zingchart.render({
                    id: chartId,
                    data: {
                        type: 'radar',
                        backgroundColor: 'transparent',
                        plot: { 
                            aspect: 'area', 
                            alphaArea: 0.5,
                            animation: { effect: 3, sequence: 1, speed: 700 }
                        },
                        scaleK: { 
                            labels: labels, 
                            item: { fontColor: '#cbd5e1', fontSize: 13 } 
                        },
                        scaleV: { 
                            visible: false // Ocultamos los anillos numéricos para que no estorben
                        },
                        tooltip: {
                            text: '%t en %kl: %v',
                            backgroundColor: '#1e293b',
                            borderColor: '#38bdf8',
                            borderRadius: '8px'
                        },
                        legend: {
                            layout: 'x2',
                            position: '50% 100%', // Centrado abajo
                            backgroundColor: 'transparent',
                            borderWidth: 0,
                            item: { fontColor: '#cbd5e1', fontSize: 14 }
                        },
                        series: [
                            { 
                                values: dataLlegadas, 
                                text: 'Tus Turistas', 
                                backgroundColor: '#38bdf8', 
                                lineColor: '#38bdf8' 
                            },
                            { 
                                values: dataOzone, 
                                text: 'Consumo Ozono', 
                                backgroundColor: '#f43f5e', 
                                lineColor: '#f43f5e' 
                            }
                        ]
                    },
                    height: '100%',
                    width: '100%'
                });
            };

            // Inyectamos ZingChart solo si no existe ya
            if (window.zingchart) {
                initZingChart();
            } else {
                let script = document.createElement('script');
                script.src = "https://cdn.zingchart.com/zingchart.min.js";
                document.head.appendChild(script);
                script.onload = initZingChart;
            }

        } catch (error) {
            console.error(error);
            message = "Error interno cargando ZingChart.";
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
            <h2>🌍 Turistas vs Ozono (ZingChart Radar)</h2>
            <p class="desc">
                Integración directa con el grupo SOS2526-22.<br>
                Gráfico <code>Radar</code>. Comparativa entre tus llegadas aéreas y el consumo de sustancias nocivas.
            </p>
        </div>

        {#if isLoading || message}
            <div class="loading-state" class:error-msg={message.includes("Error") || message.includes("⚠️")}>
                {#if isLoading}<span class="spinner">⏳</span><br><br>{/if}
                {message}
            </div>
        {/if}

        <div class="chart-box" class:hidden={isLoading || (message && message.includes("⚠️") || message.includes("Error"))}>
            <div id={chartId} style="width: 100%; height: 500px;"></div>
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
    .error-msg { color: #ef4444; border: 2px dashed #ef4444; border-radius: 8px; padding: 1rem; }
    .spinner { font-size: 2rem; display: inline-block; animation: pulse 1.5s infinite; }
    .chart-box { background: #0b1120; border-radius: 12px; padding: 1rem; border: 1px solid #334155; }
    .hidden { display: none !important; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>