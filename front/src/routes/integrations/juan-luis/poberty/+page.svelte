<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Descargando registros de Pobreza (Banco Mundial)...");
    let chartContainer;
    let datosCompletos = $state([]); 
    
    let availableYears = $state([]);
    let selectedYear = $state("");

    // --- VARIABLES REACTIVAS PARA EL RECUADRO (TOOLTIP) MÁGICO DE SVELTE ---
    let tooltipVisible = $state(false);
    let tooltipX = $state(0);
    let tooltipY = $state(0);
    let hoverData = $state(null);

    async function safeJson(res) {
        try { return res.ok ? await res.json() : []; } catch { return []; }
    }

    onMount(async () => {
        if (!browser) return;

        try {
            const resMis = await fetch("/api/v2/social-drinking-behaviors");
            const misDatos = await safeJson(resMis);

            // Banco Mundial: Pobreza Extrema (% de población con < $2.15 al día)
            const resWB = await fetch("https://api.worldbank.org/v2/country/all/indicator/SI.POV.DDAY?format=json&date=2015:2022&per_page=3000");
            const wbDatos = await safeJson(resWB);

            if (misDatos.length === 0 || !wbDatos[1]) {
                message = "⚠️ Faltan datos para cruzar.";
                return;
            }

            const pobrezaMap = new Map();
            wbDatos[1].forEach(item => {
                if (item.country && item.value !== null && item.date) {
                    let nombre = item.country.value.toLowerCase();
                    if (nombre.includes("united states")) nombre = "united states of america";
                    if (nombre.includes("united kingdom")) nombre = "united kingdom";
                    if (nombre.includes("russia")) nombre = "russian federation";
                    
                    pobrezaMap.set(`${nombre}_${item.date}`, item.value);
                }
            });

            let tempYears = new Set();
            let cruzados = [];

            misDatos.forEach(d => {
                let pais = String(d.country).trim().toLowerCase();
                let anio = String(d.year); 
                let clave = `${pais}_${anio}`;
                
                if (pobrezaMap.has(clave)) {
                    tempYears.add(anio);
                    
                    cruzados.push({
                        country: d.country,
                        year: anio,
                        pobreza: Number(pobrezaMap.get(clave).toFixed(1)),
                        cerveza: Number(d.beer_share) || 0,
                        vino: Number(d.wine_share) || 0,
                        licores: Number(d.spirits_share) || 0,
                        alcoholTotal: (Number(d.beer_share) || 0) + (Number(d.wine_share) || 0) + (Number(d.spirits_share) || 0)
                    });
                }
            });

            if (cruzados.length === 0) {
                message = "⚠️ No hay suficientes coincidencias de datos.";
                return;
            }

            datosCompletos = cruzados;
            availableYears = Array.from(tempYears).sort().reverse(); 
            selectedYear = availableYears[0]; 
            message = "";

            esperarD3();

        } catch (error) {
            console.error(error);
            message = "Error crítico cargando los datos.";
        }
    });

    function esperarD3() {
        const check = setInterval(() => {
            if (window.d3 && chartContainer) {
                clearInterval(check);
                dibujarLollipop();
            }
        }, 100);
    }

    // Redibujamos si cambias el año
    $effect(() => {
        if (selectedYear && datosCompletos.length > 0 && browser && window.d3) {
            dibujarLollipop();
        }
    });

    // --- EL MOTOR DE D3.JS ---
    function dibujarLollipop() {
        if (!window.d3 || !chartContainer) return;

        // Limpiamos el lienzo anterior
        window.d3.select(chartContainer).selectAll("*").remove();

        let datosFiltrados = datosCompletos.filter(d => d.year === selectedYear);
        datosFiltrados.sort((a, b) => b.pobreza - a.pobreza); // Ordenar de más pobre a menos

        const margin = {top: 30, right: 30, bottom: 90, left: 60};
        const width = chartContainer.clientWidth - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        // Creamos el SVG
        const svg = window.d3.select(chartContainer)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Eje X
        const x = window.d3.scaleBand()
            .range([ 0, width ])
            .domain(datosFiltrados.map(d => d.country))
            .padding(1);
        
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(window.d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end")
            .style("fill", "#cbd5e1")
            .style("font-size", "12px");

        // Eje Y
        const maxPobreza = window.d3.max(datosFiltrados, d => d.pobreza);
        const y = window.d3.scaleLinear()
            .domain([0, maxPobreza * 1.1]) // Le damos un 10% de aire por arriba
            .range([ height, 0]);
        
        svg.append("g")
            .call(window.d3.axisLeft(y).tickFormat(d => d + "%"))
            .selectAll("text")
            .style("fill", "#cbd5e1");

        // 1. Dibujamos el "Palo" de la piruleta (Línea)
        svg.selectAll("myline")
            .data(datosFiltrados)
            .enter()
            .append("line")
            .attr("x1", d => x(d.country))
            .attr("x2", d => x(d.country))
            .attr("y1", y(0))
            .attr("y2", d => y(d.pobreza))
            .attr("stroke", "#475569")
            .attr("stroke-width", "2px");

        // 2. Dibujamos el "Caramelo" de la piruleta (Círculo interactivo)
        svg.selectAll("mycircle")
            .data(datosFiltrados)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.country))
            .attr("cy", d => y(d.pobreza))
            .attr("r", "8")
            .style("fill", "#ef4444")
            .attr("stroke", "#b91c1c")
            .attr("stroke-width", "2px")
            .style("cursor", "pointer")
            // EVENTOS DE RATÓN PARA CONECTAR D3 CON SVELTE
            .on("mouseover", function(event, d) {
                window.d3.select(this).transition().duration(200).attr("r", 14).style("fill", "#facc15");
                hoverData = d;
                tooltipVisible = true;
            })
            .on("mousemove", function(event) {
                // Actualizamos coordenadas del recuadro
                tooltipX = event.pageX + 20;
                tooltipY = event.pageY - 40;
            })
            .on("mouseleave", function(event, d) {
                window.d3.select(this).transition().duration(200).attr("r", 8).style("fill", "#ef4444");
                tooltipVisible = false;
            });
    }
</script>

<svelte:head>
    <!-- Cargamos D3.js V7 Oficial -->
    <script src="https://d3js.org/d3.v7.min.js"></script>
</svelte:head>

<main>
    <div class="header-nav">
        <a href="/integrations/juan-luis" class="back-btn">⬅ Volver al Panel</a>
    </div>

    <div class="card">
        <div class="top-bar">
            <h2>🌍 Pobreza Extrema vs Alcohol (D3.js Puro)</h2>
            <p class="desc">
                Cruce de datos con el <strong>Banco Mundial</strong> utilizando un Gráfico de Piruleta (Lollipop Chart). 
                Construido a bajo nivel con vectores matemáticos SVG de D3.
            </p>
        </div>

        {#if message}
            <div class="loading-state">
                <span class="spinner">{message}</span>
            </div>
        {:else}
            <!-- EL FILTRO DE AÑO -->
            <div class="controls">
                <label for="yearSelector">📅 Selecciona el Año:</label>
                <select id="yearSelector" bind:value={selectedYear}>
                    {#each availableYears as yr}
                        <option value={yr}>Año {yr}</option>
                    {/each}
                </select>
                <span class="badge">Mostrando {datosCompletos.filter(d => d.year === selectedYear).length} países</span>
            </div>

            <div class="chart-box">
                <div bind:this={chartContainer} style="width: 100%; height: 500px; position: relative;"></div>
            </div>
        {/if}
    </div>
</main>

<!-- EL RECUADRO HTML NATIVO DE SVELTE (TOOLTIP) -->
{#if tooltipVisible && hoverData}
    <div class="d3-tooltip" style="left: {tooltipX}px; top: {tooltipY}px;">
        <strong class="t-title">{hoverData.country} ({hoverData.year})</strong><br>
        <hr class="t-divider"/>
        🔴 <b>Pobreza Extrema:</b> {hoverData.pobreza}%<br>
        <span class="t-sub">(Supervivencia con &lt; $2.15 al día)</span><br><br>        🔵 <b>Alcohol Total:</b> {hoverData.alcoholTotal.toFixed(1)}%<br>
        <hr class="t-divider"/>
        <i>Desglose API Interna:</i><br>
        🍺 Cerveza: <b>{hoverData.cerveza}%</b><br>
        🍷 Vino: <b>{hoverData.vino}%</b><br>
        🥃 Licores: <b>{hoverData.licores}%</b>
    </div>
{/if}

<style>
    :global(body) { background: #0f172a; color: white; margin: 0; font-family: 'Segoe UI', sans-serif; }
    main { padding: 2rem; max-width: 1100px; margin: auto; }
    .header-nav { margin-bottom: 2rem; }
    
    .back-btn { color: #ef4444; text-decoration: none; font-weight: bold; border: 1px solid #ef4444; padding: 0.5rem 1rem; border-radius: 8px; transition: 0.3s; }
    .back-btn:hover { background: rgba(239, 68, 68, 0.2); }
    
    .card { background: #1e293b; padding: 2rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); border: 1px solid #334155;}
    
    .top-bar h2 { margin: 0 0 0.5rem 0; color: #ef4444; }
    .desc { color: #94a3b8; margin-top: 0; margin-bottom: 1.5rem; line-height: 1.5; }

    .controls { background: #0b1120; padding: 1.5rem; border-radius: 12px; border: 1px solid #334155; margin-bottom: 2rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .controls label { color: #cbd5e1; font-weight: bold; font-size: 1.1rem; }
    select { background: #1e293b; color: #ef4444; border: 1px solid #ef4444; padding: 0.6rem 1rem; border-radius: 8px; font-size: 1rem; cursor: pointer; outline: none; font-weight: bold;}
    
    .badge { background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.9rem; border: 1px solid #ef4444; }

    .loading-state { text-align: center; padding: 3rem; color: #facc15; font-size: 1.2rem; border: 2px dashed #facc15; border-radius: 8px;}
    
    .chart-box { 
        background: #0b1120; 
        border-radius: 12px; 
        padding: 1rem; 
        border: 1px solid #334155;
    }

    /* ESTILOS DEL TOOLTIP HTML NATIVO */
    .d3-tooltip {
        position: absolute;
        pointer-events: none; /* Evita que el ratón "choque" con el recuadro */
        background: rgba(15, 23, 42, 0.95);
        color: white;
        padding: 15px;
        border-radius: 10px;
        border: 1px solid #ef4444;
        box-shadow: 0 10px 25px rgba(0,0,0,0.8);
        font-size: 14px;
        min-width: 220px;
        z-index: 9999;
        transition: top 0.1s ease-out, left 0.1s ease-out; /* Movimiento fluido */
    }

    .d3-tooltip .t-title { color: #ef4444; font-size: 18px; }
    .d3-tooltip .t-divider { border-color: #334155; margin: 10px 0; }
    .d3-tooltip .t-sub { font-size: 11px; color: #94a3b8; }
</style>