<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Autenticando con OAuth 2.0 en Amadeus (Aviación)...");
    let fallbackActivado = $state(false);

    onMount(async () => {
        if (!browser) return;

        // Cargamos Apache ECharts
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js";
        script.onload = () => {
            loadAndDraw();
        };
        document.head.appendChild(script);
    });

    async function loadAndDraw() {
        try {
            const origin = browser ? window.location.origin : '';
            
            // 1. Fetch a tu API
            const resTemp = await fetch(`${origin}/api/v2/average-annual-temperatures`);
            let dataTemp = resTemp.ok ? await resTemp.json() : [];

            // Países y sus capitales (para buscar en la API de aviación)
            const targets = [
                { country: "Spain", city: "MADRID" },
                { country: "Germany", city: "BERLIN" },
                { country: "China", city: "BEIJING" },
                { country: "USA", city: "NEW YORK" }, // Usamos NYC por el alto tráfico
                { country: "France", city: "PARIS" }
            ];
            
            let roseDataCO2 = [];
            let roseDataAirports = [];

            // 2. Obtenemos datos de Amadeus (vía Proxy OAuth)
            for (const t of targets) {
                const myCountryData = dataTemp.filter(d => d.country.toLowerCase() === t.country.toLowerCase()).sort((a,b) => b.year - a.year)[0];
                const co2 = myCountryData ? myCountryData.co2_emission : 0;
                
                // Guardamos el dato de CO2 para la gráfica
                roseDataCO2.push({ value: co2, name: t.country });

                let airports = 0;
                try {
                    // Llamamos al proxy OAuth
                    const resAmadeus = await fetch(`${origin}/api/proxy/pablo/amadeus?keyword=${t.city}`);
                    if (resAmadeus.ok) {
                        const dataAmadeus = await resAmadeus.json();
                        // Contamos cuántos nodos aéreos devuelve la API para esa ciudad
                        airports = dataAmadeus.data ? dataAmadeus.data.length : 0; 
                    }
                } catch(e) { console.warn(`Fallo en OAuth para ${t.country}`); }
                
                roseDataAirports.push({ value: airports, name: t.country });
            }

            // MODO DE RESPALDO (Si no hay token real de Amadeus en el backend)
            if (roseDataAirports.every(d => d.value === 0)) {
                fallbackActivado = true;
                // Usamos datos simulados basados en la realidad para que la gráfica no quede vacía
                roseDataCO2 = [
                    { value: 235, name: "Spain" }, { value: 590, name: "Germany" }, 
                    { value: 11.8, name: "China" }, { value: 4950, name: "USA" }, 
                    { value: 300, name: "France" }
                ];
                // Multiplicamos por un factor visual para equilibrar el gráfico circular
                roseDataAirports = [
                    { value: 300, name: "Spain (Aero)" }, { value: 450, name: "Germany (Aero)" }, 
                    { value: 1200, name: "China (Aero)" }, { value: 2500, name: "USA (Aero)" }, 
                    { value: 400, name: "France (Aero)" }
                ];
            }

            message = ""; 

            // 3. Dibujamos el Nightingale Rose Chart
            setTimeout(() => {
                const chartDom = document.getElementById('echarts-container');
                const myChart = window.echarts.init(chartDom, 'dark');

                const option = {
                    backgroundColor: 'transparent',
                    title: {
                        text: 'Impacto Aéreo vs CO2',
                        left: 'center',
                        textStyle: { color: '#38bdf8' }
                    },
                    tooltip: { trigger: 'item', formatter: '{a} <br/>{b} : {c}' },
                    legend: { left: 'center', top: 'bottom', textStyle: { color: '#cbd5e1' } },
                    toolbox: { show: true, feature: { saveAsImage: { show: true } } },
                    series: [
                        {
                            name: 'Emisiones CO2',
                            type: 'pie',
                            radius: [20, 140],
                            center: ['25%', '50%'],
                            roseType: 'area', // Esta es la clave del Rose Chart
                            itemStyle: { borderRadius: 8 },
                            data: roseDataCO2
                        },
                        {
                            name: 'Infraestructura Aérea (Amadeus)',
                            type: 'pie',
                            radius: [20, 140],
                            center: ['75%', '50%'],
                            roseType: 'area',
                            itemStyle: { borderRadius: 8 },
                            data: roseDataAirports
                        }
                    ]
                };

                myChart.setOption(option);
            }, 100);

        } catch (error) { 
            message = "❌ Error en la integración: " + error.message; 
        }
    }
</script>

<main>
    <a href="/integrations" class="back-btn" data-sveltekit-reload>⬅ Volver al Panel</a>
    <h2>✈️ Aviación vs Clima (Pablo)</h2>
    <p class="subtitle">Integración con <b>Amadeus API (OAuth 2.0)</b> usando <b>Nightingale Rose Chart</b>.</p>

    {#if fallbackActivado}
        <div class="fallback-warning">
            ⚠️ Modo Respaldo: Faltan credenciales OAuth de Amadeus en el backend. Usando datos simulados.
        </div>
    {/if}

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="card" class:hidden={!!message}>
        <div id="echarts-container" style="height: 500px; width: 100%;"></div>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0; }
    main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h2 { color: #38bdf8; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 2rem; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 1rem; }
    .back-btn:hover { color: #38bdf8; }
    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    .alert { background: rgba(56, 189, 248, 0.2); border-left: 4px solid #38bdf8; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; text-align: center; color: #38bdf8; font-weight: bold;}
    .fallback-warning { background-color: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 0.8rem; border-radius: 8px; text-align: center; margin-bottom: 1.5rem; }
    .hidden { display: none; }
</style>