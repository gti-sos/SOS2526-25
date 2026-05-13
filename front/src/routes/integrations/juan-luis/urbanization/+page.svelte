<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Descargando censo global de universidades (OpenAlex)...");
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
            // 1. Cargamos tu base de datos
            const resMis = await fetch("/api/v2/social-drinking-behaviors");
            const misDatos = await safeJson(resMis);

            // 2. Cargamos la API de OpenAlex (Catálogo Abierto de Instituciones)
            // Devuelve el conteo total de Universidades/Instituciones agrupado por país
            const resUni = await fetch("https://api.openalex.org/institutions?group_by=country_code");
            const uniDatos = await safeJson(resUni);

            if (misDatos.length === 0 || !uniDatos.group_by) {
                message = "⚠️ Faltan datos para cruzar o la API está saturada.";
                return;
            }

            // 3. Mapeamos las universidades por país
            const uniMap = new Map();
            uniDatos.group_by.forEach(item => {
                if (item.key_display_name && item.count) {
                    let nombre = item.key_display_name.toLowerCase();
                    
                    // Normalizaciones básicas
                    if (nombre.includes("united states")) nombre = "united states of america";
                    if (nombre.includes("united kingdom")) nombre = "united kingdom";
                    if (nombre.includes("russia")) nombre = "russian federation";
                    
                    uniMap.set(nombre, item.count);
                }
            });

            // 4. Cruzamos con tus datos de consumo
            let tempYears = new Set();
            let cruzados = [];
            let paisesProcesados = new Set(); // Para evitar duplicados en el mapa

            misDatos.forEach(d => {
                let pais = String(d.country).trim().toLowerCase();
                let anio = String(d.year); 
                
                if (uniMap.has(pais)) {
                    tempYears.add(anio);
                    
                    // Solo metemos un registro por país y año
                    let claveUnica = `${pais}_${anio}`;
                    if (!paisesProcesados.has(claveUnica)) {
                        paisesProcesados.add(claveUnica);
                        
                        cruzados.push({
                            country: d.country,
                            year: anio,
                            universidades: uniMap.get(pais),
                            cerveza: Number(d.beer_share) || 0,
                            vino: Number(d.wine_share) || 0,
                            licores: Number(d.spirits_share) || 0
                        });
                    }
                }
            });

            if (cruzados.length === 0) {
                message = "⚠️ No hay coincidencias de países con el registro universitario.";
                return;
            }

            datosCompletos = cruzados;
            availableYears = Array.from(tempYears).sort().reverse(); 
            selectedYear = availableYears[0]; 
            message = "";

            esperarYRenderizar();

        } catch (error) {
            console.error(error);
            message = "Error crítico cargando la cartografía y los datos.";
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
            locationmode: 'country names', // Plotly engancha automáticamente los nombres en inglés
            locations: datosFiltrados.map(d => d.country),
            z: datosFiltrados.map(d => d.universidades),
            text: datosFiltrados.map(d => d.country),
            customdata: datosFiltrados.map(d => [d.cerveza, d.vino, d.licores]),
            colorscale: 'Viridis', // Escala de color científica y muy visual
            autocolorscale: false,
            reversescale: true,
            marker: {
                line: { color: '#1e293b', width: 0.5 }
            },
            colorbar: {
                title: 'Nº Instituciones',
                tickfont: { color: '#cbd5e1' },
                titlefont: { color: '#cbd5e1' }
            },
            hovertemplate: 
                '<b style="font-size:16px; color:#ffffff;">%{text}</b><br><br>' +
                '🎓 <b>Universidades Registradas:</b> %{z}<br>' +
                '-----------------------<br>' +
                '🍺 Cerveza: %{customdata[0]}%<br>' +
                '🍷 Vino: %{customdata[1]}%<br>' +
                '🥃 Licores: %{customdata[2]}%<br>' +
                '<extra></extra>' // Elimina recuadros secundarios molestos
        };

        const layout = {
            title: { 
                text: `Mapa Mundial: Sector Académico vs Consumo (${selectedYear})`, 
                font: { color: '#a855f7' } 
            },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            geo: {
                showframe: false,
                showcoastlines: true,
                coastlinecolor: '#334155',
                projection: { type: 'robinson' }, // Mapa curvado más estético
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
            <h2>🌍 Mapa Cartográfico: Universidades y Alcohol</h2>
            <p class="desc">
                Análisis geoespacial cruzando la cartografía de <strong>Plotly</strong> con datos en tiempo real de 
                <strong>OpenAlex</strong> (Catálogo global de investigación). 
                Los países más claros tienen mayor concentración de universidades.
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
                <span class="source-tag">Fuente: OpenAlex API</span>
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
    .back-btn { color: #a855f7; text-decoration: none; font-weight: bold; border: 1px solid #a855f7; padding: 0.5rem 1rem; border-radius: 8px; transition: 0.3s;}
    .back-btn:hover { background: rgba(168, 85, 247, 0.2); }
    .card { background: #1e293b; padding: 2rem; border-radius: 20px; border: 1px solid #334155; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
    .top-bar h2 { color: #a855f7; margin: 0 0 0.5rem 0; }
    .desc { color: #94a3b8; line-height: 1.5; margin-bottom: 1.5rem;}
    .controls { background: #0b1120; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; border: 1px solid #334155; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;}
    .controls label { font-weight: bold; color: #cbd5e1;}
    select { background: #1e293b; color: #a855f7; padding: 0.5rem 1rem; border-radius: 5px; font-weight: bold; border: 1px solid #a855f7; outline: none; cursor: pointer;}
    .badge { background: rgba(168, 85, 247, 0.1); color: #a855f7; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.9rem; border: 1px solid #a855f7; }
    .source-tag { color: #64748b; font-size: 0.8rem; margin-left: auto; font-weight: bold; }
    .loading-state { color: #facc15; padding: 2rem; text-align: center; border: 2px dashed #facc15; border-radius: 10px; font-weight: bold; font-size: 1.2rem;}
    .chart-box { background: #0b1120; border-radius: 12px; padding: 1rem; border: 1px solid #334155; overflow: hidden; }
</style>