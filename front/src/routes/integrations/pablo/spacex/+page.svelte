<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    // ¡La magia reactiva de Svelte 5!
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

            // Arrays separados para el gráfico mixto
            let labelsYears = [];
            let tempValues = [];
            let launchValues = [];

            // Cruzamos los datos
            if (dataTemp.length > 0 && spaceXData.length > 0) {
                const launchesByYear = {};
                spaceXData.forEach(launch => {
                    if (launch.date_utc) {
                        const year = new Date(launch.date_utc).getFullYear();
                        launchesByYear[year] = (launchesByYear[year] || 0) + 1;
                    }
                });

                const usaTemps = dataTemp.filter(d => d.country?.toLowerCase() === 'usa');

                usaTemps.forEach(d => {
                    const year = parseInt(d.year);
                    if (launchesByYear[year]) {
                        labelsYears.push(year);
                        tempValues.push(d.temperature);
                        launchValues.push(launchesByYear[year]);
                    }
                });
            }

            // MODO DE RESPALDO (Fallback) 
            if (labelsYears.length === 0) {
                console.log("Activando datos de respaldo...");
                fallbackActivado = true;
                labelsYears = ['2018', '2019', '2020', '2021', '2022'];
                tempValues = [11.5, 11.6, 11.7, 11.6, 11.8];
                launchValues = [21, 13, 26, 31, 61];
            }

            message = ""; 

            // Construimos el Gráfico Mixto
            setTimeout(() => {
                const ctx = document.getElementById('spacex-chart').getContext('2d');
                new window.Chart(ctx, {
                    type: 'line', // Tipo base, se sobreescribe en los datasets
                    data: {
                        labels: labelsYears,
                        datasets: [
                            {
                                type: 'bar', // Barras para los lanzamientos
                                label: 'Lanzamientos SpaceX',
                                data: launchValues,
                                backgroundColor: 'rgba(244, 63, 94, 0.6)', 
                                borderColor: 'rgba(244, 63, 94, 1)',
                                borderWidth: 1,
                                yAxisID: 'y-launches' // Eje derecho
                            },
                            {
                                type: 'line', // Línea para las temperaturas
                                label: 'Temperatura Media USA (ºC)',
                                data: tempValues,
                                backgroundColor: '#38bdf8', // Azulito para el clima
                                borderColor: '#38bdf8',
                                borderWidth: 3,
                                tension: 0.3, // Curva suave
                                pointRadius: 5,
                                yAxisID: 'y-temp' // Eje izquierdo
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        scales: {
                            x: {
                                title: { display: true, text: 'Año', color: '#cbd5e1' },
                                ticks: { color: '#94a3b8' },
                                grid: { color: 'rgba(255, 255, 255, 0.1)' }
                            },
                            'y-temp': {
                                type: 'linear',
                                display: true,
                                position: 'left',
                                title: { display: true, text: 'Temperatura (ºC)', color: '#38bdf8' },
                                ticks: { color: '#38bdf8' },
                                grid: { color: 'rgba(255, 255, 255, 0.1)' }
                            },
                            'y-launches': {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                title: { display: true, text: 'Nº de Lanzamientos', color: '#f43f5e' },
                                ticks: { color: '#f43f5e' },
                                // Ocultamos la cuadrícula de este eje para que no se pise con la de temperatura
                                grid: { drawOnChartArea: false } 
                            }
                        },
                        plugins: {
                            legend: { labels: { color: '#cbd5e1' } },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        let label = context.dataset.label || '';
                                        if (label) label += ': ';
                                        if (context.dataset.type === 'line') {
                                            label += context.raw + ' ºC';
                                        } else {
                                            label += context.raw + ' cohetes';
                                        }
                                        return label;
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
    <h2>🚀 Uso Externo: Clima vs SpaceX</h2>
    <p class="subtitle">Integración con <b>SpaceX API</b> usando <b>Chart.js</b> (Gráfico Mixto: Barra + Línea).</p>

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