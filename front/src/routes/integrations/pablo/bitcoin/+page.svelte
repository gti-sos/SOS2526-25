<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    // ¡Nuestros $state reactivos!
    let message = $state("Cargando precios de Bitcoin y temperaturas...");
    let fallbackActivado = $state(false);

    onMount(async () => {
        if (!browser) return;

        // C3.js tiene una trampa: NECESITA que D3.js se cargue PRIMERO
        const scriptD3 = document.createElement('script');
        scriptD3.src = "https://d3js.org/d3.v5.min.js"; // Cargamos D3
        
        scriptD3.onload = () => {
            // Cuando D3 termine, cargamos C3
            const scriptC3 = document.createElement('script');
            scriptC3.src = "https://cdnjs.cloudflare.com/ajax/libs/c3/0.7.20/c3.min.js";
            scriptC3.onload = () => {
                loadAndDraw(); // Y cuando C3 termine, dibujamos
            };
            document.head.appendChild(scriptC3);
        };
        document.head.appendChild(scriptD3);
    });

    async function loadAndDraw() {
        try {
            // 1. Fetch a tu API (Temperaturas)
            const resTemp = await fetch('/api/v2/average-annual-temperatures');
            let dataTemp = resTemp.ok ? await resTemp.json() : [];

            // 2. Fetch a la API EXTERNA (Bitcoin - CoinDesk u otra pública)
            let btcData = null;
            try {
                // Usamos una API pública de precios históricos por año o un proxy si tienes uno
                // Si esta falla (muy común por bloqueos de CORS externos), saltará el fallback
                const resBtc = await fetch('/api/proxy/pablo/bitcoin');
                if (resBtc.ok) {
                    btcData = await resBtc.json();
                }
            } catch(e) { console.warn("Fallo al conectar con la API de Bitcoin."); }

            let years = [];
            let seriesTemp = ['Temp. Alemania (ºC)'];
            let seriesBtc = ['Bitcoin (Miles de USD)'];

            // Cruzamos datos: Filtramos por Alemania y cruzamos con años
            if (dataTemp.length > 0 && btcData && btcData.bpi) {
                const germanyTemps = dataTemp.filter(d => d.country?.toLowerCase() === 'germany').sort((a,b) => a.year - b.year);
                
                germanyTemps.forEach(d => {
                    years.push(d.year);
                    seriesTemp.push(d.temperature);
                    // Lógica simulada para extraer el precio de final de año de la API
                    const priceKey = `${d.year}-12-31`;
                    const price = btcData.bpi[priceKey] ? (btcData.bpi[priceKey] / 1000) : 0; 
                    seriesBtc.push(price);
                });
            }

            // MODO DE RESPALDO (Fallback) si falla la API externa
            if (years.length === 0 || seriesBtc.length <= 1) {
                console.log("Activando datos de respaldo de Bitcoin...");
                fallbackActivado = true;
                years = ['2018', '2019', '2020', '2021', '2022'];
                seriesTemp = ['Temp. Alemania (ºC)', 10.45, 10.3, 10.4, 9.48, 10.5]; // Datos de tu BD
                seriesBtc = ['Bitcoin (Miles de USD)', 3.8, 7.2, 29.0, 47.0, 16.5]; // Precios históricos aprox
            }

            // Svelte detecta esto y muestra el div
            message = ""; 

            // 🔥 ESPERAMOS 100ms para que C3.js encuentre su lienzo
            setTimeout(() => {
                window.c3.generate({
                    bindto: '#c3-chart',
                    data: {
                        columns: [
                            seriesTemp,
                            seriesBtc
                        ],
                        type: 'bar',
                        types: {
                            'Temp. Alemania (ºC)': 'line' // Hacemos un gráfico combinado (Línea + Barras)
                        },
                        colors: {
                            'Temp. Alemania (ºC)': '#00f2fe',
                            'Bitcoin (Miles de USD)': '#f59e0b'
                        }
                    },
                    axis: {
                        x: {
                            type: 'category',
                            categories: years
                        },
                        y: {
                            label: { text: 'Valores', position: 'outer-middle' }
                        }
                    }
                });
            }, 100);

        } catch (error) { 
            message = "❌ Error en la integración: " + error.message; 
        }
    }
</script>

<svelte:head>
    <!-- C3.js necesita su propio archivo CSS para verse bien -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/c3/0.7.20/c3.min.css" rel="stylesheet">
</svelte:head>

<main>
    <!-- Mantenemos el data-sveltekit-reload por si acaso -->
    <a href="/integrations" class="back-btn" data-sveltekit-reload>⬅ Volver al Panel</a>
    <h2>💰 Clima Alemania vs Bitcoin (Pablo)</h2>
    <p class="subtitle">Integración Externa usando <b>C3.js</b> (Bar/Line Chart).</p>

    {#if fallbackActivado}
        <div class="fallback-warning">
            ⚠️ Modo Respaldo: No se pudo conectar con la API de Bitcoin. Usando datos históricos simulados.
        </div>
    {/if}

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <!-- Fondo blanco para que la gráfica C3.js se lea perfectamente -->
    <div class="card" class:hidden={!!message}>
        <div id="c3-chart"></div>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0; }
    main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h2 { color: #f59e0b; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 2rem; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 1rem; }
    .back-btn:hover { color: #f59e0b; }
    
    /* Fondo blanco forzado para evitar problemas de contraste con el texto por defecto negro de C3 */
    .card { background: white; border-radius: 15px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    
    .alert { background: rgba(245, 158, 11, 0.2); border-left: 4px solid #f59e0b; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; text-align: center; color: #f59e0b; font-weight: bold;}
    
    .fallback-warning {
        background-color: rgba(239, 68, 68, 0.15);
        border: 1px solid #ef4444;
        color: #fca5a5;
        padding: 0.8rem;
        border-radius: 8px;
        text-align: center;
        font-size: 0.9rem;
        margin-bottom: 1.5rem;
    }
    
    .hidden { display: none; }
</style>