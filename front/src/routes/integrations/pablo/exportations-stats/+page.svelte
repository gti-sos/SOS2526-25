<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = "Conectando con la API de Exportaciones (G13)...";

    onMount(async () => {
        if (!browser) return;

        // Esperamos a que ZingChart se cargue desde el CDN
        const checkZing = setInterval(async () => {
            if (window.zingchart) {
                clearInterval(checkZing);
                await loadAndDraw();
            }
        }, 100);
    });

    async function loadAndDraw() {
        try {
            // 1. Fetch a la API de Temperaturas (Pablo)
            const resTemp = await fetch('/api/v2/average-annual-temperatures');
            
            // 2. Fetch a la API del G13 pidiendo suficientes registros
            let resG13 = await fetch('https://sos2526-13.onrender.com/api/v2/exportations-stats?limit=100');
            if (!resG13.ok) {
                // Si la v2 falla, intentamos con la v1
                resG13 = await fetch('https://sos2526-13.onrender.com/api/v1/exportations-stats?limit=100');
            }

            if (!resTemp.ok || !resG13.ok) throw new Error("Error al obtener datos de las APIs");

            const dataTemp = await resTemp.json();
            const responseG13 = await resG13.json();
            
            // Manejamos si devuelven directamente el array o un objeto con paginación
            const dataG13 = Array.isArray(responseG13) ? responseG13 : (responseG13.data || []);

            let categories = [];
            let seriesTemp = [];
            let seriesG13 = [];

            // Detectar automáticamente el campo numérico principal de exportaciones
            let exportKey = "export_value"; 
            if (dataG13.length > 0) {
                const keys = Object.keys(dataG13[0]).filter(k => typeof dataG13[0][k] === 'number' && k !== 'year');
                if (keys.length > 0) exportKey = keys[0];
            }

            // Cruzamos los datos por país
            dataTemp.forEach(tempDoc => {
                const g13Doc = dataG13.find(d => 
                    d.country?.toLowerCase() === tempDoc.country?.toLowerCase() || 
                    d.country_name?.toLowerCase() === tempDoc.country?.toLowerCase()
                );
                
                if (g13Doc && !categories.includes(tempDoc.country)) {
                    categories.push(tempDoc.country);
                    seriesTemp.push(tempDoc.temperature || 0);
                    seriesG13.push(g13Doc[exportKey] || 0);
                }
            });

            if (categories.length === 0) {
                message = "⚠️ No hay países en común entre Temperaturas y Exportaciones (G13).";
                return;
            }

            message = ""; // Éxito, ocultamos mensaje

            // 3. Renderizamos la gráfica con ZingChart
            window.zingchart.render({
                id: "zingchart-container", 
                data: {
                    type: "area", // Tipo Área (cumple con no ser "line")
                    backgroundColor: "transparent",
                    plotarea: { margin: "dynamic" },
                    legend: { 
                        layout: "x2", 
                        align: "center", 
                        verticalAlign: "bottom", 
                        fontColor: "#cbd5e1",
                        backgroundColor: "transparent",
                        borderWidth: 0
                    },
                    scaleX: { 
                        labels: categories, 
                        item: { fontColor: "#94a3b8" },
                        lineColor: "#334155",
                        guide: { visible: false }
                    },
                    scaleY: { 
                        item: { fontColor: "#94a3b8" },
                        lineColor: "#334155",
                        guide: { lineStyle: "solid", lineColor: "#1e293b" }
                    },
                    tooltip: {
                        text: "%t en %k: %v",
                        borderRadius: "5px"
                    },
                    series: [
                        { 
                            text: "Temperatura Media (Pablo)", 
                            values: seriesTemp, 
                            backgroundColor: "#00f2fe",
                            lineColor: "#00f2fe",
                            marker: { backgroundColor: "#00f2fe" }
                        },
                        { 
                            text: `Exportaciones G13 (${exportKey})`, 
                            values: seriesG13, 
                            backgroundColor: "#f59e0b",
                            lineColor: "#f59e0b",
                            marker: { backgroundColor: "#f59e0b" }
                        }
                    ]
                },
                height: 500,
                width: "100%"
            });

        } catch (error) {
            console.error(error);
            message = "❌ Error en la integración de datos: " + error.message;
        }
    }
</script>

<svelte:head>
    <script src="https://cdn.zingchart.com/zingchart.min.js"></script>
</svelte:head>

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
    .alert { background: rgba(245, 158, 11, 0.2); border-left: 4px solid #f59e0b; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; text-align: center; font-weight: bold; }
    
    .hidden { display: none; }
</style>