<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Cruzando datos de alcohol y meteoritos...");
    let chartContainer;
    let chartInstance;
    
    // Necesitamos guardar la referencia a Highcharts a nivel global del componente
    let Highcharts; 
    
    let datosCompletos = $state([]); 
    let availableYears = $state([]);
    let selectedYear = $state("");

    async function safeJson(res) {
        try { return res.ok ? await res.json() : []; } catch { return []; }
    }

    onMount(async () => {
        if (!browser) return;
        
        try {
            // 🚀 FIX ERROR 500 (SSR) 🚀
            // Descargamos Highcharts SOLO cuando ya estamos en el navegador
            const HighchartsModule = await import('highcharts');
            const VariwideModule = await import('highcharts/modules/variwide');
            
            Highcharts = HighchartsModule.default;
            const variwideInit = VariwideModule.default || VariwideModule;

            // Inicializamos el módulo de forma segura
            if (!Highcharts.seriesTypes.variwide) {
                variwideInit(Highcharts);
            }

            // A partir de aquí, las peticiones a tus APIs como siempre
            const resMis = await fetch('/api/v2/social-drinking-behaviors'); 
            const resG14 = await fetch('/api/proxy/g14/meteorites');

            if (!resMis.ok || !resG14.ok) {
                message = "⚠️ Error al descargar los datos de las APIs.";
                return;
            }

            const misDatos = await safeJson(resMis);
            const g14Datos = await safeJson(resG14);

            const alcoholMap = new Map();
            misDatos.forEach(d => {
                let pais = String(d.country).trim().toLowerCase();
                if (pais === "usa") pais = "united states of america";
                alcoholMap.set(`${pais}-${d.year}`, d.total_liter);
            });

            const metCount = {};
            g14Datos.forEach(m => {
                if(!m.country || !m.year) return;
                let pais = String(m.country).trim().toLowerCase();
                let ano = String(m.year).trim();
                let key = `${pais}-${ano}`;
                
                if (alcoholMap.has(key)) {
                    metCount[key] = (metCount[key] || 0) + 1;
                }
            });

            let tempYears = new Set();
            let cruzados = [];

            for (let [key, litros] of alcoholMap) {
                if (metCount[key]) {
                    const [paisNom, ano] = key.split('-');
                    tempYears.add(ano);
                    cruzados.push({
                        country: paisNom.toUpperCase(),
                        year: ano,
                        alcohol: litros,
                        meteoritos: metCount[key]
                    });
                }
            }

            if (cruzados.length === 0) {
                message = "⚠️ No hay coincidencias exactas de país y año.";
                return;
            }

            datosCompletos = cruzados;
            availableYears = Array.from(tempYears).sort().reverse(); 
            selectedYear = availableYears[0]; 
            message = "";

        } catch (e) {
            console.error(e);
            message = "Error crítico cargando la integración.";
        }
    });

    $effect(() => {
        // Añadimos Highcharts a la comprobación para asegurarnos de que se ha descargado
        if (selectedYear && datosCompletos.length > 0 && browser && chartContainer && Highcharts) {
            dibujarGrafica();
        }
    });

    function dibujarGrafica() {
        let datosFiltrados = datosCompletos.filter(d => d.year === selectedYear);

        const chartData = datosFiltrados.map(d => ({
            name: d.country,
            y: d.alcohol,
            z: d.meteoritos
        }));

        const options = {
            chart: { 
                type: 'variwide', 
                backgroundColor: '#1e293b', 
                borderRadius: 10 
            },
            title: { 
                text: `Alcohol vs Meteoritos Históricos (${selectedYear})`, 
                style: { color: '#ffffff', fontWeight: 'bold' } 
            },
            subtitle: {
                text: 'La <b>Altura</b> indica litros de alcohol. El <b>Grosor</b> indica impactos de meteoritos.',
                style: { color: '#94a3b8' }
            },
            xAxis: { 
                type: 'category',
                labels: { style: { color: '#cbd5e1' } }
            },
            yAxis: {
                title: { text: 'Consumo de Alcohol (Litros)', style: { color: '#38bdf8' } },
                labels: { style: { color: '#cbd5e1' } },
                gridLineColor: '#334155'
            },
            tooltip: {
                pointFormat: '<b>{point.name}</b><br/>' +
                             'Consumo (Altura): <b>{point.y} Litros</b><br/>' +
                             'Meteoritos (Grosor): <b>{point.z} impactos</b>'
            },
            legend: { enabled: false },
            series: [{
                name: 'Consumo vs Meteoritos',
                data: chartData,
                color: 'rgba(56, 189, 248, 0.7)',
                borderColor: '#38bdf8',
                borderWidth: 2,
                colorByPoint: true,
                colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#06b6d4']
            }],
            credits: { enabled: false }
        };

        if (chartInstance) {
            chartInstance.update(options, true, true);
        } else {
            chartInstance = Highcharts.chart(chartContainer, options);
        }
    }
</script>

<main>
    <div class="header-nav">
        <a href="/integrations/juan-luis" class="back-btn">⬅ Volver a Integraciones Juan Luis</a>
    </div>

    <div class="card">
        <div class="top-bar">
            <h2>🌌 Impactos Extraterrestres y Alcohol</h2>
            <p class="desc">Gráfico Variwide: Cruza dos variables en una sola barra. Selecciona el año para ver las métricas.</p>
        </div>

        {#if message}
            <div class="loading-state">{message}</div>
        {:else}
            <div class="controls">
                <label>📅 Año de impacto:</label>
                <!-- Selector de año que dispara la reactividad automáticamente -->
                <select bind:value={selectedYear}>
                    {#each availableYears as yr} 
                        <option value={yr}>{yr}</option> 
                    {/each}
                </select>
            </div>
            
            <div class="chart-box">
                <div bind:this={chartContainer} style="width:100%; height:500px;"></div>
            </div>
        {/if}
    </div>
</main>

<style>
    :global(body) { background: #0f172a; color: white; margin: 0; font-family: 'Segoe UI', sans-serif; }
    main { padding: 2rem; max-width: 1000px; margin: auto; }
    .header-nav { margin-bottom: 2rem; }
    .back-btn { color: #38bdf8; text-decoration: none; font-weight: bold; border: 1px solid #38bdf8; padding: 0.5rem 1rem; border-radius: 8px; transition: 0.3s; }
    .back-btn:hover { background: rgba(56, 189, 248, 0.2); }
    .card { background: #1e293b; padding: 2rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); border: 1px solid #334155; }
    .top-bar h2 { margin: 0 0 0.5rem 0; color: #38bdf8; }
    .desc { color: #94a3b8; margin-bottom: 1.5rem; }
    .controls { background: #0b1120; padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; font-weight: bold; color: #cbd5e1; }
    select { background: #1e293b; color: #38bdf8; padding: 0.5rem; border-radius: 5px; font-weight: bold; border: 1px solid #38bdf8; cursor: pointer; }
    .loading-state { color: #facc15; font-size: 1.2rem; text-align: center; border: 2px dashed #facc15; padding: 2rem; border-radius: 8px; font-weight: bold;}
</style>