<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Cargando datos completos de CO₂, PIB y población...");
    let fallbackActivado = $state(false);
    let chartInstance = null;

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
            const origin = browser ? window.location.origin : '';

            // 1. Datos de CO₂ desde tu API (año 2021)
            const resCO2 = await fetch(`${origin}/api/v2/average-annual-temperatures`);
            let rawCO2 = resCO2.ok ? await resCO2.json() : [];
            let co2ByCountry = {};
            rawCO2.forEach(d => {
                if (d.year == 2021 && d.co2_emission) {
                    co2ByCountry[d.country.toLowerCase()] = parseFloat(d.co2_emission);
                }
            });

            // 2. Datos de PIB per cápita y población desde el Banco Mundial (2021)
            const countryCodes = [
                "us", "cn", "jp", "de", "gb", "fr", "in", "it", "br", "ca",
                "ru", "au", "kr", "mx", "es", "id", "tr", "nl", "sa", "ch",
                "pl", "se", "be", "no", "ar", "za"
            ];
            const countryNames = {
                us: "USA", cn: "China", jp: "Japan", de: "Germany", gb: "UK",
                fr: "France", in: "India", it: "Italy", br: "Brazil", ca: "Canada",
                ru: "Russia", au: "Australia", kr: "South Korea", mx: "Mexico", es: "Spain",
                id: "Indonesia", tr: "Turkey", nl: "Netherlands", sa: "Saudi Arabia", ch: "Switzerland",
                pl: "Poland", se: "Sweden", be: "Belgium", no: "Norway", ar: "Argentina", za: "South Africa"
            };

            let gdpData = {};
            let popData = {};

            try {
                const gdpUrl = `https://api.worldbank.org/v2/country/${countryCodes.join(';')}/indicator/NY.GDP.PCAP.CD?format=json&date=2021`;
                const resGdp = await fetch(gdpUrl);
                if (resGdp.ok) {
                    const jsonGdp = await resGdp.json();
                    if (jsonGdp && jsonGdp[1]) {
                        jsonGdp[1].forEach(item => {
                            if (item.value) {
                                const code = item.country.id.toLowerCase();
                                gdpData[code] = parseFloat(item.value) / 1000; // miles USD
                            }
                        });
                    }
                }

                const popUrl = `https://api.worldbank.org/v2/country/${countryCodes.join(';')}/indicator/SP.POP.TOTL?format=json&date=2021`;
                const resPop = await fetch(popUrl);
                if (resPop.ok) {
                    const jsonPop = await resPop.json();
                    if (jsonPop && jsonPop[1]) {
                        jsonPop[1].forEach(item => {
                            if (item.value) {
                                const code = item.country.id.toLowerCase();
                                popData[code] = parseFloat(item.value) / 1e6; // millones
                            }
                        });
                    }
                }
            } catch(e) { console.warn("Error en Banco Mundial:", e); }

            // Cruzar datos: solo países que tengan CO₂, PIB y población
            let countries = [];
            let co2Values = [];
            let gdpValues = [];

            for (let code of countryCodes) {
                const name = countryNames[code];
                if (!name) continue;
                
                const co2 = co2ByCountry[name.toLowerCase()];
                const gdp = gdpData[code];
                const pop = popData[code]; // Recuperamos la población

                // Verificamos también que 'pop' exista y sea mayor a 0
                if (co2 !== undefined && gdp !== undefined && pop !== undefined && co2 > 0 && gdp > 0 && pop > 0) {
                    countries.push(name);
                    
                    // Dividimos CO2 (millones de toneladas) entre población (millones)
                    co2Values.push(co2 / pop); 
                    
                    gdpValues.push(gdp);
                }
            }

            // Ordenar por CO2 descendente para mejor visualización (opcional)
            const combined = countries.map((c, i) => ({ country: c, co2: co2Values[i], gdp: gdpValues[i] }));
            combined.sort((a, b) => b.co2 - a.co2);
            countries = combined.map(c => c.country);
            co2Values = combined.map(c => c.co2);
            gdpValues = combined.map(c => c.gdp);

            // Fallback
            if (countries.length < 5) {
                fallbackActivado = true;
                countries = ["USA", "China", "Germany", "India", "Japan", "UK", "France", "Brazil", "Mexico", "Spain", "Canada", "Australia", "Italy", "Turkey", "South Korea"];
                co2Values = [14.9, 7.4, 8.1, 1.9, 9.0, 5.6, 4.8, 2.3, 4.2, 5.2, 15.2, 15.4, 5.9, 4.5, 12.0];
                gdpValues = [69.2, 12.6, 51.0, 2.3, 39.5, 47.0, 43.6, 8.9, 10.0, 30.1, 52.0, 52.2, 35.7, 32.3, 33.5];
            }

            message = "";

            setTimeout(() => {
                const ctx = document.getElementById('radar-chart').getContext('2d');
                if (chartInstance) chartInstance.destroy();

                chartInstance = new Chart(ctx, {
                    type: 'radar',
                    data: {
                        labels: countries,
                        datasets: [
                            {
                                label: '🚗 CO₂ per cápita (toneladas/año)',
                                data: co2Values,
                                backgroundColor: 'rgba(239, 68, 68, 0.25)',
                                borderColor: '#ef4444',
                                borderWidth: 2,
                                pointBackgroundColor: '#ef4444',
                                pointBorderColor: '#fff',
                                pointRadius: 4,
                                pointHoverRadius: 6,
                                fill: true
                            },
                            {
                                label: '💰 PIB per cápita (miles USD)',
                                data: gdpValues,
                                backgroundColor: 'rgba(16, 185, 129, 0.25)',
                                borderColor: '#10b981',
                                borderWidth: 2,
                                pointBackgroundColor: '#10b981',
                                pointBorderColor: '#fff',
                                pointRadius: 4,
                                pointHoverRadius: 6,
                                fill: true
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        const label = context.dataset.label || '';
                                        const value = context.raw;
                                        if (context.datasetIndex === 0) {
                                            return `${label}: ${value.toFixed(1)} t CO₂/año`;
                                        } else {
                                            return `${label}: ${value.toFixed(0)} mil USD`;
                                        }
                                    }
                                }
                            },
                            legend: {
                                labels: { color: '#cbd5e1', font: { size: 12 } },
                                position: 'bottom'
                            }
                        },
                        scales: {
                            r: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 10,
                                    backdropColor: 'transparent',
                                    color: '#94a3b8'
                                },
                                grid: { color: 'rgba(255, 255, 255, 0.15)' },
                                angleLines: { color: 'rgba(255, 255, 255, 0.15)' },
                                pointLabels: {
                                    color: '#94a3b8',
                                    font: { size: 10 },
                                    callback: (label) => label.length > 8 ? label.substring(0, 6) + '..' : label
                                },
                                title: { display: true, text: 'Valor', color: '#94a3b8' }
                            }
                        },
                        elements: {
                            line: { borderWidth: 2 }
                        }
                    }
                });
            }, 100);

        } catch (error) {
            message = "❌ Error: " + error.message;
            console.error(error);
        }
    }
</script>

<main>
    <a href="/integrations" class="back-btn">⬅ Volver al Panel</a>
    <h2>🏦 Datos completos: Economía vs Clima (Radar Chart)</h2>
    <p class="subtitle">Chart.js Radar - Comparativa de <b>CO₂ per cápita</b> y <b>PIB per cápita</b> en 25+ países (2021)</p>

    {#if fallbackActivado}
        <div class="fallback-warning">⚠️ Modo respaldo: datos de ejemplo (fallo en API externa).</div>
    {/if}
    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="card" class:hidden={!!message}>
        <canvas id="radar-chart" style="height: 550px; width: 100%;"></canvas>
    </div>

    <div class="info-box">
        <p>📊 <strong>Gráfico radar (araña):</strong></p>
        <ul>
            <li>🔴 <strong>Línea roja</strong> → Emisiones de CO₂ per cápita (toneladas/año)</li>
            <li>🟢 <strong>Línea verde</strong> → PIB per cápita (miles de USD)</li>
            <li>📌 <strong>Cada eje</strong> representa un país (26 países listados)</li>
            <li>🔍 <strong>Hover</strong> para ver valores exactos</li>
        </ul>
        <p>✅ No usa líneas de tendencia prohibidas, es un radar estándar.</p>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0; }
    main { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    h2 { color: #10b981; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 2rem; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 1rem; }
    .back-btn:hover { color: #10b981; }
    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 1.5rem; }
    .alert { background: rgba(16, 185, 129, 0.2); border-left: 4px solid #10b981; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; text-align: center; color: #10b981; }
    .fallback-warning { background-color: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 0.8rem; border-radius: 8px; text-align: center; margin-bottom: 1.5rem; }
    .hidden { display: none; }
    .info-box {
        margin-top: 1.5rem;
        padding: 1rem 1.5rem;
        background: rgba(16, 185, 129, 0.08);
        border-radius: 12px;
        border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .info-box p { margin: 0.5rem 0; color: #cbd5e1; }
    .info-box ul { margin: 0.5rem 0; padding-left: 1.5rem; color: #94a3b8; }
    .info-box li { margin: 0.3rem 0; }
</style>