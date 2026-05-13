<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Cruzando Temperaturas con Desastres Naturales (ONU)...");
    let fallbackActivado = $state(false);

    onMount(async () => {
        if (!browser) return;
        const script = document.createElement('script');
        script.src = "https://cdn.plot.ly/plotly-2.32.0.min.js";
        script.onload = () => loadAndDraw();
        document.head.appendChild(script);
    });

    async function loadAndDraw() {
        try {
            const resTemp = await fetch('/api/v2/average-annual-temperatures');
            let dataTemp = resTemp.ok ? await resTemp.json() : [];
            
            // Diccionario ultra-flexible
           const countryMapping = {
                    "spain": "ESP", "españa": "ESP", "es": "ESP",
                    "germany": "DEU", "alemania": "DEU", "de": "DEU",
                    "france": "FRA", "francia": "FRA", "fr": "FRA",
                    "usa": "USA", "eeuu": "USA", "united states": "USA", "us": "USA",
                    "china": "CHN", "cn": "CHN",
                    "italy": "ITA", "italia": "ITA", "it": "ITA",
                    "japan": "JPN", "japón": "JPN",
                    "chad": "TCD",
                    "ethiopia": "ETH", "etiopía": "ETH",
                    "mongolia": "MNG",
                    "turkey": "TUR", "turquía": "TUR",
                    "equatorial guinea": "GNQ", "guinea ecuatorial": "GNQ",
                    "egypt": "EGY", "egipto": "EGY",
                    "ukraine": "UKR", "ucrania": "UKR",
                    "latvia": "LVA", "letonia": "LVA",
                    "angola": "AGO",
                    "liberia": "LBR",
                    "afghanistan": "AFG", "afganistán": "AFG",
                    "mexico": "MEX", "méxico": "MEX",
                    "algeria": "DZA", "argelia": "DZA",
                    "greece": "GRC", "grecia": "GRC",
                    "estonia": "EST",
                    "austria": "AUT",
                    "nigeria": "NGA",
                    "slovenia": "SVN", "eslovenia": "SVN",
                    "belgium": "BEL", "bélgica": "BEL",
                    "el salvador": "SLV",
                    "united kingdom": "GBR", "reino unido": "GBR", "uk": "GBR",
                    "south africa": "ZAF", "sudáfrica": "ZAF"
                };

            let xTemp = [];
            let yDisasters = [];
            let textLabels = [];
            let debugData = [];

            for (const record of dataTemp) {
                const rawCountry = (record.country || "").toLowerCase().trim();
                const isoCode = countryMapping[rawCountry];
                const year = record.year;
                const temp = record.temperature || record.avg_temp;

                if (isoCode && year && temp !== undefined) {
                    try {
                        // 🔥 PETICIÓN POST DE LA SOLUCIÓN NUEVA 🔥
                        const resONU = await fetch('https://api.reliefweb.int/v1/disasters?appname=pablo', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                filter: {
                                    operator: "AND",
                                    conditions: [
                                        { field: "country.iso3", value: isoCode },
                                        { 
                                            field: "date.created", 
                                            value: { 
                                                from: `${year}-01-01T00:00:00+00:00`, 
                                                to: `${year}-12-31T23:59:59+00:00` 
                                            } 
                                        }
                                    ]
                                },
                                limit: 1
                            })
                        });

                        if (!resONU.ok) throw new Error(`Status: ${resONU.status}`);
                        const resJSON = await resONU.json();

                        if (resJSON.totalCount !== undefined) {
                            xTemp.push(temp);
                            yDisasters.push(resJSON.totalCount);
                            textLabels.push(`${record.country} (${year})`);
                            debugData.push({ País: record.country, Año: year, Status: "✅ OK", Desastres: resJSON.totalCount });
                        }

                        // Respiro de 150ms para no saturar la API
                        await new Promise(resolve => setTimeout(resolve, 150));

                    } catch (e) { 
                        debugData.push({ País: record.country, Año: year, Status: "❌ Error API", Detalle: e.message });
                    }
                } else {
                    debugData.push({ País: record.country, Año: year, Status: "❌ No cruzado", Detalle: "Falta mapa o temp" });
                }
            }

            console.table(debugData);

            if (xTemp.length > 0) {
                fallbackActivado = false;
                message = "";
            } else {
                fallbackActivado = true;
                xTemp = [10, 12, 14, 16, 18];
                yDisasters = [2, 15, 22, 35, 50];
                textLabels = ["Backup 1", "Backup 2", "Backup 3", "Backup 4", "Backup 5"];
                message = "";
            }

            setTimeout(() => {
                const trace = {
                    x: xTemp, y: yDisasters, mode: 'markers+text', type: 'scatter',
                    text: textLabels, textposition: 'top center',
                    marker: { size: 16, color: '#f43f5e', line: { color: 'white', width: 2 } }
                };
                window.Plotly.newPlot('disaster-chart', [trace], {
                    title: 'Relación Real: Temperatura vs Desastres (ReliefWeb)',
                    xaxis: { title: 'Tu Temperatura (ºC)', color: '#94a3b8' },
                    yaxis: { title: 'Nº Desastres Registrados', color: '#94a3b8' },
                    paper_bgcolor: 'transparent', plot_bgcolor: 'rgba(255,255,255,0.02)',
                    margin: { t: 80, b: 80, l: 80, r: 50 }
                }, {responsive: true});
            }, 100);

        } catch (error) { message = "❌ Error: " + error.message; }
    }
</script>

<main>
    <a href="/integrations" class="back-btn" data-sveltekit-reload>⬅ Volver al Panel</a>
    <h2>🔥 Desastres y Calor (Pablo)</h2>
    
    {#if fallbackActivado}
        <div class="fallback-warning">
            ⚠️ Modo Respaldo: No se encontraron coincidencias. Revisa la consola (F12) para ver el diagnóstico.
        </div>
    {/if}

    <div class="card">
        <div id="disaster-chart" style="height: 550px; width: 100%;"></div>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0; }
    main { max-width: 1100px; margin: 0 auto; padding: 2rem; }
    h2 { color: #f43f5e; text-align: center; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; margin-bottom: 1rem; display: inline-block; }
    .card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 1.5rem; }
    .fallback-warning { background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #fca5a5; padding: 1rem; text-align: center; margin-bottom: 1.5rem; border-radius: 10px;}
</style>