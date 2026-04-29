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

            const resMis = await fetch('/api/v2/social-drinking-behaviors');
            const resG10 = await fetch('https://sos2526-10.onrender.com/api/v2/protests');

            if (!resMis.ok) throw new Error("Fallo en API propia.");
            if (!resG10.ok) throw new Error("Fallo en la API del compañero grupo G10.");

            const misDatos = await resMis.json();
            const g10Datos = await resG10.json();

            let tempCrossed = [];
            let yearsSet = new Set(); 

            misDatos.forEach(mi => {
                // Filtramos TODAS las protestas de ese país y año
                let protestasDelPais = g10Datos.filter(g => 
                    String(mi.country).trim().toLowerCase() === String(g.country).trim().toLowerCase() &&
                    String(mi.year) === String(g.year)
                );

                let totalProtestas = protestasDelPais.length;

                if (totalProtestas > 0) {
                    let violentas = protestasDelPais.reduce((acc, curr) => acc + (Number(curr.protesterviolence) || 0), 0);
                    let sumaParticipacion = protestasDelPais.reduce((acc, curr) => {
                        let val = Number(curr.participatory_score);
                        return acc + (isNaN(val) ? 0 : val);
                    }, 0);
                    let participacionMedia = (sumaParticipacion / totalProtestas).toFixed(2);

                    tempCrossed.push({
                        country: mi.country,
                        year: String(mi.year),
                        
                        // MIS 3 CAMPOS (Alcohol)
                        x: Number(mi.total_liter) || 0,        
                        miCerveza: Number(mi.beer_share) || 0, 
                        miVino: Number(mi.wine_share) || 0,  
                        
                        // SUS 3 CAMPOS (G10)
                        y: totalProtestas,                    
                        suViolencia: violentas,               
                        suParticipacion: participacionMedia     
                    });
                    
                    yearsSet.add(String(mi.year));
                }
            });

            if (tempCrossed.length === 0) {
                message = "⚠️ No hay coincidencias. Asegúrate de tener datos en tu API.";
                return;
            }

            allCrossedData = tempCrossed;
            availableYears = Array.from(yearsSet).sort(); 
            message = ""; 

            const options = {
                series: [], 
                chart: {
                    type: 'scatter',
                    height: 500,
                    background: 'transparent',
                    animations: { enabled: true, easing: 'easeinout', speed: 800 },
                    toolbar: { show: true }
                },
                title: { text: 'Relación: Consumo de Alcohol vs Volumen de Protestas', style: { color: '#fff' } },
                xaxis: { 
                    title: { text: 'Litros de Alcohol Consumidos (Total)', style: { color: '#00f2fe' } },
                    labels: { style: { colors: '#9ca3af' } },
                    tickAmount: 10
                },
                yaxis: { 
                    title: { text: 'Total de Protestas', style: { color: '#a855f7' } },
                    labels: { style: { colors: '#9ca3af' } }
                },
                theme: { mode: 'dark' },
                markers: { size: 9, hover: { size: 14 } },
                
                // TOOLTIP PROFESIONAL A DOS COLUMNAS
                tooltip: {
                    custom: function({ series, seriesIndex, dataPointIndex, w }) {
                        let data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
                        return `
                            <div style="padding: 15px; background: #1f2937; border: 1px solid #a855f7; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                                <strong style="color: #00f2fe; font-size: 1.2rem;">🌍 ${data.country} (${data.year})</strong>
                                <hr style="border-color: #374151; margin: 10px 0;" />
                                
                                <div style="display: flex; gap: 20px;">
                                    <div style="color: #e2e8f0; font-size: 0.95rem;">
                                        <strong style="color: #00f2fe;">📊 Mis Datos (Alcohol)</strong><br/>
                                        💧 <b>Total:</b> ${data.x} L<br/>
                                        🍺 <b>Cerveza:</b> ${data.miCerveza} L<br/>
                                        🍷 <b>Vino:</b> ${data.miVino} L
                                    </div>
                                    
                                    <div style="border-left: 1px solid #374151; padding-left: 15px; color: #e2e8f0; font-size: 0.95rem;">
                                        <strong style="color: #facc15;">📢 Datos G10 (Protestas)</strong><br/>
                                        🔥 <b>Eventos:</b> ${data.y}<br/>
                                        ⚔️ <b>Violentas:</b> ${data.suViolencia}<br/>
                                        📈 <b>Participación:</b> ${data.suParticipacion}
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
        <a href="/integrations" class="back-btn">⬅ Volver al Panel</a>
    </div>

    <div class="card">
        <div class="top-bar">
            <h2>🌍 Análisis Cruzado de 6 Variables (G10)</h2>
            
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
    h2 { margin: 0; color: #a855f7; }
    
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