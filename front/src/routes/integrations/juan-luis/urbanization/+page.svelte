<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Cargando cartografía mundial y datos...");
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
            const resMis = await fetch("/api/v2/social-drinking-behaviors");
            const misDatos = await safeJson(resMis);

            // API Banco Mundial: Población Urbana (% del total)
            const resWB = await fetch("https://api.worldbank.org/v2/country/all/indicator/SP.URB.TOTL.IN.ZS?format=json&date=2015:2022&per_page=3000");
            const wbDatos = await safeJson(resWB);

            if (misDatos.length === 0 || !wbDatos[1]) {
                message = "⚠️ Faltan datos para cruzar.";
                return;
            }

            const urbanMap = new Map();
            wbDatos[1].forEach(item => {
                if (item.country && item.value !== null && item.date) {
                    let nombre = item.country.value.toLowerCase();
                    // Normalización para que Plotly reconozca los países
                    if (nombre.includes("united states")) nombre = "united states";
                    if (nombre.includes("united kingdom")) nombre = "united kingdom";
                    if (nombre.includes("russia")) nombre = "russia";
                    if (nombre === "korea, rep.") nombre = "south korea";
                    
                    urbanMap.set(`${nombre}_${item.date}`, item.value);
                }
            });

            let tempYears = new Set();
            let cruzados = [];

            misDatos.forEach(d => {
                let pais = String(d.country).trim().toLowerCase();
                if (pais === "united states of america") pais = "united states";
                if (pais === "russian federation") pais = "russia";

                let anio = String(d.year); 
                let clave = `${pais}_${anio}`;
                
                if (urbanMap.has(clave)) {
                    tempYears.add(anio);
                    cruzados.push({
                        // Capitalizamos la primera letra para el mapa
                        country: pais.charAt(0).toUpperCase() + pais.slice(1),
                        year: anio,
                        urbanizacion: Number(urbanMap.get(clave).toFixed(1)),
                        cerveza: Number(d.beer_share) || 0,
                        vino: Number(d.wine_share) || 0,
                        licores: Number(d.spirits_share) || 0
                    });
                }
            });

            datosCompletos = cruzados;
            availableYears = Array.from(tempYears).sort().reverse(); 
            selectedYear = availableYears[0]; 
            message = "";

            esperarYRenderizar();

        } catch (error) {
            console.error(error);
            message = "Error crítico cargando la cartografía.";
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

        let datosFiltrados = datosCompletos.filter(d => d.year === selectedYear);

        const xPaises = datosFiltrados.map(d => d.country);
        const zUrbanizacion = datosFiltrados.map(d => d.urbanizacion);
        
        // Datos ocultos para el recuadro interactivo
        const infoExtra = datosFiltrados.map(d => [d.cerveza, d.vino, d.licores]);

        const trace = {
            type: 'choropleth',
            locationmode: 'country names', // Magia: Plotly busca el país por su nombre automáticamente
            locations: xPaises,
            z: zUrbanizacion,
            text: xPaises,
            customdata: infoExtra,
            colorscale: 'YlGnBu', // Escala de colores (Amarillo -> Verde -> Azul)
            autocolorscale: false,
            reversescale: true,
            marker: {
                line: { color: '#1e293b', width: 0.5 } // Bordes de los países
            },
            colorbar: {
                title: 'Nivel Urbano (%)',
                tickfont: { color: '#cbd5e1' },
                titlefont: { color: '#cbd5e1' }
            },
            hovertemplate: 
                '<b style="font-size:16px;">%{text}</b><br><br>' +
                '🏙️ <b>Población Urbana:</b> %{z}%<br>' +
                '-----------------------<br>' +
                '🍺 Cerveza: %{customdata[0]}%<br>' +
                '🍷 Vino: %{customdata[1]}%<br>' +
                '🥃 Licores: %{customdata[2]}%<br>' +
                '<extra></extra>'
        };

        const layout = {
            title: { text: `Distribución Demográfica Mundial (${selectedYear})`, font: { color: '#a855f7' } },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            geo: {
                showframe: false,
                showcoastlines: true,
                coastlinecolor: '#334155',
                projection: { type: 'robinson' }, // Proyección de mapa estéticamente muy profesional
                bgcolor: 'transparent',
                showocean: true,
                oceancolor: '#0b1120', // Océano en modo oscuro
                showland: true,
                landcolor: '#1e293b' // Países sin datos en gris oscuro
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
            <h2>🌍 Mapa Cartográfico: Urbanización y Alcohol</h2>
            <p class="desc">
                Un análisis geoespacial cruzando la cartografía base de <strong>Plotly</strong> con la demografía del <strong>Banco Mundial</strong>. 
                Los países más oscuros tienen mayor concentración de habitantes en ciudades.
            </p>
        </div>

        {#if message}
            <div class="loading-state">{message}</div>
        {:else}
            <div class="controls">
                <label>📅 Año del satélite:</label>
                <select bind:value={selectedYear}>
                    {#each availableYears as yr} <option value={yr}>{yr}</option> {/each}
                </select>
                <span class="badge">Datos de {datosCompletos.filter(d => d.year === selectedYear).length} países mapeados</span>
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
    .controls { background: #0b1120; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; border: 1px solid #334155; display: flex; align-items: center; gap: 1rem;}
    .controls label { font-weight: bold; color: #cbd5e1;}
    select { background: #1e293b; color: #a855f7; padding: 0.5rem 1rem; border-radius: 5px; font-weight: bold; border: 1px solid #a855f7; outline: none; cursor: pointer;}
    .badge { background: rgba(168, 85, 247, 0.1); color: #a855f7; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.9rem; border: 1px solid #a855f7; }
    .loading-state { color: #facc15; padding: 2rem; text-align: center; border: 2px dashed #facc15; border-radius: 10px;}
    
    .chart-box { 
        background: #0b1120; 
        border-radius: 12px; 
        padding: 1rem; 
        border: 1px solid #334155;
        overflow: hidden; /* Evita que el mapa sobresalga de la tarjeta */
    }
</style>