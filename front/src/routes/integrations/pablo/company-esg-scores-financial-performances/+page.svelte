<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let chartContainer;
    let message = $state("Cruzando datos de Clima (Pablo) y Sostenibilidad ESG (G28)...");

    onMount(async () => {
        if (!browser) return;

        // Cargamos Google Charts inyectando su script oficial
        const script = document.createElement('script');
        script.src = "https://www.gstatic.com/charts/loader.js";
        script.onload = () => {
            window.google.charts.load('current', {'packages':['corechart']});
            window.google.charts.setOnLoadCallback(loadAndDraw);
        };
        document.head.appendChild(script);
    });

    async function loadAndDraw() {
        try {
            // 1. Fetch a la API de Temperaturas (Pablo)
            const resTemp = await fetch('/api/v2/average-annual-temperatures');
            
            // 2. Fetch a la API del G28 (ESG Scores)
            const resEsg = await fetch('https://sos2526-28.onrender.com/api/v1/company-esg-scores-financial-performances');

            if (!resTemp.ok || !resEsg.ok) throw new Error("Error al conectar con las APIs");

            const dataTemp = await resTemp.json();
            const dataEsg = await resEsg.json();

            // 3. Cruzar datos: Como ellos usan "regiones" y tú "países", cruzaremos por AÑO
            // Obtenemos todos los años únicos que existen en ambas bases de datos
            const allYears = [...new Set([...dataTemp.map(d => d.year), ...dataEsg.map(d => d.year)])].sort();
            
            // Cabeceras requeridas por Google Charts
            let plotData = [['Año', 'Temp. Media (Pablo)', 'ESG Overall (G28)']];
            let matches = 0;

            allYears.forEach(y => {
                const tempsDelAno = dataTemp.filter(d => d.year === y);
                const esgsDelAno = dataEsg.filter(d => d.year === y);

                // Si hay datos en las dos APIs para ese año, calculamos las medias y las cruzamos
                if (tempsDelAno.length > 0 && esgsDelAno.length > 0) {
                    const avgTemp = tempsDelAno.reduce((acc, curr) => acc + curr.temperature, 0) / tempsDelAno.length;
                    const avgEsg = esgsDelAno.reduce((acc, curr) => acc + (curr.esg_overall || 0), 0) / esgsDelAno.length;
                    
                    plotData.push([y.toString(), avgTemp, avgEsg]);
                    matches++;
                }
            });

            if (matches === 0) {
                message = "⚠️ No hay años en común entre ambas bases de datos.";
                return;
            }

            message = ""; // Éxito, quitamos el mensaje de carga

            // 4. Dibujar la gráfica con Google Charts
            const dataTable = window.google.visualization.arrayToDataTable(plotData);

            const options = {
                title: 'Evolución Anual: Temperatura vs Puntuación Sostenible (ESG)',
                titleTextStyle: { color: '#ffffff', fontSize: 16 },
                backgroundColor: 'transparent',
                hAxis: { 
                    title: 'Año', 
                    textStyle: { color: '#94a3b8' }, 
                    titleTextStyle: { color: '#94a3b8', italic: false } 
                },
                vAxis: { 
                    textStyle: { color: '#94a3b8' },
                    gridlines: { color: '#334155' }
                },
                legend: { position: 'bottom', textStyle: { color: '#ffffff' } },
                colors: ['#00f2fe', '#10b981'],
                isStacked: false,
                areaOpacity: 0.6
            };

            // Tipo SteppedAreaChart (Área escalonada)
            const chart = new window.google.visualization.SteppedAreaChart(chartContainer);
            chart.draw(dataTable, options);

        } catch (err) {
            console.error(err);
            message = "❌ Error en la integración de datos: " + err.message;
        }
    }
</script>

<main>
    <a href="/integrations" class="back-btn">⬅ Volver al Panel</a>
    <h2>🌍 Clima vs Sostenibilidad Empresarial (Pablo)</h2>
    <p class="subtitle">Integración con G28 usando <b>Google Charts</b> (Stepped Area Chart).</p>
    
    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="card" class:hidden={!!message}>
        <div bind:this={chartContainer} style="width: 100%; height: 500px;"></div>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0; }
    main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h2 { color: #10b981; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 2rem; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 1rem; }
    .back-btn:hover { color: #10b981; }
    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    .alert { background: rgba(16, 185, 129, 0.2); border-left: 4px solid #10b981; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; text-align: center; }
    .hidden { display: none; }
</style>