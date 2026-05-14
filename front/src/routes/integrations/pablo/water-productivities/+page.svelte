<script>
    import { onMount } from 'svelte';

    // SVELTE 5 RUNES
    let message = $state("Cargando e integrando bases de datos...");
    let chartElement;
    let chartInstance = $state(null);
    
    let allCrossedData = $state([]); 
    let availableYears = $state([]); 
    let selectedYear = $state("Todos"); 

    $effect(() => {
        if (chartInstance && allCrossedData.length > 0) {
            actualizarGrafica(selectedYear);
        }
    });

    onMount(async () => {
        try {
            const ApexCharts = (await import('apexcharts')).default;

            // 1. Llamamos a TU API y al Proxy del G17
            const resMis = await fetch('/api/v2/average-annual-temperatures');
            console.log("Debug: Entrando en la api de Pablo...");
            const resG17 = await fetch('/api/proxy/g17/water-productivities');

            if (!resMis.ok) throw new Error("Fallo en API propia (Temperaturas).");
            if (!resG17.ok) throw new Error("Fallo en la API del compañero (Productividad Agua).");

            const misDatos = await resMis.json();
            const g17Datos = await resG17.json();

            let tempCrossed = [];
            let yearsSet = new Set(); 

            // 2. Cruzamos los datos
            misDatos.forEach(mi => {
                // Buscamos el mismo país y año en los datos del G17
                let aguaDelPais = g17Datos.filter(g => 
                    String(mi.country).trim().toLowerCase() === String(g.country).trim().toLowerCase() &&
                    String(mi.year) === String(g.year)
                );

                if (aguaDelPais.length > 0) {
                    // Tomamos el primer registro coincidente
                    let datosAgua = aguaDelPais[0]; 
                    
                    // Buscamos la propiedad numérica de su API (ej. water_productivity)
                    // Si no sabes el nombre exacto del campo de su API, esto pilla el primer número que no sea el año
                    let valorAgua = datosAgua.water_productivity || datosAgua.productivity || Object.values(datosAgua).find(v => typeof v === 'number' && v !== datosAgua.year) || 0;

                    tempCrossed.push({
                        country: mi.country,
                        year: String(mi.year),
                        
                        // MIS CAMPOS (Pablo)
                        x: Number(mi.temperature) || 0,        // Eje X: Temperatura
                        miCo2: Number(mi.co2_emission) || 0,   
                        miLluvia: Number(mi.precipitation) || 0,  
                        
                        // SUS CAMPOS (G17)
                        y: Number(valorAgua),                  // Eje Y: Productividad del agua
                    });
                    
                    yearsSet.add(String(mi.year));
                }
            });

            if (tempCrossed.length === 0) {
                message = "⚠️ No hay coincidencias exactas de País y Año entre ambas APIs. Revisa que tengan países en común.";
                return;
            }

            allCrossedData = tempCrossed;
            availableYears = Array.from(yearsSet).sort(); 
            message = ""; 

            // 3. Configuración del Gráfico ApexCharts
            const options = {
                series: [], 
                chart: {
                    type: 'scatter',
                    height: 500,
                    background: 'transparent',
                    animations: { enabled: true, easing: 'easeinout', speed: 800 },
                    toolbar: { show: true }
                },
                title: { text: 'Relación: Temperatura Media vs Productividad del Agua', style: { color: '#fff' } },
                xaxis: { 
                    title: { text: 'Temperatura Media (ºC)', style: { color: '#00f2fe' } },
                    labels: { style: { colors: '#9ca3af' }, formatter: (val) => val.toFixed(1) + ' ºC' },
                    tickAmount: 8
                },
                yaxis: { 
                    title: { text: 'Productividad del Agua', style: { color: '#10b981' } },
                    labels: { style: { colors: '#9ca3af' } }
                },
                theme: { mode: 'dark' },
                markers: { size: 9, hover: { size: 14 } },
                colors: ['#00f2fe'],
                
                // TOOLTIP PROFESIONAL A DOS COLUMNAS
                tooltip: {
                    custom: function({ series, seriesIndex, dataPointIndex, w }) {
                        let data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
                        return `
                            <div style="padding: 15px; background: #1f2937; border: 1px solid #00f2fe; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                                <strong style="color: #00f2fe; font-size: 1.2rem;">🌍 ${data.country} (${data.year})</strong>
                                <hr style="border-color: #374151; margin: 10px 0;" />
                                
                                <div style="display: flex; gap: 20px;">
                                    <div style="color: #e2e8f0; font-size: 0.95rem;">
                                        <strong style="color: #00f2fe;">🌡️ Mis Datos (Clima)</strong><br/>
                                        🔥 <b>Temp. Media:</b> ${data.x} ºC<br/>
                                        ☁️ <b>Emisiones CO2:</b> ${data.miCo2}<br/>
                                        🌧️ <b>Precipitación:</b> ${data.miLluvia}
                                    </div>
                                    
                                    <div style="border-left: 1px solid #374151; padding-left: 15px; color: #e2e8f0; font-size: 0.95rem;">
                                        <strong style="color: #10b981;">💧 Datos G17 (Agua)</strong><br/>
                                        📈 <b>Productividad:</b> ${data.y}
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                }
            };

            chartInstance = new ApexCharts(chartElement, options);
            chartInstance.render();

            actualizarGrafica("Todos");

        } catch (e) {
            console.error("Error capturado:", e);
            message = e.message;
        }
    });

    function actualizarGrafica(filtroAno) {
        let datosFiltrados = allCrossedData;
        if (filtroAno !== "Todos") {
            datosFiltrados = allCrossedData.filter(d => d.year === filtroAno);
        }
        chartInstance.updateSeries([{ name: 'Países', data: datosFiltrados }]);
    }
</script>

<main>
    <div class="header-nav">
        <a href="/integrations" class="back-btn">⬅ Volver a Integraciones de Pablo</a>
    </div>

    <div class="card">
        <div class="top-bar">
            <h2>🌍 Clima vs Productividad Hídrica (G17)</h2>
            
            {#if availableYears.length > 0}
                <div class="filtro">
                    <label for="year-select">Filtrar por Año: </label>
                    <select id="year-select" bind:value={selectedYear}>
                        <option value="Todos">Mostrar Todos ({allCrossedData.length} cruces)</option>
                        {#each availableYears as ano}
                            <option value={ano}>{ano}</option>
                        {/each}
                    </select>
                </div>
            {/if}
        </div>

        {#if message}
            <p class="status-msg">{message}</p>
        {/if}

        <div class="chart-box" class:hidden={!!message}>
            <div bind:this={chartElement}></div>
        </div>
    </div>
</main>

<style>
    :global(body) { background: #0f172a; color: white; margin: 0; font-family: 'Segoe UI', sans-serif; }
    main { padding: 2rem; max-width: 1100px; margin: auto; }
    
    .header-nav { margin-bottom: 2rem; }
    .back-btn { color: #00f2fe; text-decoration: none; font-weight: bold; border: 1px solid #00f2fe; padding: 0.5rem 1rem; border-radius: 8px; transition: 0.3s; }
    .back-btn:hover { background: rgba(0, 242, 254, 0.2); }
    
    .card { background: #1e293b; padding: 2rem; border-radius: 20px; border: 1px solid #334155; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
    
    .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
    h2 { margin: 0; color: #10b981; }
    
    .filtro label { font-weight: bold; margin-right: 0.5rem; color: #9ca3af; }
    select { 
        background: #0f172a; color: #00f2fe; border: 1px solid #00f2fe; 
        padding: 0.5rem 1rem; border-radius: 8px; font-size: 1rem; cursor: pointer; outline: none;
    }
    select:focus { box-shadow: 0 0 10px rgba(0, 242, 254, 0.5); }
    
    .status-msg { color: #facc15; font-size: 1.2rem; text-align: center; border: 2px dashed #facc15; padding: 1rem; border-radius: 8px; }
    
    .chart-box { background: #0f172a; border-radius: 10px; padding: 1rem; }
    .hidden { display: none; }
</style>