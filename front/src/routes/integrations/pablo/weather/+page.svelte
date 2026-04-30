<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let chartElement;
    let message = "Cargando el clima actual y el histórico...";
    let historicalTemp = "...";

    onMount(async () => {
        if (!browser) return;
        
        // Esperamos a que Frappe Charts se cargue desde el CDN
        const checkFrappe = setInterval(async () => {
            if (window.frappe) {
                clearInterval(checkFrappe);
                await loadAndDraw();
            }
        }, 100);
    });

    async function loadAndDraw() {
        try {
            // 1. Fetch a la API de Pablo (Temperaturas) para sacar el histórico de España
            const resTemp = await fetch('/api/v2/average-annual-temperatures?country=Spain&year=2022');
            
            // 2. Fetch a la API Externa Pública (Open-Meteo) para Madrid
            const resWeather = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.4165&longitude=-3.7026&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FMadrid');

            if (!resTemp.ok || !resWeather.ok) throw new Error("Error al conectar con las APIs");

            const dataTemp = await resTemp.json();
            const dataWeather = await resWeather.json();

            // Extraemos el dato histórico (si viene como array cogemos el primero)
            const spainData = Array.isArray(dataTemp) ? dataTemp[0] : dataTemp;
            if (spainData) {
                historicalTemp = `${spainData.temperature} ºC (Año ${spainData.year})`;
            }

            message = ""; // Ocultamos el mensaje de carga

            // 3. Formateamos las fechas de la API del tiempo para que queden bonitas
            const labels = dataWeather.daily.time.map(date => {
                const d = new Date(date);
                return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
            });

            // 4. Dibujar la gráfica con Frappe Charts
            new window.frappe.Chart(chartElement, {
                title: "Previsión Semanal (Madrid) vs Histórico",
                data: {
                    labels: labels,
                    datasets: [
                        { name: "Temp. Máxima (ºC)", values: dataWeather.daily.temperature_2m_max },
                        { name: "Temp. Mínima (ºC)", values: dataWeather.daily.temperature_2m_min }
                    ]
                },
                type: 'bar', // Es un gráfico de barras (cumple no ser 'line')
                height: 400,
                colors: ['#ef4444', '#3b82f6'], // Rojo para max, azul para min
                tooltipOptions: {
                    formatTooltipX: d => (d + '').toUpperCase(),
                    formatTooltipY: d => d + ' ºC'
                }
            });

        } catch (error) {
            console.error(error);
            message = "❌ Error en la integración de datos: " + error.message;
        }
    }
</script>

<svelte:head>
    <!-- Importamos Frappe Charts -->
    <script src="https://cdn.jsdelivr.net/npm/frappe-charts@1.2.4/dist/frappe-charts.min.iife.js"></script>
</svelte:head>

<main>
    <a href="/integrations" class="back-btn">⬅ Volver al Panel</a>
    <h2>🌤️ Previsión Actual vs Histórico (Pablo)</h2>
    <p class="subtitle">Integración con API Externa (Open-Meteo) usando <b>Frappe Charts</b>.</p>

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="card" class:hidden={!!message}>
        <div class="info-header">
            <span>🌍 <b>Temperatura Media Histórica (España):</b> {historicalTemp}</span>
        </div>
        <div bind:this={chartElement} class="chart-bg"></div>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0; }
    main { max-width: 900px; margin: 0 auto; padding: 2rem; }
    h2 { color: #3b82f6; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 2rem; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 1rem; }
    .back-btn:hover { color: #3b82f6; }
    
    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    .alert { background: rgba(59, 130, 246, 0.2); border-left: 4px solid #3b82f6; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; text-align: center; font-weight: bold;}
    
    /* Frappe Charts pone letras oscuras por defecto, así que le ponemos fondo claro a la gráfica */
    .chart-bg { background-color: #f8fafc; border-radius: 8px; padding: 10px; margin-top: 1rem;}
    .info-header { text-align: center; margin-bottom: 1rem; font-size: 1.1rem; color: #e2e8f0; }
    
    .hidden { display: none; }
</style>