<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Cruzando datos a través del Proxy...");
    let chartContainer;
    let chartInstance;
    let isLoading = $state(true);

    async function safeJson(res) {
        try { return res.ok ? await res.json() : []; } catch { return []; }
    }

    onMount(async () => {
        if (!browser) return;

        try {
            // Importamos Chart.js dinámicamente
            const { default: Chart } = await import('chart.js/auto');

            // 1. Fetch a tu API
            const resMis = await fetch("/api/v2/international-tourist-arrivals");
            const misDatos = await safeJson(resMis);

            // 2. Fetch a la API del compañero USANDO EL PROXY
            const resCompi = await fetch("/api/proxy/aimar/citys");
            const compiDatos = await safeJson(resCompi);

            if (misDatos.length === 0 || compiDatos.length === 0) {
                message = "⚠️ Faltan datos para cruzar. Verifica las APIs.";
                isLoading = false; return;
            }

            // Mapeamos los datos del compañero (nos quedamos con el valor más alto si tiene duplicados)
            const compiMap = new Map();
            compiDatos.forEach(item => {
                if (item.country) {
                    let nombre = String(item.country).trim().toLowerCase();
                    let valorNumerico = Object.values(item).find(v => typeof v === 'number' && v > 0) || 0;
                    
                    if (!compiMap.has(nombre) || compiMap.get(nombre) < valorNumerico) {
                        compiMap.set(nombre, valorNumerico);
                    }
                }
            });

            // Agrupamos TUS datos para evitar países duplicados
            const unicos = new Map();
            
            misDatos.forEach(d => {
                let pais = String(d.country || "").trim().toLowerCase();
                
                // ¡El salvavidas! Buscamos la variable se llame como se llame
                let misTuristas = Number(d.air_arrival) || Number(d.arrivals_air) || 0;

                // Solo si el compañero también tiene este país
                if (compiMap.has(pais)) {
                    if (!unicos.has(pais)) {
                        unicos.set(pais, {
                            nombre: d.country,
                            turistas: misTuristas,
                            cityData: compiMap.get(pais) // El dato del compañero
                        });
                    } else {
                        // Si ya existe (ej. otro año), le sumamos los turistas
                        unicos.get(pais).turistas += misTuristas;
                    }
                }
            });

            if (unicos.size === 0) {
                message = "⚠️ No compartís países exactos con el Grupo 29.";
                isLoading = false; return;
            }

            // Preparamos los arrays para pasárselos a Chart.js
            let labels = [];
            let dataLlegadas = [];
            let dataCompi = [];

            unicos.forEach(val => {
                labels.push(val.nombre);
                dataLlegadas.push(val.turistas);
                dataCompi.push(val.cityData);
            });

            message = "";
            isLoading = false;

            // Renderizamos el Donut Concéntrico
            chartInstance = new Chart(chartContainer, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Tus Llegadas por Aire',
                            data: dataLlegadas,
                            backgroundColor: ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#075985', '#1e3a8a', '#1e40af'],
                            borderWidth: 2,
                            borderColor: '#0f172a'
                        },
                        {
                            label: 'Datos Numéricos (Citys)',
                            data: dataCompi,
                            backgroundColor: ['#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843', '#9f1239'],
                            borderWidth: 2,
                            borderColor: '#0f172a'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '40%', // Hace el agujero del centro un poco más pequeño para que los anillos se vean gordos
                    plugins: {
                        legend: { position: 'right', labels: { color: '#cbd5e1', font: { size: 14 } } },
                        tooltip: { theme: 'dark' }
                    }
                }
            });

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
            <h2>🌍 Turistas vs Ciudades (Chart.js)</h2>
            <p class="desc">
                Integración mediante <strong>Proxy backend</strong> con el grupo SOS2526-29.<br>
                Gráfico Doughnut. Anillo interior: <strong>Tus turistas (Azul)</strong> | Anillo exterior: <strong>Datos del compañero (Rosa)</strong>.
            </p>
        </div>

        {#if isLoading || message}
            <div class="loading-state">
                {#if isLoading}<span class="spinner">⏳</span><br><br>{/if}
                {message}
            </div>
        {/if}

        <div class="chart-box" class:hidden={isLoading || (message && message.includes("⚠️") || message.includes("Error"))}>
            <div style="position: relative; height: 500px; width: 100%;">
                <canvas bind:this={chartContainer}></canvas>
            </div>
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
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>