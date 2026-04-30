<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let chartElement;
    let message = "Cargando lanzamientos de SpaceX y temperaturas...";

    onMount(async () => {
        if (!browser) return;
        
        // Cargamos Chart.js desde su CDN
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/chart.js";
        script.onload = loadAndDraw;
        document.head.appendChild(script);
    });

    async function loadAndDraw() {
        try {
            // 1. Fetch a tu API de Temperaturas
            const resTemp = await fetch('/api/v2/average-annual-temperatures');
            // 2. Fetch a la API Externa (SpaceX)
            const resSpaceX = await fetch('https://api.spacexdata.com/v4/launches/past');

            if (!resTemp.ok || !resSpaceX.ok) throw new Error("Error al conectar con las APIs");

            const dataTemp = await resTemp.json();
            const dataSpaceX = await resSpaceX.json();

            // 3. Agrupamos los lanzamientos de SpaceX por Año
            const launchesByYear = {};
            dataSpaceX.forEach(launch => {
                const year = new Date(launch.date_utc).getFullYear();
                launchesByYear[year] = (launchesByYear[year] || 0) + 1;
            });

            // 4. Agrupamos tus temperaturas por Año (hacemos la media mundial por año)
            const tempByYear = {};
            const countByYear = {};
            dataTemp.forEach(t => {
                tempByYear[t.year] = (tempByYear[t.year] || 0) + t.temperature;
                countByYear[t.year] = (countByYear[t.year] || 0) + 1;
            });

            // 5. Cruzamos los datos para crear las burbujas
            let bubbleData = [];
            
            Object.keys(tempByYear).forEach(year => {
                if (launchesByYear[year]) {
                    bubbleData.push({
                        x: parseInt(year), // Eje X: Año
                        y: parseFloat((tempByYear[year] / countByYear[year]).toFixed(2)), // Eje Y: Temp media de ese año
                        r: Math.min(launchesByYear[year], 50) // Radio: Número de lanzamientos (limitamos a 50px de tamaño máximo)
                    });
                }
            });

            if (bubbleData.length === 0) {
                message = "⚠️ No hay años en común entre las APIs para generar la gráfica.";
                return;
            }

            message = ""; // Limpiamos mensaje

            // 6. Dibujamos la gráfica
            new window.Chart(chartElement, {
                type: 'bubble', // Tipo Burbuja (no es line)
                data: {
                    datasets: [{
                        label: 'Lanzamientos SpaceX vs Temperatura',
                        data: bubbleData,
                        backgroundColor: 'rgba(56, 189, 248, 0.6)',
                        borderColor: '#38bdf8',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: 'white' } },
                        tooltip: {
                            callbacks: {
                                label: function(ctx) {
                                    return `Año: ${ctx.raw.x} | Temp: ${ctx.raw.y}ºC | Lanzamientos: ${ctx.raw.r}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: { 
                            title: { display: true, text: 'Año', color: '#94a3b8' },
                            ticks: { color: '#cbd5e1' },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        },
                        y: { 
                            title: { display: true, text: 'Temp. Media Global (ºC)', color: '#94a3b8' },
                            ticks: { color: '#cbd5e1' },
                            grid: { color: 'rgba(255,255,255,0.1)' }
                        }
                    }
                }
            });

        } catch (error) {
            console.error(error);
            message = "❌ Error en la integración de datos: " + error.message;
        }
    }
</script>

<main>
    <div class="header-section">
        <a href="/integrations" class="back-btn">⬅ Volver al Panel</a>
        <h2>🚀 Uso Externo: Clima vs SpaceX (Pablo)</h2>
        <p class="subtitle">
            Integración con <b>SpaceX API</b> usando <b>Chart.js</b> (Bubble Chart).
        </p>
    </div>

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="card" class:hidden={!!message}>
        <div class="chart-container">
            <canvas bind:this={chartElement}></canvas>
        </div>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0; }
    main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    
    .header-section { margin-bottom: 2rem; text-align: center; }
    h2 { color: #38bdf8; margin-bottom: 0.5rem; font-size: 2rem; }
    .subtitle { color: #94a3b8; margin-bottom: 2rem; line-height: 1.5; }
    
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 1rem; align-self: flex-start; }
    .back-btn:hover { color: #e2e8f0; }
    
    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 1.5rem; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
    .alert { background: rgba(226, 232, 240, 0.2); border-left: 4px solid #e2e8f0; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; text-align: center; font-weight: bold; color: #facc15;}
    
    .chart-container { position: relative; height: 500px; width: 100%; }
    .hidden { display: none; }
</style>