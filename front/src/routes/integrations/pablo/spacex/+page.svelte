<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Cargando y estructurando jerarquía mundial...");
    let fallbackActivado = $state(false);

    onMount(async () => {
        if (!browser) return;

        // Cargar Apache ECharts desde su CDN oficial
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js";
        script.onload = () => { loadAndDraw(); };
        document.head.appendChild(script);
    });

    async function loadAndDraw() {
        try {
            const origin = browser ? window.location.origin : '';
            
            // 1. Obtener datos de tu API (Temperaturas)
            const resTemp = await fetch(`${origin}/api/v2/average-annual-temperatures`);
            let rawData = resTemp.ok ? await resTemp.json() : [];
            let dataTemp = Array.isArray(rawData) ? rawData : (rawData.data || []);
            
            // 2. Obtener datos de países y continentes (RestCountries)
            let countriesData = [];
            try {
                const resCountries = await fetch('https://restcountries.com/v3.1/all?fields=name,cca3,population,region');
                if (resCountries.ok) {
                    countriesData = await resCountries.json();
                }
            } catch(e) { console.warn("Fallo en RestCountries."); }
            
            // 3. Cruzar datos y estructurar jerárquicamente: Continente -> País
            let groupedData = {};
            
            if (dataTemp.length > 0 && countriesData.length > 0) {
                const uniqueCountries = [...new Set(dataTemp.map(d => d.country))];
                
                uniqueCountries.forEach(countryName => {
                    const apiCountry = countriesData.find(c => 
                        c.name.common.toLowerCase() === countryName.toLowerCase() ||
                        c.cca3.toLowerCase() === countryName.toLowerCase()
                    );
                    
                    if (apiCountry && apiCountry.population > 0) {
                        const region = apiCountry.region || "Otros";
                        const popMillions = apiCountry.population / 1000000;
                        
                        if (!groupedData[region]) {
                            groupedData[region] = [];
                        }
                        
                        groupedData[region].push({
                            name: countryName,
                            value: parseFloat(popMillions.toFixed(1))
                        });
                    }
                });
            }
            
            // Convertir el objeto agrupado en el formato Array que pide ECharts
            let sunburstData = Object.keys(groupedData).map(region => {
                return {
                    name: region,
                    children: groupedData[region]
                };
            });
            
            // 4. MODO RESPALDO (Fallback) si fallan las APIs
            if (sunburstData.length === 0) {
                fallbackActivado = true;
                sunburstData = [
                    {
                        name: "Europe",
                        itemStyle: { color: '#38bdf8' },
                        children: [
                            { name: "Germany", value: 83.2 },
                            { name: "France", value: 67.8 },
                            { name: "UK", value: 67.3 },
                            { name: "Spain", value: 47.4 },
                            { name: "Italy", value: 59.2 }
                        ]
                    },
                    {
                        name: "Americas",
                        itemStyle: { color: '#f43f5e' },
                        children: [
                            { name: "USA", value: 331.9 },
                            { name: "Brazil", value: 213.0 },
                            { name: "Mexico", value: 128.9 },
                            { name: "Canada", value: 38.2 }
                        ]
                    },
                    {
                        name: "Asia",
                        itemStyle: { color: '#facc15' },
                        children: [
                            { name: "China", value: 1412.0 },
                            { name: "India", value: 1402.0 },
                            { name: "Japan", value: 125.8 }
                        ]
                    }
                ];
            }
            
            message = "";
            
            // 5. Dibujar la gráfica
            setTimeout(() => {
                const chartContainer = document.getElementById("echarts-container");
                if (!chartContainer) return;
                
                const myChart = window.echarts.init(chartContainer);
                
                const option = {
                    backgroundColor: 'transparent',
                    title: {
                        text: '🌍 Jerarquía Demográfica Mundial',
                        subtext: 'Continentes y Países por Población (Millones)',
                        textStyle: { color: '#e2e8f0', fontSize: 18 },
                        subtextStyle: { color: '#94a3b8' },
                        left: 'center'
                    },
                    tooltip: {
                        trigger: 'item',
                        formatter: '{b}: {c} Millones de habitantes'
                    },
                    series: {
                        type: 'sunburst',
                        data: sunburstData,
                        radius: [0, '90%'], // Tamaño de la explosión
                        itemStyle: {
                            borderRadius: 7, // Bordes redondeados en las porciones
                            borderWidth: 2,
                            borderColor: '#0f172a' // Color de fondo para separar las porciones
                        },
                        label: {
                            show: true,
                            color: '#ffffff',
                            fontWeight: 'bold',
                            formatter: '{b}' // Muestra el nombre
                        },
                        // Configuración visual por niveles
                        levels: [
                            {}, // Nivel 0 (Centro vacío)
                            {
                                // Nivel 1 (Continentes)
                                r0: '15%',
                                r: '45%',
                                itemStyle: { borderWidth: 2 },
                                label: { rotate: 'tangential' }
                            },
                            {
                                // Nivel 2 (Países)
                                r0: '45%',
                                r: '85%',
                                label: { align: 'right' },
                                itemStyle: { opacity: 0.8 }
                            }
                        ]
                    }
                };
                
                myChart.setOption(option);
                
                // Hacer el gráfico responsivo
                window.addEventListener('resize', () => { myChart.resize(); });
                
            }, 150);
            
        } catch (error) { 
            message = "❌ Error: " + error.message; 
            console.error(error);
        }
    }
</script>

<main>
    <a href="/integrations" class="back-btn" data-sveltekit-reload>⬅ Volver al Panel</a>
    <h2>🌞 Distribución Poblacional (Sunburst)</h2>
    <p class="subtitle">Gráfico radial multinivel usando <strong>Apache ECharts</strong>. (Cero líneas empleadas).</p>

    {#if fallbackActivado}
        <div class="fallback-warning">
            ⚠️ Modo Respaldo: Las APIs no respondieron o no hay coincidencias. Mostrando datos simulados estructurados.
        </div>
    {/if}

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="card" class:hidden={!!message}>
        <div id="echarts-container" style="height: 650px; width: 100%;"></div>
    </div>
    
    <div class="info-box">
        <p>💡 <strong>¿Cómo interpretar un Sunburst?</strong></p>
        <ul>
            <li>⭕ <strong>Anillo Interior:</strong> Representa los Continentes o Regiones.</li>
            <li>🪐 <strong>Anillo Exterior:</strong> Representa los Países que pertenecen a ese continente.</li>
            <li>📏 <strong>Tamaño del Arco:</strong> El grosor (ángulo) de cada porción es directamente proporcional a su población total.</li>
            <li>🖱️ <strong>Interactividad:</strong> Haz clic en un continente para aislarlo y expandir sus datos. Haz clic en el centro para volver atrás.</li>
        </ul>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0; }
    main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h2 { color: #facc15; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 2rem; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 1rem; }
    .back-btn:hover { color: #facc15; }
    
    .card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
    .alert { background: rgba(250, 204, 21, 0.2); border-left: 4px solid #facc15; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; text-align: center; color: #fef08a; font-weight: bold;}
    .fallback-warning { background-color: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 0.8rem; border-radius: 8px; text-align: center; margin-bottom: 1.5rem; }
    .hidden { display: none; }
    
    .info-box {
        margin-top: 1.5rem;
        padding: 1.5rem;
        background: rgba(250, 204, 21, 0.08);
        border-radius: 12px;
        border: 1px solid rgba(250, 204, 21, 0.2);
    }
    
    .info-box p { margin: 0 0 1rem 0; color: #fef08a; font-size: 1.1rem;}
    .info-box ul { margin: 0; padding-left: 1.5rem; color: #fef08a; line-height: 1.8;}
    .info-box li { margin: 0.3rem 0; }
</style>