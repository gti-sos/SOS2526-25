<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Cargando gráfico 3D multidimensional...");
    let fallbackActivado = $state(false);

    onMount(async () => {
        if (!browser) return;
        
        // Cargamos Plotly.js desde su CDN oficial
        const script = document.createElement('script');
        script.src = "https://cdn.plot.ly/plotly-2.32.0.min.js";
        script.onload = () => { loadAndDraw(); };
        document.head.appendChild(script);
    });

    async function loadAndDraw() {
        try {
            const origin = browser ? window.location.origin : '';
            
            // 1. Obtener datos de tu API (Temperaturas y CO2)
            const resTemp = await fetch(`${origin}/api/v2/average-annual-temperatures`);
            let rawData = resTemp.ok ? await resTemp.json() : [];
            let dataTemp = Array.isArray(rawData) ? rawData : (rawData.data || []);
            
            // 2. Obtener datos de población desde RestCountries
            let countriesData = [];
            try {
                const resCountries = await fetch('https://restcountries.com/v3.1/all?fields=name,cca3,population');
                if (resCountries.ok) {
                    countriesData = await resCountries.json();
                }
            } catch(e) { console.warn("Fallo RestCountries."); }
            
            // Arrays para los 3 ejes
            let xPop = [];     // Eje X: Población
            let yCo2 = [];     // Eje Y: CO2
            let zTemp = [];    // Eje Z: Temperatura
            let hoverTexts = []; // Tooltips
            
            if (dataTemp.length > 0 && countriesData.length > 0) {
                const validData = dataTemp.filter(d => d && d.country && d.co2_emission && d.temperature);
                const uniqueCountries = [...new Set(validData.map(d => d.country))];
                
                uniqueCountries.forEach(countryName => {
                    const apiCountry = countriesData.find(c => 
                        c.name.common.toLowerCase() === countryName.toLowerCase() ||
                        c.cca3.toLowerCase() === countryName.toLowerCase()
                    );
                    
                    if (apiCountry && apiCountry.population > 0) {
                        const latestRecord = validData.filter(d => d.country === countryName).sort((a,b) => b.year - a.year)[0];
                        
                        let co2 = parseFloat(latestRecord.co2_emission) || 0;
                        let temp = parseFloat(latestRecord.temperature) || 0;
                        let popMillions = apiCountry.population / 1000000;
                        
                        // Limitamos CO2 a 1500 visualmente para que los gigantes (China/USA) no rompan la escala
                        if (co2 > 1500) co2 = 1500; 
                        
                        xPop.push(parseFloat(popMillions.toFixed(1)));
                        yCo2.push(parseFloat(co2.toFixed(1)));
                        zTemp.push(parseFloat(temp.toFixed(1)));
                        
                        // Texto que saldrá al pasar el ratón por la esfera
                        hoverTexts.push(
                            `<b>${countryName}</b><br>` +
                            `👥 Población: ${popMillions.toFixed(1)}M<br>` +
                            `🏭 CO₂: ${co2.toFixed(1)} Mt<br>` +
                            `🌡️ Temp: ${temp.toFixed(1)} ºC`
                        );
                    }
                });
            }
            
            // Fallback con datos demo
            if (xPop.length < 3) {
                fallbackActivado = true;
                xPop = [331.9, 1412.0, 1402.0, 83.2, 67.8, 67.3, 213.0, 125.8, 47.4, 59.2];
                yCo2 = [1485, 1500, 580, 215, 140, 165, 72, 280, 160, 175];
                zTemp = [11.8, 8.2, 24.5, 10.5, 13.0, 9.5, 25.5, 12.0, 14.4, 13.5];
                hoverTexts = [
                    "USA", "China", "India", "Germany", "France", 
                    "UK", "Brazil", "Japan", "Spain", "Italy"
                ];
            }
            
            message = "";
            
            // 3. Dibujar la gráfica 3D
            setTimeout(() => {
                const chartContainer = document.querySelector("#plotly-3d-chart");
                if (!chartContainer) return;
                
                const trace = {
                    x: xPop,
                    y: yCo2,
                    z: zTemp,
                    mode: 'markers',
                    marker: {
                        size: 12,
                        color: zTemp,          // El color cambia según la temperatura
                        colorscale: 'Portland', // Escala de frío (azul) a calor (rojo)
                        opacity: 0.9,
                        line: { width: 1, color: '#ffffff' } // Borde blanco
                    },
                    text: hoverTexts,
                    hoverinfo: 'text',
                    type: 'scatter3d'
                };
                
                const layout = {
                    margin: { l: 0, r: 0, b: 0, t: 0 }, // Aprovechar el espacio
                    paper_bgcolor: 'transparent',
                    scene: {
                        xaxis: { title: 'Población (M)', backgroundcolor: '#1e293b', gridcolor: '#334155', color: '#38bdf8' },
                        yaxis: { title: 'CO₂ (Mt)', backgroundcolor: '#1e293b', gridcolor: '#334155', color: '#f43f5e' },
                        zaxis: { title: 'Temp (ºC)', backgroundcolor: '#1e293b', gridcolor: '#334155', color: '#facc15' }
                    }
                };
                
                window.Plotly.newPlot(chartContainer, [trace], layout, {responsive: true});
            }, 150);
            
        } catch (error) { 
            message = "❌ Error: " + error.message; 
            console.error(error);
        }
    }
</script>

<main>
    <a href="/integrations" class="back-btn" data-sveltekit-reload>⬅ Volver al Panel</a>
    <h2>🌌 Dimensiones: Población, CO₂ y Temperatura</h2>
    <p class="subtitle">Gráfico <b>3D Multidimensional</b> interactivo usando <strong>Plotly.js</strong>.</p>

    {#if fallbackActivado}
        <div class="fallback-warning">
            ⚠️ Modo Respaldo: Datos demostrativos (10 países).
        </div>
    {/if}

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="card" class:hidden={!!message}>
        <div id="plotly-3d-chart" style="height: 600px; width: 100%;"></div>
    </div>
    
    <div class="info-box">
        <p>💡 <strong>¿Cómo interactuar con este gráfico 3D?</strong></p>
        <ul>
            <li>👆 <strong>Rotar:</strong> Haz clic izquierdo y arrastra para girar el cubo en cualquier dirección.</li>
            <li>🔍 <strong>Hacer Zoom:</strong> Usa la rueda del ratón para acercarte o alejarte.</li>
            <li>↔️ <strong>Mover:</strong> Haz clic derecho y arrastra para desplazar la cámara.</li>
            <li>🎨 <strong>Color:</strong> Las esferas más rojas representan países más cálidos, las azules más fríos.</li>
        </ul>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0; }
    main { max-width: 1100px; margin: 0 auto; padding: 2rem; }
    h2 { color: #c084fc; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 2rem; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 1rem; }
    .back-btn:hover { color: #c084fc; }
    
    .card { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 0.5rem; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);}
    .alert { background: rgba(192, 132, 252, 0.2); border-left: 4px solid #c084fc; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; text-align: center; color: #d8b4fe; font-weight: bold;}
    .fallback-warning { background-color: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 0.8rem; border-radius: 8px; text-align: center; margin-bottom: 1.5rem; }
    .hidden { display: none; }
    
    .info-box {
        margin-top: 1.5rem;
        padding: 1.5rem;
        background: rgba(192, 132, 252, 0.08);
        border-radius: 12px;
        border: 1px solid rgba(192, 132, 252, 0.2);
    }
    
    .info-box p { margin: 0 0 1rem 0; color: #f3e8ff; font-size: 1.1rem;}
    .info-box ul { margin: 0; padding-left: 1.5rem; color: #d8b4fe; line-height: 1.8;}
    .info-box li { margin: 0.3rem 0; }
</style>