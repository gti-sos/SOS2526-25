<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Cruzando emisiones de CO2 con datos demográficos mundiales...");
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
            
            console.log("1️⃣ --- INICIANDO FETCH A TU API ---");
            const apiUrl = `${origin}/api/v2/average-annual-temperatures`; 
            console.log("📍 URL consultada:", apiUrl);
            
            const resTemp = await fetch(apiUrl);
            let rawData = resTemp.ok ? await resTemp.json() : [];
            console.log("📦 Respuesta bruta de tu API:", rawData);

            // Súper parche: por si tu API devuelve un objeto en lugar de un array
            let dataTemp = Array.isArray(rawData) ? rawData : (rawData.data || rawData.temperatures || rawData.emissions || []);
            console.log("📊 Datos extraídos de tu API:", dataTemp);

            console.log("2️⃣ --- INICIANDO FETCH A RESTCOUNTRIES ---");
            let countriesData = [];
            try {
                const resCountries = await fetch('https://restcountries.com/v3.1/all?fields=name,cca3,population');
                if (resCountries.ok) {
                    countriesData = await resCountries.json();
                    console.log("🌍 RestCountries OK. Países cargados:", countriesData.length);
                }
            } catch(e) { console.warn("❌ Fallo RestCountries."); }

            let categories = [];
            let seriesCO2 = [];
            let seriesPopulation = [];

            if (dataTemp.length > 0 && countriesData.length > 0) {
                console.log("3️⃣ --- CRUZANDO DATOS ---");
                const validData = dataTemp.filter(d => d && d.country); 
                const uniqueCountries = [...new Set(validData.map(d => d.country))];
                console.log("🏷️ Países únicos en tu BD:", uniqueCountries);
                
                uniqueCountries.forEach(countryName => {
                    const apiCountry = countriesData.find(c => 
                        c.name.common.toLowerCase() === countryName.toLowerCase() ||
                        c.cca3.toLowerCase() === countryName.toLowerCase() ||
                        (c.name.official && c.name.official.toLowerCase() === countryName.toLowerCase())
                    );
                    
                    if (apiCountry) {
                        const latestRecord = validData.filter(d => d.country === countryName).sort((a,b) => b.year - a.year)[0];
                        categories.push(countryName);
                        console.log(`✅ MATCH! País: ${countryName} | CO2: ${latestRecord.co2_emission} | Pob: ${(apiCountry.population/1000000).toFixed(2)}M`);
                        seriesCO2.push(latestRecord.co2_emission || 0); 
                        seriesPopulation.push((apiCountry.population / 1000000).toFixed(2));
                    } else {
                        console.warn(`⚠️ No hay match en RestCountries para: "${countryName}"`);
                    }
                });
            }

            console.log("4️⃣ --- RESULTADO FINAL PARA LA GRÁFICA ---");
            console.log("Eje X (Países):", categories);

            if (categories.length === 0) {
                console.error("🚨 MODO RESPALDO: Categories está vacío.");
                fallbackActivado = true;
                categories = ["Spain", "Germany", "China", "USA", "France"];
                seriesCO2 = [235, 590, 11.8, 4950, 300.2]; 
                seriesPopulation = [47.3, 83.2, 1402, 331, 67.3]; 
            }

            message = ""; 

            setTimeout(() => {
                const chartContainer = document.querySelector("#apex-chart");
                if (!chartContainer) return; // Evitar que rompa si el HTML no ha cargado

                const options = {
                    series: [{ name: 'Emisiones CO2', type: 'column', data: seriesCO2 }, 
                             { name: 'Población (Millones)', type: 'line', data: seriesPopulation }],
                    chart: { height: 450, type: 'line', foreColor: '#cbd5e1', toolbar: { show: false } },
                    stroke: { width: [0, 4] },
                    title: { text: '¿A más población, más CO2?', align: 'center', style: { color: '#10b981', fontSize: '18px' } },
                    dataLabels: { enabled: true, enabledOnSeries: [1] },
                    labels: categories,
                    colors: ['#3b82f6', '#10b981'], 
                    yaxis: [{ title: { text: 'Emisiones CO2', style: { color: '#3b82f6' } } }, 
                            { opposite: true, title: { text: 'Población (M)', style: { color: '#10b981' } } }],
                    theme: { mode: 'dark' }
                };
                const chart = new window.ApexCharts(chartContainer, options);
                chart.render();
            }, 100);

        } catch (error) { 
            message = "❌ Error general: " + error.message; 
            console.error(error);
        }
    }
</script>

<main>
    <a href="/integrations" class="back-btn" data-sveltekit-reload>⬅ Volver al Panel</a>
    <h2>🌍 Demografía vs CO2 (Pablo)</h2>
    <p class="subtitle">Integración con <b>RestCountries API</b> usando <b>ApexCharts</b>.</p>

    {#if fallbackActivado}
        <div class="fallback-warning">
            ⚠️ Modo Respaldo activado. Revisa la consola (F12) para ver por qué falló el cruce de datos.
        </div>
    {/if}

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="card" class:hidden={!!message}>
        <div id="apex-chart"></div>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0; }
    main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h2 { color: #10b981; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 2rem; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 1rem; }
    .back-btn:hover { color: #10b981; }
    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    .alert { background: rgba(16, 185, 129, 0.2); border-left: 4px solid #10b981; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; text-align: center; color: #10b981; font-weight: bold;}
    .fallback-warning { background-color: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 0.8rem; border-radius: 8px; text-align: center; margin-bottom: 1.5rem; }
    .hidden { display: none; }
</style>