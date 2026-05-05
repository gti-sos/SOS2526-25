<script>
    import { onMount } from 'svelte';
    
    let message = $state("Cruzando datos con REST Countries (Frontend directo)...");
    let chartDiv;

    // Función salvavidas
    async function safeJson(res) {
        try {
            return res.ok ? await res.json() : [];
        } catch {
            return [];
        }
    }

    onMount(async () => {
        try {
            // Importación dinámica para evitar el error de SSR al recargar la página
            const Plotly = (await import('plotly.js-dist-min')).default;

            const resMis = await fetch("/api/v2/social-drinking-behaviors");
            const resPaises = await fetch('https://restcountries.com/v3.1/all?fields=name,population');

            const misDatos = await safeJson(resMis);
            const paisesDatos = await safeJson(resPaises);

            if (misDatos.length === 0 || paisesDatos.length === 0) {
                message = "⚠️ Faltan datos para cruzar. Revisa tu API.";
                return;
            }

            // 1. Creamos un diccionario rápido con los datos de REST Countries
            const poblacionMap = new Map();
            paisesDatos.forEach(p => {
                if (p.name && p.name.common) {
                    let nombre = String(p.name.common).trim().toLowerCase();
                    if (nombre === "united states") nombre = "united states of america";
                    poblacionMap.set(nombre, p.population || 0);
                }
            });

            // 2. Preparamos los arrays para Plotly
            let etiquetas = [];
            let litrosData = [];
            let poblacionData = [];
            let tamanosBurbuja = []; 
            let datosTooltip = []; 

            let paisesProcesados = new Set();

            misDatos.forEach(d => {
                let pais = String(d.country).trim().toLowerCase();
                
                if (poblacionMap.has(pais) && !paisesProcesados.has(pais)) {
                    paisesProcesados.add(pais);
                    
                    let pop = poblacionMap.get(pais);
                    
                    etiquetas.push(d.country);
                    litrosData.push(d.total_liter);
                    poblacionData.push(pop);
                    
                    tamanosBurbuja.push(Math.max(10, Math.sqrt(pop) / 300)); 
                    
                    // Datos para el panel blanco
                    datosTooltip.push({
                        nombre: d.country,
                        litros: d.total_liter,
                        pobFormateada: pop.toLocaleString('es-ES') 
                    });
                }
            });

            if (etiquetas.length === 0) {
                message = "⚠️ No hay coincidencias exactas en los nombres de países.";
                return;
            }

            message = ""; 

            // 3. Configuramos PLOTLY (Gráfico de Burbujas)
            const traza = {
                x: litrosData,
                y: poblacionData,
                customdata: datosTooltip,
                
                hovertemplate: 
                    "<b>🌍 %{customdata.nombre}</b><br><br>" +
                    "💧 <b>Consumo:</b> %{customdata.litros} L<br>" +
                    "👥 <b>Población:</b> %{customdata.pobFormateada}<br>" +
                    "<extra></extra>",
                
                mode: 'markers',
                marker: {
                    size: tamanosBurbuja,
                    color: litrosData,
                    colorscale: 'Viridis', 
                    showscale: true,
                    opacity: 0.8,
                    line: { width: 1, color: '#ffffff' }
                },
                
                // Panel Blanco Elegante
                hoverlabel: {
                    bgcolor: '#ffffff',         
                    bordercolor: '#00f2fe',     
                    font: { color: '#0f172a', family: 'Segoe UI', size: 14 },
                    padding: { t: 15, b: 15, l: 15, r: 15 } 
                }
            };

            const layout = {
                title: { text: 'Consumo de Alcohol vs Población (Plotly Bubble)', font: { color: '#ffffff' } },
                xaxis: { title: { text: 'Litros Consumidos', font: { color: '#00f2fe' } }, tickfont: { color: '#94a3b8' }, gridcolor: '#334155' },
                yaxis: { title: { text: 'Población Total', font: { color: '#a855f7' } }, type: 'log', tickfont: { color: '#94a3b8' }, gridcolor: '#334155' },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                hovermode: 'closest'
            };

            Plotly.newPlot(chartDiv, [traza], layout, { responsive: true });

        } catch (error) {
            console.error(error);
            message = "Error al montar la gráfica de Plotly.";
        }
    });
</script>

<main>
    <div class="header-nav">
        <a href="/integrations/juan-luis" class="back-btn">⬅ Volver al Panel</a>
    </div>

    <div class="card">
        {#if message}
            <p class="status-msg">{message}</p>
        {/if}

        <div class="chart-box" class:hidden={!!message}>
            <div bind:this={chartDiv} style="width:100%; height:600px;"></div>
        </div>
    </div>
</main>

<style>
    :global(body) { background: #0f172a; color: white; margin: 0; font-family: 'Segoe UI', sans-serif; }
    main { padding: 2rem; max-width: 1000px; margin: auto; }
    .header-nav { margin-bottom: 2rem; }
    .back-btn { color: #00f2fe; text-decoration: none; font-weight: bold; border: 1px solid #00f2fe; padding: 0.5rem 1rem; border-radius: 8px; transition: 0.3s; }
    .back-btn:hover { background: rgba(0, 242, 254, 0.2); }
    .card { background: #1e293b; padding: 2rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
    .status-msg { color: #facc15; font-size: 1.2rem; text-align: center; border: 2px dashed #facc15; padding: 1rem; border-radius: 8px; }
    .hidden { display: none; }
</style>