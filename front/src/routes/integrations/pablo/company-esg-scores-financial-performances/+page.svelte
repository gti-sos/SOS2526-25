<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let chartContainer;
    let message = $state("Cruzando datos de Clima (Pablo) y Sostenibilidad ESG (G28)...");
    
    // Guardamos las instancias para poder redibujar si se cambia el tamaño de la ventana
    let chart;
    let dataTable;
    let options;

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

        // Hacemos que la gráfica sea responsiva
        window.addEventListener('resize', () => {
            if (chart && dataTable && options) {
                chart.draw(dataTable, options);
            }
        });
    });

    async function loadAndDraw() {
        try {
            // 1. Fetch a la API de Temperaturas (Pablo)
            const resTemp = await fetch('/api/v2/average-annual-temperatures');
            const dataTemp = await resTemp.json();
            
            // 2. Fetch a la API del G28 (ESG Scores)
            let resEsg = await fetch('https://sos2526-28.onrender.com/api/v1/company-esg-scores-financial-performances');
            let dataEsg = await resEsg.json();

            // Si la API del compañero está vacía, les cargamos nosotros sus datos iniciales
            if (dataEsg.length === 0) {
                await fetch('https://sos2526-28.onrender.com/api/v1/company-esg-scores-financial-performances/loadInitialData');
                resEsg = await fetch('https://sos2526-28.onrender.com/api/v1/company-esg-scores-financial-performances');
                dataEsg = await resEsg.json();
            }

            if (!resTemp.ok || !resEsg.ok) throw new Error("Error al conectar con las APIs");

            // 3. Cruzar datos: Obtenemos todos los años únicos que existen en ambas bases de datos
            const allYears = [...new Set([...dataTemp.map(d => parseInt(d.year)), ...dataEsg.map(d => parseInt(d.year))])].sort();
            
            let plotData = [['Año', 'Temp. Media (ºC)', 'Puntuación ESG']];
            let matches = 0;

            allYears.forEach(y => {
                const tempsDelAno = dataTemp.filter(d => parseInt(d.year) === y);
                const esgsDelAno = dataEsg.filter(d => parseInt(d.year) === y);

                // Si hay datos en las dos APIs para ese año, calculamos las medias
                if (tempsDelAno.length > 0 && esgsDelAno.length > 0) {
                    const avgTemp = tempsDelAno.reduce((acc, curr) => acc + curr.temperature, 0) / tempsDelAno.length;
                    const avgEsg = esgsDelAno.reduce((acc, curr) => acc + (curr.esg_overall || 0), 0) / esgsDelAno.length;
                    
                    plotData.push([y.toString(), parseFloat(avgTemp.toFixed(2)), parseFloat(avgEsg.toFixed(2))]);
                    matches++;
                }
            });

            if (matches === 0) {
                message = "⚠️ No hay años en común entre ambas bases de datos. Revisa que tú tienes cargados los datos iniciales de Temperaturas.";
                return;
            }

            message = ""; // Éxito, quitamos el mensaje de carga

            // 4. Dibujar la gráfica con Google Charts
            dataTable = window.google.visualization.arrayToDataTable(plotData);

            options = {
                title: 'Evolución Anual: Temperatura vs Puntuación Sostenible (ESG)',
                titleTextStyle: { color: '#ffffff', fontSize: 18, bold: true },
                backgroundColor: 'transparent',
                chartArea: { width: '85%', height: '70%', top: 60 }, // Damos espacio para que no se corte el título
                hAxis: { 
                    title: 'Año', 
                    textStyle: { color: '#cbd5e1' }, 
                    titleTextStyle: { color: '#94a3b8', italic: false, bold: true } 
                },
                // CONFIGURACIÓN DE DOBLE EJE Y
                vAxes: {
                    0: { 
                        title: 'Temperatura (ºC)', 
                        textStyle: { color: '#00f2fe' }, 
                        titleTextStyle: { color: '#00f2fe', italic: false, bold: true },
                        gridlines: { color: 'rgba(255,255,255,0.1)' }
                    },
                    1: { 
                        title: 'Puntos ESG', 
                        textStyle: { color: '#10b981' }, 
                        titleTextStyle: { color: '#10b981', italic: false, bold: true },
                        gridlines: { color: 'transparent' } // Ocultamos la cuadrícula secundaria para no saturar
                    }
                },
                series: {
                    0: { targetAxisIndex: 0, color: '#00f2fe' }, // Temperatura al eje izquierdo
                    1: { targetAxisIndex: 1, color: '#10b981' }  // ESG al eje derecho
                },
                legend: { 
                    position: 'bottom', 
                    textStyle: { color: '#ffffff', fontSize: 14 } // Texto de leyenda blanco para que se vea
                },
                isStacked: false,
                areaOpacity: 0.4,
                lineWidth: 3
            };

            chart = new window.google.visualization.SteppedAreaChart(chartContainer);
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
    <p class="subtitle">Integración con G28 usando <b>Google Charts</b> (Stepped Area Chart) con doble eje Y.</p>
    
    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="card" class:hidden={!!message}>
        <div bind:this={chartContainer} style="width: 100%; height: 500px;"></div>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0; }
    main { max-width: 1100px; margin: 0 auto; padding: 2rem; }
    h2 { color: #10b981; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 2rem; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 1rem; }
    .back-btn:hover { color: #10b981; }
    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    .alert { background: rgba(16, 185, 129, 0.2); border-left: 4px solid #10b981; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; text-align: center; color: #10b981; font-weight: bold; }
    .hidden { display: none; }
</style>