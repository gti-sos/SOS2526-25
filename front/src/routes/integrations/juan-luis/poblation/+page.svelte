<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Descargando demografía mundial (CountriesNow)...");
    let chartCanvas;
    let chartInstance;
    let datosCompletos = $state([]); 

    async function safeJson(res) {
        try { return res.ok ? await res.json() : []; } catch { return []; }
    }

    onMount(async () => {
        if (!browser) return;

        try {
            // 1. Fetch de tu API
            const resMis = await fetch("/api/v2/social-drinking-behaviors");
            const misDatos = await safeJson(resMis);

            // 2. Fetch a la API de CountriesNow (Población histórica por país)
            const resPop = await fetch("https://countriesnow.space/api/v0.1/countries/population");
            const popDatos = await safeJson(resPop);

            if (misDatos.length === 0 || !popDatos.data) {
                message = "⚠️ Faltan datos para cruzar.";
                return;
            }

            // 3. Mapeamos la población (Cogemos el último dato registrado de cada país)
            const poblacionMap = new Map();
            popDatos.data.forEach(item => {
                let nombre = item.country.toLowerCase();
                
                // Normalizaciones básicas
                if (nombre.includes("united states")) nombre = "united states of america";
                if (nombre.includes("united kingdom")) nombre = "united kingdom";
                if (nombre.includes("russia")) nombre = "russian federation";
                
                // Extraemos el recuento más reciente del array
                if (item.populationCounts && item.populationCounts.length > 0) {
                    let ultimoRegistro = item.populationCounts[item.populationCounts.length - 1];
                    // Guardamos la población en "Millones" para que la gráfica no explote
                    poblacionMap.set(nombre, ultimoRegistro.value / 1000000);
                }
            });

            let cruzados = [];
            let paisesProcesados = new Set();

            // 4. Cruzamos los datos de Población con tu BD
            misDatos.forEach(d => {
                let pais = String(d.country).trim().toLowerCase();
                
                if (poblacionMap.has(pais) && !paisesProcesados.has(pais)) {
                    paisesProcesados.add(pais);
                    
                    let popMillones = poblacionMap.get(pais);

                    cruzados.push({
                        country: d.country,
                        poblacion: Number(popMillones.toFixed(1)),
                        cerveza: Number(d.beer_share) || 0,
                        vino: Number(d.wine_share) || 0,
                        alcohol: Number(d.spirits_share) || 0
                    });
                }
            });

            if (cruzados.length === 0) {
                message = "⚠️ No hay coincidencias entre países y población.";
                return;
            }

            // Ordenamos de mayor a menor población y cogemos el Top 12
            cruzados.sort((a, b) => b.poblacion - a.poblacion);
            datosCompletos = cruzados.slice(0, 12); 
            
            message = "";

            esperarYRenderizar();

        } catch (error) {
            console.error(error);
            message = "Error cargando datos demográficos.";
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

    function dibujarGrafica() {
        if (!window.Chart || !chartCanvas) return;

        const labels = datosCompletos.map(d => d.country);
        const dataValues = datosCompletos.map(d => d.poblacion);
        
        if (chartInstance) {
            chartInstance.destroy();
        }

        const paleta = [
            '#ef4444', '#facc15', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899',
            '#f97316', '#14b8a6', '#6366f1', '#eab308', '#f43f5e', '#84cc16'
        ];

        chartInstance = new window.Chart(chartCanvas, {
            type: 'polarArea', 
            data: {
                labels: labels,
                datasets: [{
                    label: 'Población (Millones)',
                    data: dataValues,
                    backgroundColor: paleta.map(color => color + '80'), 
                    borderColor: paleta,
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
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#3b82f6',
                        bodyColor: '#ffffff',
                        borderColor: '#3b82f6',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const index = context.dataIndex;
                                const paisData = datosCompletos[index];
                                return [
                                    `👥 Habitantes: ${paisData.poblacion} Millones`,
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
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</svelte:head>

<main>
    <div class="header-nav">
        <a href="/integrations/juan-luis" class="back-btn">⬅ Volver a Integraciones Juan Luis</a>
    </div>

    <div class="card">
        <div class="top-bar">
            <h2>🌍 Demografía y Consumo (Chart.js)</h2>
            <p class="desc">
                Cruce de la <strong>Población Total</strong> extraída de CountriesNow con los datos de consumo. 
                Visualización en <strong>Área Polar (Ruleta)</strong> del Top 12 países más poblados.
            </p>
        </div>

        {#if message}
            <div class="loading-state">
                <span class="spinner">{message}</span>
            </div>
        {:else}
            <div class="controls">
                <span class="badge">Top 12 países por volumen de Población</span>
            </div>

            <div class="chart-box">
                <canvas bind:this={chartCanvas}></canvas>
            </div>
        {/if}
    </div>
</main>

<style>
    :global(body) { background: #0f172a; color: white; margin: 0; font-family: 'Segoe UI', sans-serif; }
    main { padding: 2rem; max-width: 1000px; margin: auto; }
    .header-nav { margin-bottom: 2rem; }
    
    .back-btn { color: #3b82f6; text-decoration: none; font-weight: bold; border: 1px solid #3b82f6; padding: 0.5rem 1rem; border-radius: 8px; transition: 0.3s; }
    .back-btn:hover { background: rgba(59, 130, 246, 0.2); }
    
    .card { background: #1e293b; padding: 2rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); border: 1px solid #334155;}
    
    .top-bar h2 { margin: 0 0 0.5rem 0; color: #3b82f6; }
    .desc { color: #94a3b8; margin-top: 0; margin-bottom: 1.5rem; line-height: 1.5; }

    .controls { background: #0b1120; padding: 1.5rem; border-radius: 12px; border: 1px solid #334155; margin-bottom: 2rem; display: flex; align-items: center; justify-content: center; }
    
    .badge { background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 1rem; border: 1px solid #3b82f6; font-weight: bold;}

    .loading-state { text-align: center; padding: 3rem; color: #3b82f6; font-size: 1.2rem; border: 2px dashed #3b82f6; border-radius: 8px;}
    
    .chart-box { 
        background: #0b1120; 
        border-radius: 12px; 
        padding: 1rem; 
        border: 1px solid #334155;
        height: 600px; 
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>