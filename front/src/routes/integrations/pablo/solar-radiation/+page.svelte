<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Cargando y cruzando datos con NASA POWER...");
    let fallbackActivado = $state(false);
    let chartInstance = null;

    const countries = [
        { name: "Germany", lat: 51.16, lon: 10.45 },
        { name: "Spain", lat: 40.46, lon: -3.75 },
        { name: "USA", lat: 37.09, lon: -95.71 },
        { name: "China", lat: 35.86, lon: 104.19 },
        { name: "France", lat: 46.60, lon: 1.88 },
        { name: "Italy", lat: 41.87, lon: 12.57 },
        { name: "Turkey", lat: 38.96, lon: 35.24 },
        { name: "Mexico", lat: 23.63, lon: -102.55 }
    ];

    onMount(async () => {
        if (!browser) return;

        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js";
        script.onload = () => {
            loadAndDraw();
        };
        document.head.appendChild(script);
    });

    async function loadAndDraw() {
        try {
            let bubbleData = [];

            console.log("1. Obteniendo datos de temperaturas (tu API)...");
            const tempRes = await fetch('/api/v2/average-annual-temperatures');
            if (!tempRes.ok) throw new Error("Fallo al cargar tu API local de temperaturas.");
            const allTemps = await tempRes.json();

            let tempByCountry = {};
            allTemps.forEach(d => {
                if (!tempByCountry[d.country]) tempByCountry[d.country] = [];
                tempByCountry[d.country].push(d.temperature);
            });

            console.log("2. Cruzando con NASA POWER...");
            
            for (const country of countries) {
                if (tempByCountry[country.name]) {
                    const tempsArray = tempByCountry[country.name];
                    const avgTemp = tempsArray.reduce((a, b) => a + b, 0) / tempsArray.length;

                    let radiacionAnual = null;

                    try {
                        const proxyRes = await fetch(`/api/proxy/pablo/nasa-power?lat=${country.lat}&lon=${country.lon}`);
                        
                        if (proxyRes.ok) {
                            const proxyData = await proxyRes.json();
                            if (proxyData.solar_radiation !== undefined) {
                                radiacionAnual = proxyData.solar_radiation;
                            }
                        } else {
                            const nasaUrl = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN&community=re&longitude=${country.lon}&latitude=${country.lat}&format=json`;
                            const nasaRes = await fetch(nasaUrl);
                            
                            if (nasaRes.ok) {
                                const data = await nasaRes.json();
                                const monthly = data.properties.parameter.ALLSKY_SFC_SW_DWN;
                                
                                const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
                                const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                                
                                let annualSum = 0;
                                months.forEach((month, i) => {
                                    annualSum += (monthly[month] || 0) * daysInMonth[i];
                                });
                                radiacionAnual = Math.round(annualSum);
                            }
                        }

                        if (radiacionAnual !== null) {
                            // Tamaño de burbuja = radiación solar (escalado para que se vea bien)
                            const bubbleSize = Math.min(30, Math.max(15, radiacionAnual / 80));
                            
                            bubbleData.push({
                                x: avgTemp,           // Eje X: Temperatura
                                y: radiacionAnual,    // Eje Y: Radiación Solar
                                r: bubbleSize,        // Radio de la burbuja
                                label: country.name,
                                temp: avgTemp.toFixed(1),
                                solar: radiacionAnual
                            });
                        }

                    } catch (err) {
                        console.error(`Error para ${country.name}:`, err);
                    }
                }
            }

            // Fallback si no hay datos
            if (bubbleData.length === 0) {
                fallbackActivado = true;
                bubbleData = [
                    { x: 10.3, y: 1100, r: 18, label: "Germany", temp: "10.3", solar: 1100 },
                    { x: 13.7, y: 1650, r: 22, label: "Spain", temp: "13.7", solar: 1650 },
                    { x: 11.6, y: 1540, r: 21, label: "USA", temp: "11.6", solar: 1540 },
                    { x: 8.1, y: 1200, r: 19, label: "China", temp: "8.1", solar: 1200 },
                    { x: 12.5, y: 1350, r: 20, label: "France", temp: "12.5", solar: 1350 },
                    { x: 13.5, y: 1580, r: 21, label: "Italy", temp: "13.5", solar: 1580 },
                    { x: 14.2, y: 1550, r: 21, label: "Turkey", temp: "14.2", solar: 1550 },
                    { x: 18.5, y: 1850, r: 24, label: "Mexico", temp: "18.5", solar: 1850 }
                ];
            } else {
                message = "";
            }

            setTimeout(() => {
                const ctx = document.getElementById('bubble-chart').getContext('2d');
                
                if (chartInstance) {
                    chartInstance.destroy();
                }

                chartInstance = new Chart(ctx, {
                    type: 'bubble',
                    data: {
                        datasets: [{
                            label: 'Países',
                            data: bubbleData,
                            backgroundColor: 'rgba(245, 158, 11, 0.6)',
                            borderColor: '#f59e0b',
                            borderWidth: 2,
                            hoverBackgroundColor: 'rgba(245, 158, 11, 0.8)'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        const data = context.raw;
                                        return [
                                            `${data.label}`,
                                            `🌡️ Temperatura: ${data.temp} °C`,
                                            `☀️ Radiación Solar: ${data.solar} kWh/m²/año`
                                        ];
                                    }
                                }
                            },
                            legend: { labels: { color: '#cbd5e1' } }
                        },
                        scales: {
                            x: {
                                title: { display: true, text: 'Temperatura Media Anual (°C)', color: '#94a3b8' },
                                ticks: { color: '#94a3b8' },
                                grid: { color: 'rgba(255, 255, 255, 0.1)' }
                            },
                            y: {
                                title: { display: true, text: 'Radiación Solar Anual (kWh/m²)', color: '#94a3b8' },
                                ticks: { color: '#94a3b8' },
                                grid: { color: 'rgba(255, 255, 255, 0.1)' }
                            }
                        }
                    }
                });
                
                // Añadir etiquetas manualmente después del render
                setTimeout(() => {
                    const canvas = document.getElementById('bubble-chart');
                    const chartArea = chartInstance.chartArea;
                    if (chartArea) {
                        // Las etiquetas ya están en el tooltip, no necesitamos overlay
                    }
                }, 100);
            }, 100);

        } catch (error) {
            console.error(error);
            message = "❌ Error en la integración: " + error.message;
        }
    }
</script>

<main>
    <a href="/integrations" class="back-btn">⬅ Volver al Panel de Integraciones</a>
    
    <h2>☀️ Radiación Solar vs 🌡️ Temperatura</h2>
    <p class="subtitle"><b>Chart.js Bubble Chart</b> - Datos de <b>NASA POWER</b> combinados con tu API</p>

    {#if fallbackActivado}
        <div class="fallback-warning">
            ⚠️ <b>Modo Respaldo Activado:</b> No se pudieron obtener datos de NASA POWER. Mostrando datos de ejemplo.
        </div>
    {/if}

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="card" class:hidden={!!message && !fallbackActivado}>
        <canvas id="bubble-chart" style="height: 500px; width: 100%;"></canvas>
    </div>
    
    <div class="info-box">
        <p>💡 <strong>¿Cómo leer este gráfico de burbujas?</strong></p>
        <ul>
            <li>🔴 <strong>Eje X</strong> → Temperatura media anual del país (°C)</li>
            <li>🔵 <strong>Eje Y</strong> → Radiación solar anual (kWh/m²)</li>
            <li>⚪ <strong>Tamaño de la burbuja</strong> → Proporcional a la radiación solar</li>
            <li>🔍 <strong>Hover sobre cada burbuja</strong> → Muestra país y valores exactos</li>
        </ul>
        <p class="insight">📈 <strong>Observación esperada:</strong> Países más cálidos (México, España) tienden a tener mayor radiación solar.</p>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0; }
    main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    
    h2 { color: #f59e0b; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 2rem; }
    
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 1rem; transition: color 0.2s; }
    .back-btn:hover { color: #f59e0b; }
    
    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 1.5rem; }
    
    .alert {
        background: rgba(245, 158, 11, 0.1);
        border-left: 4px solid #f59e0b;
        padding: 1rem;
        margin-bottom: 1.5rem;
        border-radius: 5px;
        text-align: center;
        color: #f59e0b;
        font-weight: bold;
    }
    
    .fallback-warning {
        background-color: rgba(239, 68, 68, 0.15);
        border: 1px solid #ef4444;
        color: #fca5a5;
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
        margin-bottom: 1.5rem;
    }
    
    .hidden { display: none; }
    
    .info-box {
        margin-top: 1.5rem;
        padding: 1rem 1.5rem;
        background: rgba(245, 158, 11, 0.08);
        border-radius: 12px;
        border: 1px solid rgba(245, 158, 11, 0.2);
    }
    
    .info-box p { margin: 0.5rem 0; color: #cbd5e1; }
    .info-box ul { margin: 0.5rem 0; padding-left: 1.5rem; color: #94a3b8; }
    .info-box li { margin: 0.3rem 0; }
    
    .insight {
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid rgba(245, 158, 11, 0.2);
        color: #f59e0b !important;
        font-size: 0.9rem;
    }
</style>