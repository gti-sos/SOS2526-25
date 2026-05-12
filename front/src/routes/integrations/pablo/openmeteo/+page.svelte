<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    // ¡El $state salvavidas!
    let message = $state("Cargando el clima actual (Open-Meteo) y el histórico (Pablo)...");
    let fallbackActivado = $state(false);

    onMount(async () => {
        if (!browser) return;

        // Inyectamos Frappe Charts de forma segura
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/frappe-charts@1.2.4/dist/frappe-charts.min.iife.js";
        script.onload = () => {
            loadAndDraw();
        };
        document.head.appendChild(script);
    });

    async function loadAndDraw() {
        try {
            // 1. Fetch a tu API (Temperaturas Históricas)
            const resTemp = await fetch('/api/v2/average-annual-temperatures');
            let dataTemp = resTemp.ok ? await resTemp.json() : [];

            // 2. Fetch a la API EXTERNA (Open-Meteo)
            let currentTemps = [];
            try {
                const urls = [
                    { country: "Spain", url: "https://api.open-meteo.com/v1/forecast?latitude=40.4165&longitude=-3.7026&current_weather=true" }, 
                    { country: "Germany", url: "https://api.open-meteo.com/v1/forecast?latitude=52.5200&longitude=13.4050&current_weather=true" }, 
                    { country: "China", url: "https://api.open-meteo.com/v1/forecast?latitude=39.9042&longitude=116.4074&current_weather=true" }, 
                    { country: "USA", url: "https://api.open-meteo.com/v1/forecast?latitude=38.8951&longitude=-77.0364&current_weather=true" } 
                ];

                for (const u of urls) {
                    const r = await fetch(u.url);
                    if (r.ok) {
                        const d = await r.json();
                        currentTemps.push({ country: u.country, current_temp: d.current_weather.temperature });
                    }
                }
            } catch(e) { console.warn("Fallo al conectar con Open-Meteo."); }

            let labels = [];
            let seriesHist = [];
            let seriesCurr = [];

            // Cruzamos los datos
            if (dataTemp.length > 0 && currentTemps.length > 0) {
                currentTemps.forEach(ct => {
                    const hist = dataTemp.filter(d => d.country === ct.country).sort((a,b) => b.year - a.year)[0];
                    if (hist) {
                        labels.push(ct.country);
                        seriesHist.push(hist.temperature);
                        seriesCurr.push(ct.current_temp);
                    }
                });
            }

            // MODO DE RESPALDO (Fallback)
            if (labels.length === 0) {
                console.log("Activando datos de respaldo...");
                fallbackActivado = true;
                labels = ["Spain", "Germany", "China", "USA"];
                seriesHist = [14.4, 10.7, 8.2, 11.8]; 
                seriesCurr = [18.5, 12.1, 15.3, 14.2]; 
            }

            message = ""; // Quitamos el cartel

            // 🔥 LA MAGIA: Esperamos 100ms para que Frappe encuentre su contenedor visible
            setTimeout(() => {
                new window.frappe.Chart("#frappe-chart", {
                    title: "Comparativa: Temp. Media Anual vs Temperatura HOY",
                    data: {
                        labels: labels,
                        datasets: [
                            // ✅ SOLUCIÓN AQUÍ: Nombres más cortos para que la leyenda no se solape
                            { name: "Histórico (Pablo)", values: seriesHist },
                            { name: "Actual (Open-Meteo)", values: seriesCurr }
                        ]
                    },
                    type: 'bar',
                    height: 450,
                    colors: ['#00f2fe', '#facc15'],
                    axisOptions: { xIsSeries: false },
                    tooltipOptions: { formatTooltipY: d => d + ' ºC' }
                });
            }, 100);

        } catch (error) { 
            message = "❌ Error en la integración: " + error.message; 
        }
    }
</script>

<main>
    <a href="/integrations" class="back-btn">⬅ Volver al Panel</a>
    <h2>🌤️ Previsión Actual vs Histórico (Pablo)</h2>
    <p class="subtitle">Integración con API Externa (<b>Open-Meteo</b>) usando <b>Frappe Charts</b>.</p>

    {#if fallbackActivado}
        <div class="fallback-warning">
            ⚠️ Modo Respaldo: No se pudo conectar con Open-Meteo o no hay países en común. Usando datos simulados.
        </div>
    {/if}

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="card" class:hidden={!!message}>
        <div id="frappe-chart"></div>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0; }
    main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h2 { color: #facc15; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 2rem; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 1rem; }
    .back-btn:hover { color: #facc15; }
    
    .card { background: white; border-radius: 15px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    
    .alert { background: rgba(59, 130, 246, 0.2); border-left: 4px solid #3b82f6; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; text-align: center; color: #60a5fa; font-weight: bold;}
    
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

    /* ✅ ALTERNATIVA: Si aún con los textos cortos se solapan en pantallas pequeñas, descomenta la siguiente regla: */
    /*
    :global(.chart-legend > g:nth-child(2)) {
        transform: translateX(45px);
    }
    */
</style>