<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let chartElement;
    let message = "Cargando datos climáticos externos...";

    onMount(async () => {
        if (!browser) return;
        const checkFrappe = setInterval(async () => {
            if (window.frappe) {
                clearInterval(checkFrappe);
                await drawChart();
            }
        }, 100);
    });

    async function drawChart() {
        try {
            // API pública de clima actual (Open-Meteo) para Sevilla
            const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=37.3828&longitude=-5.9732&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FBerlin');
            const data = await res.json();
            
            message = "";

            new window.frappe.Chart(chartElement, {
                title: "Previsión Semanal de Temperaturas en Sevilla",
                data: {
                    labels: data.daily.time, // Fechas
                    datasets: [
                        { name: "Max Temp (ºC)", values: data.daily.temperature_2m_max },
                        { name: "Min Temp (ºC)", values: data.daily.temperature_2m_min }
                    ]
                },
                type: 'bar', // Tipo barra (no es line)
                colors: ['#ff5252', '#00f2fe'],
                height: 400
            });
        } catch (e) { message = "Error al cargar la API externa."; }
    }
</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/frappe-charts@1.2.4/dist/frappe-charts.min.iife.js"></script>
</svelte:head>

<main>
    <a href="/integrations" style="color:#94a3b8; font-weight:bold;">⬅ Volver</a>
    <h2 style="color: #ff5252;">🌦️ Clima Sevilla (Pablo)</h2>
    <p style="color: #94a3b8;">Uso de <b>Frappe Charts</b> con la API pública Open-Meteo.</p>
    {#if message}<p style="color: #facc15;">{message}</p>{/if}
    <div style="background: white; border-radius: 10px; padding: 10px;" class:hidden={!!message}>
        <div bind:this={chartElement}></div>
    </div>
</main>
<style>.hidden { display: none; } :global(body){background:#0f172a; font-family:sans-serif;} main{max-width:900px; margin:auto; padding:2rem;}</style>