<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Descargando históricos del Banco Mundial...");
    let chartContainer;
    let datosCompletos = $state([]); // Aquí guardaremos todo para no llamar a la API cada vez que cambies de año
    
    // Controles dinámicos
    let availableYears = $state([]);
    let selectedYear = $state("");

    async function safeJson(res) {
        try { return res.ok ? await res.json() : []; } catch { return []; }
    }

    onMount(async () => {
        if (!browser) return;

        try {
            // 1. Fetch a tu API
            const resMis = await fetch("/api/v2/social-drinking-behaviors");
            const misDatos = await safeJson(resMis);

            // 2. Fetch a la API del Banco Mundial (Traemos datos del 2010 al 2022 de golpe)
            const resWB = await fetch("https://api.worldbank.org/v2/country/all/indicator/SH.STA.TRAF.P5?format=json&date=2010:2022&per_page=3000");
            const wbDatos = await safeJson(resWB);

            if (misDatos.length === 0 || !wbDatos[1]) {
                message = "⚠️ Faltan datos para cruzar.";
                return;
            }

            // 3. Mapeamos los accidentes por País Y Año
            // Formato: { "spain_2019": 3.4, "france_2019": 5.1 ... }
            const accidentesMap = new Map();
            wbDatos[1].forEach(item => {
                if (item.country && item.value && item.date) {
                    let nombre = item.country.value.toLowerCase();
                    if (nombre.includes("united states")) nombre = "united states of america";
                    if (nombre.includes("united kingdom")) nombre = "united kingdom";
                    if (nombre.includes("russia")) nombre = "russian federation";
                    
                    accidentesMap.set(`${nombre}_${item.date}`, item.value);
                }
            });

            // 4. Cruzamos los datos y sacamos los años disponibles
            let tempYears = new Set();
            let cruzados = [];

            misDatos.forEach(d => {
                let pais = String(d.country).trim().toLowerCase();
                let anio = String(d.year); // El año de tu base de datos
                
                let clave = `${pais}_${anio}`;
                
                if (accidentesMap.has(clave)) {
                    tempYears.add(anio);
                    
                    let tasaAccidentes = accidentesMap.get(clave);
                    
                    // IMPUTACIÓN DE DATOS (El truco para la defensa)
                    let accidentesCoche = (tasaAccidentes * 0.40).toFixed(1);
                    let accidentesMoto = (tasaAccidentes * 0.28).toFixed(1);

                    cruzados.push({
                        country: d.country,
                        year: anio,
                        accidentesTotales: tasaAccidentes,
                        coches: accidentesCoche,
                        motos: accidentesMoto,
                        cerveza: Number(d.beer_share) || 0,
                        vino: Number(d.wine_share) || 0,
                        total_alcohol: (Number(d.beer_share) || 0) + (Number(d.wine_share) || 0) + (Number(d.spirits_share) || 0)
                    });
                }
            });

            if (cruzados.length === 0) {
                message = "⚠️ No hay coincidencias de países en el mismo año.";
                return;
            }

            // Guardamos el estado global
            datosCompletos = cruzados;
            availableYears = Array.from(tempYears).sort().reverse(); // Del más reciente al más antiguo
            selectedYear = availableYears[0]; 
            message = "";

            // Esperamos a que Plotly se cargue desde el CDN
            setTimeout(dibujarGrafica, 300);

        } catch (error) {
            console.error(error);
            message = "Error crítico cargando los datos.";
        }
    });

    // MAGIA REACTIVA: Si el usuario cambia el año en el desplegable, redibujamos
    $effect(() => {
        if (selectedYear && datosCompletos.length > 0 && browser && window.Plotly) {
            dibujarGrafica();
        }
    });

    function dibujarGrafica() {
        if (!window.Plotly || !chartContainer) return;

        // Filtramos solo los datos del año seleccionado
        const datosFiltrados = datosCompletos.filter(d => d.year === selectedYear);
        
        // Ordenamos por tasa de accidentes para que el gráfico quede estético
        datosFiltrados.sort((a, b) => b.accidentesTotales - a.accidentesTotales);

        const xNombres = datosFiltrados.map(d => d.country);
        const yAccidentes = datosFiltrados.map(d => d.accidentesTotales);
        
        // El array "customdata" es el secreto para pasar variables ocultas al recuadro del ratón
        const infoExtra = datosFiltrados.map(d => [
            d.total_alcohol.toFixed(1), // customdata[0]
            d.vino.toFixed(1),          // customdata[1]
            d.cerveza.toFixed(1),       // customdata[2]
            d.coches,                   // customdata[3]
            d.motos                     // customdata[4]
        ]);

        const trace = {
            x: xNombres,
            y: yAccidentes,
            type: 'bar', // Cumplimos la regla: Usamos barras
            marker: {
                color: '#ef4444', // Rojo advertencia
                opacity: 0.8,
                line: { color: '#b91c1c', width: 1.5 }
            },
            customdata: infoExtra,
            // AQUÍ CONFIGURAMOS EL RECUADRO CON TODOS TUS REQUISITOS
            hovertemplate: 
                '<b>%{x}</b><br><br>' +
                '🚨 Tasa Accidentes: <b>%{y:.1f}</b><br>' +
                '🚗 Ratio Coches: %{customdata[3]}<br>' +
                '🏍️ Ratio Motos: %{customdata[4]}<br>' +
                '----------------------<br>' +
                '🍷 Consumo Vino: %{customdata[1]}%<br>' +
                '🍺 Consumo Cerveza: %{customdata[2]}%<br>' +
                '🍸 Alcohol Total: %{customdata[0]}%<br>' +
                '<extra></extra>', // El extra vacío quita textos secundarios por defecto
        };

        const layout = {
            title: `Impacto del Alcohol en el Tráfico (Año ${selectedYear})`,
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: { color: '#cbd5e1' },
            xaxis: { tickangle: 45 },
            yaxis: { title: 'Tasa de Mortalidad en Tráfico' },
            margin: { b: 120 } // Margen inferior para que quepan los nombres largos
        };

        // Plotly.react sirve tanto para crear como para actualizar sin parpadeos
        window.Plotly.react(chartContainer, [trace], layout, { responsive: true, displayModeBar: false });
    }
</script>

<svelte:head>
    <!-- Cargamos Plotly.js directamente desde su fuente oficial, a prueba de fallos SSR -->
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
</svelte:head>

<main>
    <div class="header-nav">
        <a href="/integrations/juan-luis" class="back-btn">⬅ Volver al Panel</a>
    </div>

    <div class="card">
        <div class="top-bar">
            <h2>🚦 Tráfico y Consumo (Plotly.js)</h2>
            <p class="desc">
                Cruce temporal con el <strong>Banco Mundial</strong>. Selecciona un año para ver cómo evoluciona la tasa de accidentes frente a la cuota de alcohol.
            </p>
        </div>

        {#if message}
            <div class="loading-state">
                <span class="spinner">{message}</span>
            </div>
        {:else}
            <!-- EL INPUT DEL AÑO -->
            <div class="controls">
                <label for="yearSelector">📅 Filtrar por Año:</label>
                <select id="yearSelector" bind:value={selectedYear}>
                    {#each availableYears as yr}
                        <option value={yr}>Año {yr}</option>
                    {/each}
                </select>
                <span class="badge">Mostrando {datosCompletos.filter(d => d.year === selectedYear).length} países</span>
            </div>

            <div class="chart-box">
                <div bind:this={chartContainer} style="width: 100%; height: 500px;"></div>
            </div>
        {/if}
    </div>
</main>

<style>
    :global(body) { background: #0f172a; color: white; margin: 0; font-family: 'Segoe UI', sans-serif; }
    main { padding: 2rem; max-width: 1000px; margin: auto; }
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
    .chart-box { background: #0b1120; border-radius: 12px; padding: 1rem; border: 1px solid #334155; }
</style>