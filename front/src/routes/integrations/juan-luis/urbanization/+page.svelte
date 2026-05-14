<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Consultando los archivos globales de la Fundación Nobel...");
    let chartContainer;
    let datosCompletos = $state([]); 
    
    let availableYears = $state([]);
    let selectedYear = $state("");

    async function safeJson(res) {
        try { return res.ok ? await res.json() : []; } catch { return []; }
    }

    onMount(async () => {
        if (!browser) return;

        try {
            // 1. Cargamos tu base de datos local
            const resMis = await fetch("/api/v2/social-drinking-behaviors");
            const misDatos = await safeJson(resMis);

            // 2. Cargamos la API Oficial de los Premios Nobel
            const resNobel = await fetch("https://api.nobelprize.org/v1/laureate.json");
            const nobelDatos = await safeJson(resNobel);

            if (misDatos.length === 0 || !nobelDatos.laureates) {
                message = "⚠️ Faltan datos para cruzar o la API Nobel no responde.";
                return;
            }

            // 3. Filtramos y mapeamos los Premios Nobel (Solo del 2000 en adelante)
            const premiosMap = new Map();
            
            nobelDatos.laureates.forEach(laureado => {
                if (laureado.bornCountry && laureado.prizes) {
                    let nombre = laureado.bornCountry.toLowerCase();
                    
                    // Normalizaciones de países para que encajen con tu base de datos
                    if (nombre.includes("usa") || nombre.includes("united states")) nombre = "united states of america";
                    if (nombre.includes("united kingdom")) nombre = "united kingdom";
                    if (nombre.includes("russia")) nombre = "russian federation";

                    laureado.prizes.forEach(premio => {
                        // Filtramos estrictamente del año 2000 hacia arriba
                        if (parseInt(premio.year) >= 2000) {
                            premiosMap.set(nombre, (premiosMap.get(nombre) || 0) + 1);
                        }
                    });
                }
            });

            // 4. Cruzamos con tus datos de consumo
            let tempYears = new Set();
            let cruzados = [];
            let paisesProcesados = new Set();

            misDatos.forEach(d => {
                let pais = String(d.country).trim().toLowerCase();
                let anio = String(d.year); 
                
                if (premiosMap.has(pais)) {
                    tempYears.add(anio);
                    let claveUnica = `${pais}_${anio}`;
                    
                    if (!paisesProcesados.has(claveUnica)) {
                        paisesProcesados.add(claveUnica);
                        
                        cruzados.push({
                            country: d.country,
                            year: anio,
                            premiosGanados: premiosMap.get(pais),
                            cerveza: Number(d.beer_share) || 0,
                            vino: Number(d.wine_share) || 0,
                            licores: Number(d.spirits_share) || 0
                        });
                    }
                }
            });

            if (cruzados.length === 0) {
                message = "⚠️ No hay coincidencias de países galardonados en tu BD.";
                return;
            }

            datosCompletos = cruzados;
            availableYears = Array.from(tempYears).sort().reverse(); 
            selectedYear = availableYears[0]; 
            message = "";

            esperarYRenderizar();

        } catch (error) {
            console.error(error);
            message = "Error crítico cargando la cartografía de los Nobel.";
        }
    });

    function esperarYRenderizar() {
        const check = setInterval(() => {
            if (window.Plotly && chartContainer) {
                clearInterval(check);
                dibujarMapa();
            }
        }, 100);
    }

    $effect(() => {
        if (selectedYear && datosCompletos.length > 0 && browser && window.Plotly) {
            dibujarMapa();
        }
    });

    function dibujarMapa() {
        if (!window.Plotly || !chartContainer) return;

        const datosFiltrados = datosCompletos.filter(d => d.year === selectedYear);

        const trace = {
            type: 'choropleth',
            locationmode: 'country names',
            locations: datosFiltrados.map(d => d.country),
            z: datosFiltrados.map(d => d.premiosGanados),
            text: datosFiltrados.map(d => d.country),
            customdata: datosFiltrados.map(d => [d.cerveza, d.vino, d.licores]),
            colorscale: 'YlOrBr', // Escala de amarillo a marrón (color oro)
            autocolorscale: false,
            reversescale: false,
            marker: {
                line: { color: '#1e293b', width: 0.5 }
            },
            colorbar: {
                title: 'Nº Premios Nobel',
                tickfont: { color: '#cbd5e1' },
                titlefont: { color: '#cbd5e1' }
            },
            hovertemplate: 
                '<b style="font-size:16px; color:#ffffff;">%{text}</b><br><br>' +
                '🏆 <b>Nobel (S. XXI):</b> %{z}<br>' +
                '-----------------------<br>' +
                '🍺 Cerveza: %{customdata[0]}%<br>' +
                '🍷 Vino: %{customdata[1]}%<br>' +
                '🥃 Licores: %{customdata[2]}%<br>' +
                '<extra></extra>'
        };

        const layout = {
            title: { 
                text: `Mapa Mundial: Premios Nobel vs Alcohol (${selectedYear})`, 
                font: { color: '#eab308' } 
            },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            geo: {
                showframe: false,
                showcoastlines: true,
                coastlinecolor: '#334155',
                projection: { type: 'robinson' },
                bgcolor: 'transparent',
                showocean: true,
                oceancolor: '#0b1120',
                showland: true,
                landcolor: '#1e293b'
            },
            margin: { l: 0, r: 0, t: 50, b: 0 }
        };

        window.Plotly.react(chartContainer, [trace], layout, { responsive: true, displayModeBar: false });
    }
</script>

<svelte:head>
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
</svelte:head>

<main>
    <div class="header-nav">
        <a href="/integrations/juan-luis" class="back-btn">⬅ Volver a Integraciones Juan Luis</a>
    </div>

    <div class="card">
        <div class="top-bar">
            <h2>🌍 Mapa Cartográfico: Premios Nobel y Alcohol</h2>
            <p class="desc">
                Análisis geoespacial cruzando la cartografía de <strong>Plotly</strong> con la API de la 
                <strong>Fundación Nobel</strong>. Se muestran los países con galardonados desde el <strong>año 2000</strong>.
            </p>
        </div>

        {#if message}
            <div class="loading-state">
                <span class="spinner">{message}</span>
            </div>
        {:else}
            <div class="controls">
                <label>📅 Año de consumo:</label>
                <select bind:value={selectedYear}>
                    {#each availableYears as yr} <option value={yr}>{yr}</option> {/each}
                </select>
                <span class="badge">
                    Datos de {datosCompletos.filter(d => d.year === selectedYear).length} países mapeados
                </span>
                <span class="source-tag">Fuente: Nobel Prize API</span>
            </div>
            
            <div class="chart-box">
                <div bind:this={chartContainer} style="width: 100%; height: 500px;"></div>
            </div>
        {/if}
    </div>
</main>

<style>
    :global(body) { background: #0f172a; color: white; margin: 0; font-family: sans-serif; }
    main { padding: 2rem; max-width: 1100px; margin: auto; }
    .header-nav { margin-bottom: 2rem; }
    .back-btn { color: #eab308; text-decoration: none; font-weight: bold; border: 1px solid #eab308; padding: 0.5rem 1rem; border-radius: 8px; transition: 0.3s;}
    .back-btn:hover { background: rgba(234, 179, 8, 0.2); }
    .card { background: #1e293b; padding: 2rem; border-radius: 20px; border: 1px solid #334155; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
    .top-bar h2 { color: #eab308; margin: 0 0 0.5rem 0; }
    .desc { color: #94a3b8; line-height: 1.5; margin-bottom: 1.5rem;}
    .controls { background: #0b1120; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; border: 1px solid #334155; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;}
    .controls label { font-weight: bold; color: #cbd5e1;}
    select { background: #1e293b; color: #eab308; padding: 0.5rem 1rem; border-radius: 5px; font-weight: bold; border: 1px solid #eab308; outline: none; cursor: pointer;}
    .badge { background: rgba(234, 179, 8, 0.1); color: #eab308; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.9rem; border: 1px solid #eab308; }
    .source-tag { color: #64748b; font-size: 0.8rem; margin-left: auto; font-weight: bold; }
    .loading-state { color: #facc15; padding: 2rem; text-align: center; border: 2px dashed #facc15; border-radius: 10px; font-weight: bold; font-size: 1.2rem;}
    .chart-box { background: #0b1120; border-radius: 12px; padding: 1rem; border: 1px solid #334155; overflow: hidden; }
</style>