<script>
    import { onMount } from 'svelte';

    let message = $state("Cargando y cruzando métricas para ECharts...");
    let chartContainer;
    let chart; 
    let chartData = []; 

    async function safeJson(res) {
        try { return res.ok ? await res.json() : []; } catch { return []; }
    }

    onMount(async () => {
        try {
            const echarts = await import('echarts');

            const [resMis, resBrew] = await Promise.all([
                fetch("/api/v2/social-drinking-behaviors"),
                fetch("https://api.openbrewerydb.org/v1/breweries?per_page=200")
            ]);

            const misDatos = await safeJson(resMis);
            const brewDatos = await safeJson(resBrew);

            if (misDatos.length === 0 || brewDatos.length === 0) {
                message = "⚠️ Faltan datos para cruzar.";
                return;
            }

            const fabricasMap = new Map();
            brewDatos.forEach(b => {
                if (b.country) {
                    let nombre = String(b.country).trim().toLowerCase();
                    if (nombre === "united states") nombre = "united states of america";
                    if (nombre === "england" || nombre === "scotland") nombre = "united kingdom";
                    
                    if (!fabricasMap.has(nombre)) fabricasMap.set(nombre, { total: 0, micro: 0 });
                    
                    let datosPais = fabricasMap.get(nombre);
                    datosPais.total++; 
                    if (b.brewery_type === 'micro') datosPais.micro++; 
                }
            });

            let paisesProcesados = new Set();
            misDatos.forEach(d => {
                let pais = String(d.country).trim().toLowerCase();
                
                if (fabricasMap.has(pais) && !paisesProcesados.has(pais)) {
                    paisesProcesados.add(pais);
                    let fb = fabricasMap.get(pais);
                    
                    chartData.push({
                        name: d.country,
                        rawInfo: {
                            cerveza: Number(d.beer_share) || 0,
                            vino: Number(d.wine_share) || 0,
                            total: fb.total,
                            micro: fb.micro
                        }
                    });
                }
            });

            if (chartData.length === 0) {
                message = "⚠️ No hay coincidencias.";
                return;
            }

            // Ordenamos para que la gráfica tenga sentido visual
            chartData.sort((a, b) => b.rawInfo.cerveza - a.rawInfo.cerveza);

            message = ""; 
            chart = echarts.init(chartContainer);

            window.addEventListener('resize', () => chart.resize());

            // ¡IMPORTANTE! Forzamos un resize justo al empezar para que ocupe todo el ancho
            setTimeout(() => chart.resize(), 100);

            verConsumo();

        } catch (error) {
            console.error(error);
            message = "Error crítico al cargar ECharts.";
        }
    });

    function tooltipHTML(params) {
        let info = params.data.rawInfo;
        return `
            <div style="padding: 5px; font-family: sans-serif;">
                <strong style="color: #38bdf8; font-size: 16px;">${params.name}</strong>
                <hr style="border-color: #475569; margin: 8px 0;">
                🍺 Cerveza: <b style="color: #facc15">${info.cerveza}%</b><br/>
                🍷 Vino: <b>${info.vino}%</b><br/>
                🏭 Fábricas (Total): <b>${info.total}</b><br/>
                🔬 Micro-fábricas: <b>${info.micro}</b>
            </div>
        `;
    }

    function verConsumo() {
        if (!chart) return;
        chart.setOption({
            backgroundColor: 'transparent',
            // Dejamos 25% abajo para que quepa el scroll y los nombres largos
            grid: { top: '10%', bottom: '25%', left: '5%', right: '5%', containLabel: true },
            tooltip: { formatter: tooltipHTML, backgroundColor: '#1e293b', textStyle: { color: '#fff' }, borderColor: '#38bdf8' },
            
            // --- LA BARRA DE SCROLL MÁGICA ---
            dataZoom: [
                {
                    type: 'slider',
                    show: true,
                    xAxisIndex: [0],
                    start: 0, // Empieza en el 0%
                    end: 40,  // Muestra solo el 40% inicial para que respiren las barras
                    bottom: 10,
                    textStyle: { color: '#cbd5e1' }
                }
            ],
            
            xAxis: { 
                type: 'category', 
                data: chartData.map(d => d.name),
                axisLabel: { 
                    color: '#cbd5e1', 
                    rotate: 45, 
                    interval: 0,         // Le prohibimos saltarse etiquetas
                    hideOverlap: false,  // Le prohibimos ocultar las que chocan
                    fontSize: 11
                },
                axisTick: { alignWithLabel: true }
            },
            yAxis: { 
                type: 'value', name: 'Cerveza (%)',
                nameTextStyle: { color: '#cbd5e1', padding: [0, 0, 0, 20] }, 
                axisLabel: { color: '#cbd5e1' }, 
                splitLine: { lineStyle: { color: '#334155', type: 'dashed' } }
            },
            series: [{
                type: 'bar',
                barMaxWidth: 50, // Barras más anchas pero controladas
                data: chartData.map(d => ({
                    name: d.name, value: d.rawInfo.cerveza, rawInfo: d.rawInfo, itemStyle: { color: '#facc15', borderRadius: [6, 6, 0, 0] }
                })),
                universalTransition: { enabled: true, divideShape: 'clone' },
                animationDurationUpdate: 1000
            }]
        }, true);
    }

    function verComparacion() {
        if (!chart) return;
        chart.setOption({
            backgroundColor: 'transparent',
            grid: { top: '10%', bottom: '15%', left: '5%', right: '5%', containLabel: true },
            tooltip: { formatter: tooltipHTML, backgroundColor: '#1e293b', textStyle: { color: '#fff' }, borderColor: '#38bdf8' },
            
            // Quitamos el scroll en modo dispersión porque ahí sí queremos ver el panorama completo
            dataZoom: [], 

            xAxis: { 
                type: 'value', name: 'Cerveza (%)',
                nameLocation: 'middle', nameGap: 30,
                nameTextStyle: { color: '#cbd5e1' }, 
                axisLabel: { color: '#cbd5e1' }, 
                splitLine: { lineStyle: { color: '#334155', type: 'dashed' } }
            },
            yAxis: { 
                type: 'value', name: 'Nº Fábricas Totales',
                nameTextStyle: { color: '#cbd5e1', padding: [0, 0, 0, 40] }, 
                axisLabel: { color: '#cbd5e1' }, 
                splitLine: { lineStyle: { color: '#334155', type: 'dashed' } }
            },
            series: [{
                type: 'scatter',
                data: chartData.map(d => ({
                    name: d.name, 
                    value: [d.rawInfo.cerveza, d.rawInfo.total], 
                    rawInfo: d.rawInfo, 
                    itemStyle: { color: '#00f2fe', shadowBlur: 10, shadowColor: 'rgba(0, 242, 254, 0.5)' }
                })),
                symbolSize: function (val) { return Math.max(12, val[0] / 2); }, 
                universalTransition: { enabled: true, divideShape: 'clone' },
                animationDurationUpdate: 1000
            }]
        }, true);
    }
</script>

<main>
    <div class="header-nav">
        <a href="/integrations/juan-luis" class="back-btn">⬅ Volver a Integraciones Juan Luis</a>
    </div>

    <div class="card">
        <div class="top-bar">
            <h2>📊 Animaciones Fluidas con ECharts</h2>
            <p class="desc">Usa el scroll debajo de la gráfica para navegar por todos los países.</p>
            
            <div class="button-group" class:hidden={!!message}>
                <button onclick={verConsumo}>🍺 1. Ver Consumo (Barras)</button>
                <button onclick={verComparacion}>🌍 2. Comparativa (Puntos)</button>
            </div>
        </div>

        {#if message}
            <p class="status-msg">{message}</p>
        {/if}

        <!-- Hacemos el contenedor más alto (600px) y quitamos el overflow:hidden -->
        <div class="chart-box" class:hidden={!!message}>
            <div bind:this={chartContainer} style="width: 100%; height: 600px;"></div>
        </div>
    </div>
</main>

<style>
    :global(body) { background: #0f172a; color: white; margin: 0; font-family: 'Segoe UI', sans-serif; }
    main { padding: 2rem; max-width: 1000px; margin: auto; }
    .header-nav { margin-bottom: 2rem; }
    
    .back-btn { color: #38bdf8; text-decoration: none; font-weight: bold; border: 1px solid #38bdf8; padding: 0.5rem 1rem; border-radius: 8px; transition: 0.3s; }
    .back-btn:hover { background: rgba(56, 189, 248, 0.2); }
    
    .card { background: #1e293b; padding: 2rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); border: 1px solid #334155;}
    
    .top-bar h2 { margin: 0 0 0.5rem 0; color: #38bdf8; }
    .desc { color: #94a3b8; margin-top: 0; margin-bottom: 1.5rem; }
    
    .button-group { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    button {
        background: #0f172a; color: #e2e8f0; border: 1px solid #475569;
        padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;
        font-weight: bold; transition: 0.2s;
    }
    button:hover { background: #38bdf8; color: #0f172a; border-color: #38bdf8; }

    .status-msg { color: #facc15; font-size: 1.2rem; text-align: center; border: 2px dashed #facc15; padding: 1rem; border-radius: 8px; }
    
    .chart-box { 
        background: #0b1120; 
        border-radius: 12px; 
        padding: 1rem;
        border: 1px solid #334155;
    }
    .hidden { display: none !important; }
</style>
