<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let chartContainer;
    let message = "Cargando precios de Bitcoin y temperaturas...";

    onMount(async () => {
        if (!browser) return;

        // C3.js necesita D3.js primero, así que cargamos los dos scripts
        const loadScript = (src) => new Promise(resolve => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            document.head.appendChild(script);
        });

        // Cargamos el CSS de C3.js
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/c3/0.7.20/c3.min.css';
        document.head.appendChild(link);

        // Cargamos scripts en orden
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/d3/5.16.0/d3.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/c3/0.7.20/c3.min.js');

        await drawChart();
    });

    async function drawChart() {
        try {
            // 1. Fetch a tu API (Temperaturas de Alemania)
            const resTemp = await fetch('/api/v2/average-annual-temperatures?country=Germany');
            
            // 2. Fetch a la API Externa Pública (CoinDesk Bitcoin BPI)
            // Pedimos el histórico de un mes
            const resBtc = await fetch('https://api.coindesk.com/v1/bpi/historical/close.json');

            if (!resTemp.ok || !resBtc.ok) throw new Error("Error al conectar con las APIs");

            const dataTemp = await resTemp.json();
            const dataBtc = await resBtc.json();

            // Preparar datos para C3.js
            let years = [];
            let temps = ['Temp. Alemania'];
            let btcs = ['Precio Bitcoin (Simulado)'];

            // Usamos las fechas de Bitcoin y cruzamos con los años de tus temperaturas
            // Como son temporalidades diferentes (tu API es por año, BTC por día),
            // hacemos un mapeo ilustrativo para la gráfica.
            const btcDates = Object.keys(dataBtc.bpi);
            const btcValues = Object.values(dataBtc.bpi);

            // Cogemos los datos de Alemania que tengamos
            dataTemp.forEach((t, i) => {
                if (i < btcValues.length) {
                    years.push(t.year.toString());
                    temps.push(t.temperature);
                    // Escalamos el precio del BTC dividiendo entre 1000 para que se vea bien en la misma gráfica
                    btcs.push(btcValues[i] / 1000); 
                }
            });

            if (years.length === 0) {
                message = "⚠️ No hay datos de temperatura para mostrar.";
                return;
            }

            message = "";

            // 3. Dibujar gráfica con C3.js
            window.c3.generate({
                bindto: chartContainer,
                data: {
                    columns: [
                        temps,
                        btcs
                    ],
                    type: 'bar', // C3.js soporta barras, es seguro y no es line
                    colors: {
                        'Temp. Alemania': '#ff5252',
                        'Precio Bitcoin (Simulado)': '#facc15'
                    }
                },
                axis: {
                    x: {
                        type: 'category',
                        categories: years,
                        tick: {
                            style: { fill: '#cbd5e1' }
                        }
                    },
                    y: {
                        tick: {
                            format: d => d.toFixed(1),
                            style: { fill: '#cbd5e1' }
                        }
                    }
                },
                legend: {
                    item: {
                        font: { color: '#ffffff' }
                    }
                }
            });

        } catch (error) {
            console.error(error);
            message = "❌ Error en la integración de datos: " + error.message;
        }
    }
</script>

<main>
    <a href="/integrations" class="back-btn">⬅ Volver al Panel</a>
    <h2>💰 Clima Alemania vs Bitcoin (Pablo)</h2>
    <p class="subtitle">Integración Externa usando <b>C3.js</b> (Bar Chart).</p>

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="card" class:hidden={!!message}>
        <div bind:this={chartContainer} class="chart-bg"></div>
        <p style="text-align: center; color: #94a3b8; font-size: 0.85rem; margin-top: 1rem;">
            * El precio de Bitcoin está escalado (dividido / 1000) para poder compararlo en el mismo eje visual que la temperatura.
        </p>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0; }
    main { max-width: 900px; margin: 0 auto; padding: 2rem; }
    h2 { color: #facc15; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 2rem; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 1rem; }
    .back-btn:hover { color: #facc15; }
    
    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    .alert { background: rgba(250, 204, 21, 0.2); border-left: 4px solid #facc15; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; text-align: center; font-weight: bold;}
    
    /* Fondo claro para que las letras oscuras de C3 se lean bien por defecto */
    .chart-bg { background-color: #f8fafc; border-radius: 8px; padding: 20px; }
    
    .hidden { display: none; }
</style>