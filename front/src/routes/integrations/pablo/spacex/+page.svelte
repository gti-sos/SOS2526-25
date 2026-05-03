<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    // ¡Aquí está la magia reactiva de Svelte 5!
    let message = $state("Cargando lanzamientos de SpaceX y temperaturas...");
    let fallbackActivado = $state(false);

    onMount(async () => {
        if (!browser) return;

        // Cargamos Chart.js de forma segura
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/chart.js";
        script.onload = () => {
            loadAndDraw();
        };
        document.head.appendChild(script);
    });

    async function loadAndDraw() {
        try {
            // 1. Fetch a tu API (Temperaturas)
            const resTemp = await fetch('/api/v2/average-annual-temperatures');
            let dataTemp = resTemp.ok ? await resTemp.json() : [];

            // 2. Fetch a la API EXTERNA (SpaceX)
            let spaceXData = [];
            try {
                const resSpaceX = await fetch('https://api.spacexdata.com/v4/launches');
                if (resSpaceX.ok) {
                    spaceXData = await resSpaceX.json();
                }
            } catch(e) { console.warn("Fallo al conectar con la API de SpaceX."); }

            let bubbleData = [];

            // Cruzamos los datos: Cantidad de lanzamientos por AÑO vs Temperatura de USA
            if (dataTemp.length > 0 && spaceXData.length > 0) {
                // Agrupamos los lanzamientos de SpaceX por año
                const launchesByYear = {};
                spaceXData.forEach(launch => {
                    if (launch.date_utc) {
                        const year = new Date(launch.date_utc).getFullYear();
                        launchesByYear[year] = (launchesByYear[year] || 0) + 1;
                    }
                });

                // Filtramos tus datos solo para USA (ya que SpaceX es de allí)
                const usaTemps = dataTemp.filter(d => d.country?.toLowerCase() === 'usa');

                usaTemps.forEach(d => {
                    const year = parseInt(d.year);
                    if (launchesByYear[year]) {
                        bubbleData.push({
                            x: year,
                            y: d.temperature,
                            r: launchesByYear[year] * 1.5, // Multiplicamos por 1.5 para que la burbuja se vea bien
                            launches: launchesByYear[year]
                        });
                    }
                });
            }

            // MODO DE RESPALDO (Fallback) si falla internet o el cruce
            if (bubbleData.length === 0) {
                console.log("Activando datos de respaldo...");
                fallbackActivado = true;
                bubbleData = [
                    { x: 2018, y: 11.5, r: 21 * 1.5, launches: 21 },
                    { x: 2019, y: 11.6, r: 13 * 1.5, launches: 13 },
                    { x: 2020, y: 11.7, r: 26 * 1.5, launches: 26 },
                    { x: 2021, y: 11.6, r: 31 * 1.5, launches: 31 },
                    { x: 2022, y: 11.8, r: 61 * 1.5, launches: 61 }
                ];
            }

            // Svelte detecta esto y quita el display:none
            message = ""; 

            // 🔥 Le damos 100ms a Chart.js para que encuentre su canvas visible
            setTimeout(() => {
                const ctx = document.getElementById('spacex-chart').getContext('2d');
                new window.Chart(ctx, {
                    type: 'bubble',
                    data: {
                        datasets: [{
                            label: 'Lanzamientos SpaceX vs Temp. Media (USA)',
                            data: bubbleData,
                            backgroundColor: 'rgba(244, 63, 94, 0.6)', // Color rojito espacial
                            borderColor: 'rgba(244, 63, 94, 1)',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                title: { display: true, text: 'Año', color: '#cbd5e1' },
                                ticks: { color: '#94a3b8', stepSize: 1 },
                                grid: { color: 'rgba(255, 255, 255, 0.1)' }
                            },
                            y: {
                                title: { display: true, text: 'Temperatura Media (ºC)', color: '#cbd5e1' },
                                ticks: { color: '#94a3b8' },
                                grid: { color: 'rgba(255, 255, 255, 0.1)' }
                            }
                        },
                        plugins: {
                            legend: { labels: { color: '#cbd5e1' } },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const d = context.raw;
                                        return `Año: ${d.x} | Temp: ${d.y}ºC | Cohetes: ${d.launches}`;
                                    }
                                }
                            }
                        }
                    }
                });
            }, 100);

        } catch (error) { 
            message = "❌ Error en la integración: " + error.message; 
        }
    }
</script>

<main>
    <a href="/integrations" class="back-btn" data-sveltekit-reload>⬅ Volver al Panel</a>
    <h2>🚀 Uso Externo: Clima vs SpaceX (Pablo)</h2>
    <p class="subtitle">Integración con <b>SpaceX API</b> usando <b>Chart.js</b> (Bubble Chart).</p>

    <!-- El chivato visual -->
    {#if fallbackActivado}
        <div class="fallback-warning">
            ⚠️ Modo Respaldo: No se pudo conectar con SpaceX o cruzar datos. Usando datos simulados.
        </div>
    {/if}

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="card" class:hidden={!!message}>
        <!-- Chart.js necesita un canvas en lugar de un div -->
        <div style="height: 500px; width: 100%;">
            <canvas id="spacex-chart"></canvas>
        </div>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0; }
    main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h2 { color: #f43f5e; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 2rem; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 1rem; }
    .back-btn:hover { color: #f43f5e; }
    
    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    
    .alert { background: rgba(244, 63, 94, 0.2); border-left: 4px solid #f43f5e; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; text-align: center; color: #f43f5e; font-weight: bold;}
    
    .fallback-warning {
        background-color: rgba(239, 68, 68, 0.15);
        border: 1px solid #ef4444;
        color: #fca5a5;
        padding: 0.8rem;
        border-radius: 8px;
        text-align: center;
        font-size: 0.9rem;
        margin-bottom: 1.5rem;
    }
    
    .hidden { display: none; }
</style>