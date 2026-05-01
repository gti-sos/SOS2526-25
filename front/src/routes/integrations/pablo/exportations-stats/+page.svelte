<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Conectando con la API de Exportaciones (G13)...");
    let fallbackActivado = $state(false);

    onMount(async () => {
        if (!browser) return;

        const script = document.createElement('script');
        script.src = "https://cdn.zingchart.com/zingchart.min.js";
        script.onload = () => {
            loadAndDraw();
        };
        document.head.appendChild(script);
    });

    async function loadAndDraw() {
        try {
            // 1. Tus datos (Pablo)
            const resTemp = await fetch('/api/v2/average-annual-temperatures');
            let dataTemp = resTemp.ok ? await resTemp.json() : [];

            // 2. Datos del G13 (Agresivo para traer 1000 registros y evitar paginación)
            let dataG13 = [];
            try {
                let resG13 = await fetch('https://sos2526-13.onrender.com/api/v1/exportations-stats?limit=1000');
                if (!resG13.ok) {
                    resG13 = await fetch('https://sos2526-13.onrender.com/api/v2/exportations-stats?limit=1000');
                }
                if (resG13.ok) {
                    const responseG13 = await resG13.json();
                    dataG13 = Array.isArray(responseG13) ? responseG13 : (responseG13.data || []);
                    
                    // Si está vacía, les forzamos a cargar datos
                    if (dataG13.length === 0) {
                        await fetch('https://sos2526-13.onrender.com/api/v1/exportations-stats/loadInitialData');
                        let resG13Retry = await fetch('https://sos2526-13.onrender.com/api/v1/exportations-stats?limit=1000');
                        const responseG13Retry = await resG13Retry.json();
                        dataG13 = Array.isArray(responseG13Retry) ? responseG13Retry : (responseG13Retry.data || []);
                    }
                }
            } catch(e) { console.warn("La API del G13 está caída."); }

            let categories = [];
            let seriesTemp = [];
            let seriesG13 = [];

            // 🔥 EL ARREGLO MÁGICO ESTÁ AQUÍ 🔥
            if (dataTemp.length > 0 && dataG13.length > 0) {
                // Buscamos el campo que tenga los valores de exportación (ignorando año de pedido)
                const exportKey = Object.keys(dataG13[0]).find(k => typeof dataG13[0][k] === 'number' && !k.includes('year')) || "export_value";

                dataTemp.forEach(tempDoc => {
                    const g13Doc = dataG13.find(d => {
                        // Ahora leemos su variable "recipient" en lugar de "country"
                        const g13Country = (d.recipient || d.country || d.country_name || "").trim().toLowerCase();
                        const myCountry = (tempDoc.country || "").trim().toLowerCase();
                        return g13Country === myCountry;
                    });
                    
                    if (g13Doc && !categories.includes(tempDoc.country)) {
                        categories.push(tempDoc.country);
                        seriesTemp.push(tempDoc.temperature || 0);
                        seriesG13.push(g13Doc[exportKey] || 0);
                    }
                });
            }

            // Si falla el cruce (sus servidores están caídos), salta el respaldo
            if (categories.length === 0) {
                fallbackActivado = true;
                categories = ["Germany", "Spain", "China", "USA"];
                seriesTemp = [10.5, 14.2, 8.2, 11.8];
                seriesG13 = [1500000, 320000, 2500000, 500000];
            }

            message = ""; 

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
                            { text: "Exportaciones (G13)", values: seriesG13, backgroundColor: "#f59e0b", lineColor: "#f59e0b" }
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

    {#if fallbackActivado}
        <div class="fallback-warning">
            ⚠️ Modo Respaldo: No se encontraron coincidencias reales. Usando datos simulados.
        </div>
    {/if}

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