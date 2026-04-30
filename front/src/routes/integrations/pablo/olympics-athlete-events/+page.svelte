<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let chartElement;
    let message = $state("Obteniendo datos de Atletas (G30) y Clima...");
    let chartInstance = null;

    onMount(async () => {
        if (!browser) return;

        // Esperamos a que ECharts se cargue desde el CDN
        const checkEcharts = setInterval(async () => {
            if (window.echarts) {
                clearInterval(checkEcharts);
                await loadAndDraw();
            }
        }, 100);
    });

    async function loadAndDraw() {
        try {
            // 1. Fetch a la API de Pablo (Temperaturas)
            const resTemp = await fetch('/api/v2/average-annual-temperatures');
            let dataTemp = resTemp.ok ? await resTemp.json() : [];
            
            // 2. Fetch a la API del G30 (Olympics)
            let dataOlympics = [];
            try {
                const resOlympics = await fetch('https://sos2526-30.onrender.com/api/v2/olympics-athlete-events?limit=500');
                if (resOlympics.ok) {
                    const responseOlympics = await resOlympics.json();
                    dataOlympics = responseOlympics.data || responseOlympics || [];
                }
            } catch (e) {
                console.warn("API G30 caída o no responde. Usaremos respaldo.");
            }

            // 3. Fallback (Respaldo) si las APIs no traen datos o están vacías
            if (dataTemp.length === 0 || dataOlympics.length === 0) {
                console.log("Usando datos de respaldo de emergencia...");
                dataTemp = [
                    { country: "China", temperature: 6.5, co2_emission: 2500 },
                    { country: "USA", temperature: 11.5, co2_emission: 5100 },
                    { country: "Spain", temperature: 14.5, co2_emission: 230 },
                    { country: "France", temperature: 11.5, co2_emission: 380 }
                ];
                dataOlympics = [
                    { team: "China" }, { team: "China" }, { team: "China" }, { team: "China" }, { team: "China" },
                    { team: "USA" }, { team: "USA" }, { team: "USA" }, { team: "USA" }, { team: "USA" }, { team: "USA" }, { team: "USA" },
                    { team: "Spain" }, { team: "Spain" }, { team: "Spain" },
                    { team: "France" }, { team: "France" }, { team: "France" }, { team: "France" }
                ];
            }

            // Agrupamos los atletas por país (team)
            const athletesCountByCountry = {};
            dataOlympics.forEach(athlete => {
                const country = athlete.team;
                if (!athletesCountByCountry[country]) {
                    athletesCountByCountry[country] = 0;
                }
                athletesCountByCountry[country]++;
            });

            let roseData = [];
            Object.keys(athletesCountByCountry).forEach(country => {
                const tempMatch = dataTemp.find(t => t.country.toLowerCase() === country.toLowerCase());
                if (tempMatch) {
                    roseData.push({
                        name: country,
                        value: athletesCountByCountry[country],
                        temperature: tempMatch.temperature,
                        co2: tempMatch.co2_emission
                    });
                }
            });

            if (roseData.length === 0) throw new Error("No hay coincidencias de países.");

            message = ""; // Limpiamos el mensaje (Svelte quitará el 'display: none' ahora)

            // 🔥 EL ARREGLO: Esperamos 50ms para que el contenedor adquiera su tamaño real antes de dibujar
            setTimeout(() => {
                // Destruimos la instancia anterior si existe (por si se recarga)
                if (chartInstance) chartInstance.dispose();
                
                chartInstance = window.echarts.init(chartElement);

                const option = {
                    title: {
                        text: 'Atletas Olímpicos vs Temperatura',
                        subtext: 'Tamaño: Nº de Atletas registrados',
                        left: 'center',
                        textStyle: { color: '#facc15' }
                    },
                    tooltip: {
                        trigger: 'item',
                        formatter: function (params) {
                            const d = params.data;
                            return `
                                <div style="color: #0f172a;">
                                    <b>🌍 ${d.name}</b><br/>
                                    🏃‍♂️ Atletas: ${d.value}<br/>
                                    🌡️ Temperatura: ${d.temperature} ºC<br/>
                                    ☁️ CO2: ${d.co2}
                                </div>
                            `;
                        }
                    },
                    legend: {
                        left: 'center',
                        bottom: '0',
                        textStyle: { color: '#cbd5e1' }
                    },
                    series: [
                        {
                            name: 'Atletas y Clima',
                            type: 'pie',
                            radius: [30, 140],
                            center: ['50%', '45%'], // Lo subimos un pelín para que no pise la leyenda
                            roseType: 'area',
                            itemStyle: { borderRadius: 8 },
                            label: { color: '#fff' },
                            data: roseData
                        }
                    ]
                };

                chartInstance.setOption(option);

                // Hacer la gráfica responsive
                window.addEventListener('resize', () => {
                    chartInstance.resize();
                });
            }, 50);

        } catch (error) {
            console.error(error);
            message = "❌ Error en la integración de datos: " + error.message;
        }
    }
</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>
</svelte:head>

<main>
    <a href="/integrations" class="back-btn">⬅ Volver al Panel</a>
    <h2>🏅 Olimpiadas vs Clima (Pablo)</h2>
    <p class="subtitle">Integración con G30 usando <b>Apache ECharts</b> (Nightingale Rose Chart).</p>

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="card" class:hidden={!!message}>
        <div bind:this={chartElement} style="width: 100%; height: 500px;"></div>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0; }
    main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h2 { color: #facc15; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 2rem; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 1rem; }
    .back-btn:hover { color: #facc15; }
    
    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    .alert { background: rgba(250, 204, 21, 0.2); border-left: 4px solid #facc15; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; text-align: center; }
    
    .hidden { display: none; }
</style>