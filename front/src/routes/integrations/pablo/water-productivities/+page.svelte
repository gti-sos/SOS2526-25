<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    // SVELTE 5 RUNES
    let message = $state("Cargando métricas globales de CO₂...");
    let fallbackActivado = $state(false);

    onMount(async () => {
        if (!browser) return;

        // Cargamos G2Plot (AntV) desde su CDN oficial
        const script = document.createElement('script');
        script.src = "https://unpkg.com/@antv/g2plot@2.4.31/dist/g2plot.min.js";
        script.onload = () => { loadAndDraw(); };
        document.head.appendChild(script);
    });

    async function loadAndDraw() {
        try {
            const origin = browser ? window.location.origin : '';
            
            // 1. Fetch a tu API de Temperaturas y CO2
            const resTemp = await fetch(`${origin}/api/v2/average-annual-temperatures`);
            let rawData = resTemp.ok ? await resTemp.json() : [];
            let dataTemp = Array.isArray(rawData) ? rawData : (rawData.data || []);

            let chartData = [];

            if (dataTemp.length > 0) {
                // Extraemos el último registro de CO2 por cada país
                const uniqueCountries = [...new Set(dataTemp.map(d => d.country))];
                
                uniqueCountries.forEach(country => {
                    // Ordenamos por año descendente para coger el dato más reciente
                    const records = dataTemp.filter(d => d.country === country).sort((a,b) => b.year - a.year);
                    if (records.length > 0 && records[0].co2_emission) {
                        chartData.push({
                            country: country,
                            co2: parseFloat(records[0].co2_emission)
                        });
                    }
                });
                
                // Ordenamos de mayor a menor contaminación y cogemos los 12 primeros 
                // para que la "Rosa" quede estéticamente equilibrada
                chartData = chartData.sort((a, b) => b.co2 - a.co2).slice(0, 12);
            }

            // 2. MODO RESPALDO (Fallback)
            if (chartData.length < 3) {
                fallbackActivado = true;
                chartData = [
                    { country: "China", co2: 10500 },
                    { country: "USA", co2: 5000 },
                    { country: "India", co2: 2500 },
                    { country: "Rusia", co2: 1700 },
                    { country: "Japón", co2: 1100 },
                    { country: "Alemania", co2: 700 },
                    { country: "Corea Sur", co2: 600 },
                    { country: "Canadá", co2: 550 }
                ];
            }

            message = "";

            // 3. Dibujar la gráfica con AntV G2Plot
            setTimeout(() => {
                const container = document.getElementById('rose-chart');
                if (!container) return;

                const rosePlot = new window.G2Plot.Rose(container, {
                    data: chartData,
                    xField: 'country', // La categoría (Los pétalos)
                    yField: 'co2',     // El valor (La longitud del pétalo)
                    seriesField: 'country', // Para que cada pétalo tenga un color distinto
                    radius: 0.9,       // Tamaño general de la rosa
                    innerRadius: 0.15, // Crea un hueco en el centro tipo "Donut"
                    theme: 'dark',     // Modo oscuro nativo
                    legend: { 
                        position: 'bottom',
                    },
                    label: {
                        offset: -15, // Pone el texto dentro del pétalo
                        style: {
                            fill: '#ffffff',
                            fontSize: 13,
                            fontWeight: 'bold',
                            shadowBlur: 4,
                            shadowColor: 'rgba(0, 0, 0, 0.8)'
                        }
                    },
                    tooltip: {
                        formatter: (datum) => {
                            return { name: 'Emisiones Totales', value: datum.co2 + ' Mt CO₂' };
                        }
                    },
                    animation: {
                        appear: {
                            animation: 'wave-in', // Animación de entrada circular
                            duration: 1500
                        }
                    }
                });

                rosePlot.render();
            }, 150);

        } catch(e) {
            console.error(e);
            message = "❌ Error: " + e.message;
        }
    }
</script>

<main>
    <div class="header-nav">
        <a href="/integrations" class="back-btn" data-sveltekit-reload>⬅ Volver al Panel</a>
    </div>

    <div class="card">
        <div class="top-bar">
            <h2>🌸 Emisiones Globales de CO₂</h2>
            <p class="subtitle">Gráfico de Rosa de Nightingale usando <b>AntV G2Plot</b>.</p>
        </div>

        {#if fallbackActivado}
            <div class="fallback-warning">
                ⚠️ Modo Respaldo: No se detectaron suficientes datos en la API. Usando top de países simulado.
            </div>
        {/if}

        {#if message}
            <p class="status-msg">{message}</p>
        {/if}

        <div class="chart-box" class:hidden={!!message}>
            <div id="rose-chart" style="height: 550px; width: 100%;"></div>
        </div>
        
        <div class="info-box">
            <p>💡 <strong>¿Cómo interpretar este Gráfico de Rosa?</strong></p>
            <ul>
                <li>🍰 <strong>Ángulo Constante:</strong> A diferencia de un gráfico de tarta, todos los "pétalos" tienen exactamente el mismo ancho.</li>
                <li>📏 <strong>Longitud Variable:</strong> Es el <i>largo</i> (radio) de cada porción lo que indica la cantidad de CO₂ emitido.</li>
                <li>🏆 <strong>Visualización de Rankings:</strong> Es ideal para ver de un vistazo rápido la enorme desproporción entre los mayores emisores mundiales y el resto.</li>
            </ul>
        </div>
    </div>
</main>

<style>
    :global(body) { background: #0f172a; color: white; margin: 0; font-family: 'Segoe UI', sans-serif; }
    main { padding: 2rem; max-width: 1000px; margin: auto; }
    
    .header-nav { margin-bottom: 1.5rem; }
    .back-btn { color: #c084fc; text-decoration: none; font-weight: bold; border: 1px solid #c084fc; padding: 0.5rem 1rem; border-radius: 8px; transition: 0.3s; }
    .back-btn:hover { background: rgba(192, 132, 252, 0.2); }
    
    .card { background: #1e293b; padding: 2rem; border-radius: 20px; border: 1px solid #334155; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
    
    .top-bar { text-align: center; margin-bottom: 1.5rem; }
    h2 { margin: 0 0 0.5rem 0; color: #c084fc; font-size: 2rem;}
    .subtitle { color: #94a3b8; margin: 0; }
    
    .status-msg { color: #facc15; font-size: 1.2rem; text-align: center; border: 2px dashed #facc15; padding: 1rem; border-radius: 8px; }
    
    .fallback-warning {
        background-color: rgba(239, 68, 68, 0.15);
        border: 1px solid #ef4444;
        color: #fca5a5;
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
        margin-bottom: 1.5rem;
    }
    
    .chart-box { background: #0f172a; border-radius: 10px; padding: 1rem; margin-bottom: 1.5rem; }
    .hidden { display: none; }
    
    .info-box {
        padding: 1.5rem;
        background: rgba(192, 132, 252, 0.08);
        border-radius: 12px;
        border: 1px solid rgba(192, 132, 252, 0.2);
    }
    .info-box p { margin: 0 0 1rem 0; color: #f3e8ff; font-size: 1.1rem;}
    .info-box ul { margin: 0; padding-left: 1.5rem; color: #d8b4fe; line-height: 1.8;}
</style>