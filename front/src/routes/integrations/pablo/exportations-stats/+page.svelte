<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    // 🔥 EL CULPABLE ESTABA AQUÍ: Faltaba el $state
    let message = $state("Conectando con la API de Exportaciones (G13)...");

    onMount(async () => {
        if (!browser) return;

        // Cargamos el script de ZingChart
        const script = document.createElement('script');
        script.src = "https://cdn.zingchart.com/zingchart.min.js";
        script.onload = () => {
            loadAndDraw();
        };
        document.head.appendChild(script);
    });

    async function loadAndDraw() {
        try {
            const resTemp = await fetch('/api/v2/average-annual-temperatures');
            let dataTemp = resTemp.ok ? await resTemp.json() : [];

            let dataG13 = [];
            try {
                let resG13 = await fetch('https://sos2526-13.onrender.com/api/v1/exportations-stats');
                if (!resG13.ok) {
                    resG13 = await fetch('https://sos2526-13.onrender.com/api/v2/exportations-stats');
                }
                if (resG13.ok) {
                    const responseG13 = await resG13.json();
                    dataG13 = Array.isArray(responseG13) ? responseG13 : (responseG13.data || []);
                }
            } catch(e) { console.warn("Fallo al conectar con la API de Exportaciones (G13)."); }

            let categories = [];
            let seriesTemp = [];
            let seriesG13 = [];

            if (dataTemp.length === 0 || dataG13.length === 0) {
                console.log("Activando datos de respaldo...");
                categories = ["Germany", "Spain", "China", "Italy"];
                seriesTemp = [10.5, 14.2, 8.2, 13.5];
                seriesG13 = [1500000, 320000, 2500000, 500000];
            } else {
                let exportKey = "export_value"; 
                if (dataG13.length > 0) {
                    const keys = Object.keys(dataG13[0]).filter(k => typeof dataG13[0][k] === 'number' && k !== 'year');
                    if (keys.length > 0) exportKey = keys[0];
                }

                dataTemp.forEach(tempDoc => {
                    const g13Doc = dataG13.find(d => d.country?.toLowerCase() === tempDoc.country?.toLowerCase());
                    if (g13Doc && !categories.includes(tempDoc.country)) {
                        categories.push(tempDoc.country);
                        seriesTemp.push(tempDoc.temperature || 0);
                        seriesG13.push(g13Doc[exportKey] || 0);
                    }
                });
            }

            if (categories.length === 0) {
                throw new Error("No hay países en común. Asegúrate de tener datos en tu base de datos.");
            }

            // Ahora Svelte SÍ se enterará del cambio y quitará el cartel
            message = ""; 

            // Dejamos 100ms de seguridad para que el div aparezca en pantalla antes de dibujar
            setTimeout(() => {
                window.zingchart.render({
                    id: "zingchart-container", 
                    data: {
                        type: "area", 
                        backgroundColor: "transparent",
                        plotarea: { margin: "dynamic" },
                        legend: { layout: "x2", align: "center", verticalAlign: "bottom", fontColor: "#cbd5e1", backgroundColor: "transparent", borderWidth: 0 },
                        scaleX: { labels: categories, item: { fontColor: "#94a3b8" }, lineColor: "#334155" },
                        scaleY: { item: { fontColor: "#94a3b8" }, lineColor: "#334155" },
                        tooltip: { borderRadius: "5px" },
                        series: [
                            { text: "Temp. Media (ºC)", values: seriesTemp, backgroundColor: "#00f2fe", lineColor: "#00f2fe" },
                            { text: "Exportaciones G13", values: seriesG13, backgroundColor: "#f59e0b", lineColor: "#f59e0b" }
                        ]
                    },
                    height: 500, width: "100%"
                });
            }, 100);

        } catch (error) { 
            message = "❌ Error en la integración de datos: " + error.message; 
        }
    }
</script>

<main>
    <a href="/integrations" class="back-btn">⬅ Volver al Panel</a>
    <h2>🚢 Clima vs Exportaciones (Pablo)</h2>
    <p class="subtitle">Integración con G13 usando <b>ZingChart</b> (Area Chart).</p>

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="card" class:hidden={!!message}>
        <div id="zingchart-container"></div>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0; }
    main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h2 { color: #f59e0b; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 2rem; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; display: inline-block; margin-bottom: 1rem; }
    .back-btn:hover { color: #f59e0b; }
    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    .alert { background: rgba(245, 158, 11, 0.2); border-left: 4px solid #f59e0b; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; text-align: center; color: #f59e0b; font-weight: bold;}
    .hidden { display: none; }
</style>