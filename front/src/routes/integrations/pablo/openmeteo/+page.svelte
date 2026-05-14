<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Cargando relación CO2 vs Población...");
    let fallbackActivado = $state(false);

    onMount(async () => {
        if (!browser) return;

        // 1. Cargar el CSS del tema oscuro de Billboard.js
        const link = document.createElement('link');
        link.rel = "stylesheet";
        link.href = "https://naver.github.io/billboard.js/release/latest/dist/theme/insight.min.css";
        document.head.appendChild(link);

        // 2. Billboard.js necesita D3.js como dependencia
        const scriptD3 = document.createElement('script');
        scriptD3.src = "https://d3js.org/d3.v6.min.js";
        scriptD3.onload = () => {
            const scriptBB = document.createElement('script');
            scriptBB.src = "https://naver.github.io/billboard.js/release/latest/dist/billboard.pkgd.min.js";
            scriptBB.onload = () => { loadAndDraw(); };
            document.head.appendChild(scriptBB);
        };
        document.head.appendChild(scriptD3);
    });

    async function loadAndDraw() {
        try {
            const origin = browser ? window.location.origin : '';
            
            // Obtener datos de CO2 desde tu API
            const resTemp = await fetch(`${origin}/api/v2/average-annual-temperatures`);
            let rawData = resTemp.ok ? await resTemp.json() : [];
            let dataTemp = Array.isArray(rawData) ? rawData : (rawData.data || []);
            
            // Obtener datos de población
            let countriesData = [];
            try {
                const resCountries = await fetch('https://restcountries.com/v3.1/all?fields=name,cca3,population');
                if (resCountries.ok) {
                    countriesData = await resCountries.json();
                }
            } catch(e) { console.warn("Fallo en la API de RestCountries."); }
            
            let xData = ["x"];
            let popData = ["Población (M)"];
            let co2Data = ["CO₂ (Mt)"];
            
            if (dataTemp.length > 0 && countriesData.length > 0) {
                const validData = dataTemp.filter(d => d && d.country && d.co2_emission);
                // Limitamos a 15 países para que las barras no se vean demasiado finas
                const uniqueCountries = [...new Set(validData.map(d => d.country))].slice(0, 15);
                
                uniqueCountries.forEach(countryName => {
                    const apiCountry = countriesData.find(c => 
                        c.name.common.toLowerCase() === countryName.toLowerCase() ||
                        c.cca3.toLowerCase() === countryName.toLowerCase()
                    );
                    
                    if (apiCountry && apiCountry.population > 0) {
                        const latestRecord = validData.filter(d => d.country === countryName).sort((a,b) => b.year - a.year)[0];
                        let co2Value = parseFloat(latestRecord.co2_emission) || 0;
                        const populationMillions = apiCountry.population / 1000000;
                        
                        xData.push(countryName);
                        popData.push(parseFloat(populationMillions.toFixed(1)));
                        co2Data.push(parseFloat(co2Value.toFixed(1)));
                    }
                });
            }
            
            // Fallback
            if (xData.length < 3) {
                fallbackActivado = true;
                xData = ["x", "USA", "China", "India", "Germany", "France", "UK", "Brazil", "Japan", "Mexico"];
                popData = ["Población (M)", 331.9, 1412.0, 1402.0, 83.2, 67.8, 67.3, 213.0, 125.8, 128.9];
                co2Data = ["CO₂ (Mt)", 485, 220, 58, 215, 140, 165, 72, 280, 130];
            }
            
            message = "";
            
            setTimeout(() => {
                const chartContainer = document.querySelector("#billboard-chart");
                if (!chartContainer) return;
                
                window.bb.generate({
                    bindto: "#billboard-chart",
                    data: {
                        x: "x",
                        columns: [
                            xData,
                            popData,
                            co2Data
                        ],
                        axes: {
                            "Población (M)": "y",   // Eje izquierdo
                            "CO₂ (Mt)": "y2"        // Eje derecho
                        },
                        // AQUÍ ESTÁ EL CAMBIO: Ambas series son de tipo "bar"
                        types: {
                            "Población (M)": "bar",
                            "CO₂ (Mt)": "bar"
                        },
                        colors: {
                            "Población (M)": "#38bdf8",
                            "CO₂ (Mt)": "#f43f5e"
                        }
                    },
                    bar: {
                        width: {
                            ratio: 0.8 // Grosor de las barras
                        },
                        padding: 3 // Espacio entre las barras del mismo país
                    },
                    axis: {
                        x: {
                            type: "category",
                            tick: {
                                rotate: -45,
                                multiline: false
                            },
                            height: 80
                        },
                        y: {
                            title: { text: "Población (Millones)" },
                            tick: { format: (x) => x + "M" }
                        },
                        y2: {
                            show: true, 
                            title: { text: "Emisiones CO₂ (Mt)" },
                            tick: { format: (x) => x + "t" }
                        }
                    },
                    grid: {
                        y: { show: true }
                    },
                    tooltip: {
                        format: {
                            title: (d) => `🌍 País: ${d}`,
                            value: (value, ratio, id) => id === "Población (M)" ? `${value} Millones` : `${value} Mt`
                        }
                    }
                });
            }, 150);
            
        } catch (error) { 
            message = "❌ Error: " + error.message; 
        }
    }
</script>

<main>
    <a href="/integrations" class="back-btn" data-sveltekit-reload>⬅ Volver al Panel</a>
    <h2>🌍 Población vs CO₂ (Billboard.js)</h2>
    <p class="subtitle">Gráfico de <b>Barras Agrupadas</b> con doble eje usando la librería <strong>Billboard.js</strong>.</p>

    {#if fallbackActivado}
        <div class="fallback-warning">
            ⚠️ Modo Respaldo: Datos demostrativos por fallo en las APIs.
        </div>
    {/if}

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="card" class:hidden={!!message}>
        <div class="chart-inner-bg">
            <div id="billboard-chart" style="min-height: 500px; width: 100%;"></div>
        </div>
    </div>
    
    <div class="info-box">
        <p>💡 <strong>Interpretación de la Gráfica:</strong></p>
        <ul>
            <li>🟦 <strong>Barra Azul</strong> → Representa la población en Millones (usa el eje izquierdo).</li>
            <li>🟥 <strong>Barra Roja</strong> → Representa las emisiones de CO₂ en Millones de Toneladas (usa el eje derecho).</li>
            <li>📏 <strong>Doble Eje</strong> → Permite comparar visualmente ambas barras de un mismo país, aunque sus escalas reales sean distintas.</li>
        </ul>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0; }
    main { max-width: 1100px; margin: 0 auto; padding: 2rem; }
    h2 { color: #38bdf8; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 2rem; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 1rem; }
    .back-btn:hover { color: #38bdf8; }
    
    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 1.5rem; }
    .chart-inner-bg { background-color: #1e293b; border-radius: 10px; padding: 1rem; }
    
    .alert { background: rgba(244, 63, 94, 0.2); border-left: 4px solid #f43f5e; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; text-align: center; color: #f43f5e; }
    .fallback-warning { background-color: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 0.8rem; border-radius: 8px; text-align: center; margin-bottom: 1.5rem; }
    .hidden { display: none; }
    
    .info-box {
        margin-top: 1.5rem;
        padding: 1rem 1.5rem;
        background: rgba(56, 189, 248, 0.08);
        border-radius: 12px;
        border: 1px solid rgba(56, 189, 248, 0.2);
    }
    .info-box p { margin: 0.5rem 0; color: #cbd5e1; }
    .info-box ul { margin: 0.5rem 0; padding-left: 1.5rem; color: #94a3b8; }
    .info-box li { margin: 0.3rem 0; }
    
    /* Correcciones visuales de Billboard para fondos oscuros */
    :global(.bb text) { fill: #cbd5e1 !important; }
    :global(.bb-axis path), :global(.bb-axis line) { stroke: #475569 !important; }
    :global(.bb-xgrid), :global(.bb-ygrid) { stroke-dasharray: 3; stroke: #334155 !important; }
    :global(.bb-tooltip) { background-color: #0f172a !important; color: white !important; border: 1px solid #38bdf8 !important; }
    :global(.bb-tooltip th) { background-color: #1e293b !important; color: white !important; }
</style>