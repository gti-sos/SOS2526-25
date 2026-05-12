<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Conectando con el servidor de Mario (G17) vía Proxy...");
    let fallbackActivado = $state(false);

    onMount(async () => {
        if (!browser) return;
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/apexcharts";
        script.onload = () => { loadAndDraw(); };
        document.head.appendChild(script);
    });

    async function loadAndDraw() {
        try {
            const origin = browser ? window.location.origin : '';
            
            // 1. Fetch a TU API LOCAL (Grupo 25)
            // ⚠️ CAMBIA ESTO por tu ruta real
            const resLocal = await fetch(`${origin}/api/v1/TU-API-AQUI`); 
            let dataLocal = resLocal.ok ? await resLocal.json() : [];

            // 2. Fetch a la API de Mario (Grupo 17) a través de tu PROXY
            const resMario = await fetch(`${origin}/api/proxy/mario/water-productivities`);
            let dataMario = resMario.ok ? await resMario.json() : [];

            let categories = [];
            let seriesLocal = [];
            let seriesWaterStress = []; // Dato de Mario

            // 3. CRUZAR LOS DATOS (por País)
            if (dataLocal.length > 0 && dataMario.length > 0) {
                const validLocal = dataLocal.filter(d => d && d.country); 
                const uniqueCountries = [...new Set(validLocal.map(d => d.country))];
                
                uniqueCountries.forEach(countryName => {
                    // Buscamos si Mario tiene el mismo país
                    const marioCountryData = dataMario.find(m => 
                        m.country.toLowerCase() === countryName.toLowerCase()
                    );
                    
                    if (marioCountryData) {
                        const miDato = validLocal.find(d => d.country === countryName);
                        
                        categories.push(countryName);
                        // ⚠️ CAMBIA 'mi_variable' por el nombre del campo en tu base de datos
                        seriesLocal.push(miDato.mi_variable || 0); 
                        seriesWaterStress.push(marioCountryData.waterStress || 0);
                    }
                });
            }

            // MODO RESPALDO (Por si no hay coincidencias de países entre tu API y la suya)
            if (categories.length === 0) {
                fallbackActivado = true;
                categories = ["Spain", "Afghanistan", "Denmark", "Argentina"];
                seriesLocal = [50, 20, 80, 45]; // Tus datos simulados
                seriesWaterStress = [42.5, 65.2, 18.4, 12.1]; // Datos de estrés de Mario
            }

            message = ""; 

            // Renderizamos la gráfica mixta
            setTimeout(() => {
                const chartContainer = document.querySelector("#apex-chart");
                if (!chartContainer) return; 

                const options = {
                    series: [
                        { name: 'Mi Variable (G25)', type: 'column', data: seriesLocal }, 
                        { name: 'Estrés Hídrico (Mario G17)', type: 'line', data: seriesWaterStress }
                    ],
                    chart: { height: 450, type: 'line', foreColor: '#cbd5e1', toolbar: { show: false } },
                    stroke: { width: [0, 4] },
                    title: { text: 'Mis Datos vs Estrés Hídrico (G17)', align: 'center', style: { color: '#0ea5e9', fontSize: '16px' } },
                    dataLabels: { enabled: true, enabledOnSeries: [1] },
                    labels: categories,
                    colors: ['#3b82f6', '#0ea5e9'],
                    yaxis: [
                        { title: { text: 'Mi Variable', style: { color: '#3b82f6' } } }, 
                        { opposite: true, title: { text: 'Estrés Hídrico (%)', style: { color: '#0ea5e9' } } }
                    ],
                    theme: { mode: 'dark' },
                    tooltip: { shared: true, intersect: false }
                };
                const chart = new window.ApexCharts(chartContainer, options);
                chart.render();
            }, 100);

        } catch (error) { 
            message = "❌ Error general: " + error.message; 
        }
    }
</script>

<main>
    <a href="/integrations" class="back-btn" data-sveltekit-reload>⬅ Volver al Panel</a>
    <h2>🌍 Mi API vs Mario G17 (Pablo)</h2>
    <p class="subtitle">Integración con <b>Water Productivities (G17)</b> vía Proxy usando <b>ApexCharts</b>.</p>

    {#if fallbackActivado}
        <div class="fallback-warning">
            ⚠️ Modo Respaldo: Ningún país de tu BD coincidió con los de Mario, o hay un error de conexión. Usando datos de prueba.
        </div>
    {/if}

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="card" class:hidden={!!message}>
        <div id="apex-chart"></div>
    </div>
</main>

<!-- (Los mismos estilos de antes) -->
<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0; }
    main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h2 { color: #0ea5e9; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 2rem; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 1rem; }
    .back-btn:hover { color: #0ea5e9; }
    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    .alert { background: rgba(14, 165, 233, 0.2); border-left: 4px solid #0ea5e9; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; text-align: center; color: #0ea5e9; font-weight: bold;}
    .fallback-warning { background-color: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 0.8rem; border-radius: 8px; text-align: center; margin-bottom: 1.5rem; }
    .hidden { display: none; }
</style>