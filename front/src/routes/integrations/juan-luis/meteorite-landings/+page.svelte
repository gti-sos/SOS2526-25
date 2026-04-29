<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';

    let message = $state("Cruzando datos de alcohol y meteoritos...");
    let chartContainer;

    onMount(async () => { try{
    // --- 1. Inicializamos los arrays ---
            let paisesComunes = [];
            let datosAlcohol = [];
            let datosMeteoritos = [];

            // 🚀 ESTO ES LO QUE FALTABA: Descargar los datos de las APIs
            const resMis = await fetch('/api/v2/social-drinking-behaviors'); 
            const resG14 = await fetch('https://meteorite-landings-tvcf.onrender.com/api/v2/meteorite-landings/');

            if (!resMis.ok) throw new Error("Fallo al obtener tus datos de alcohol");
            if (!resG14.ok) throw new Error("Fallo al obtener datos de meteoritos (G14)");

            const misDatos = await resMis.json();
            const g14Datos = await resG14.json();
            // --- 2. Creamos un mapa de tus datos para búsqueda rápida ---
            const alcoholMap = new Map();
            misDatos.forEach(d => {
                let pais = String(d.country).trim().toLowerCase();
                if (pais === "usa") pais = "united states of america";
                // Usamos una clave combinada de país y año
                alcoholMap.set(`${pais}-${d.year}`, d.total_liter);
            });

            // --- 3. Contamos meteoritos del G14 que coincidan en país y año ---
            const metCount = {};
            g14Datos.forEach(m => {
                if(!m.country || !m.year) return;
                let pais = String(m.country).trim().toLowerCase();
                let ano = String(m.year).trim();
                let key = `${pais}-${ano}`;
                
                if (alcoholMap.has(key)) {
                    metCount[key] = (metCount[key] || 0) + 1;
                }
            });

            // --- 4. Llenamos los arrays definitivos para la gráfica ---
            for (let [key, litros] of alcoholMap) {
                if (metCount[key]) {
                    const [paisNom, ano] = key.split('-');
                    // Aquí es donde definimos paisesComunes
                    paisesComunes.push(`${paisNom.toUpperCase()} (${ano})`);
                    datosAlcohol.push(litros);
                    datosMeteoritos.push(metCount[key]);
                }
            }

            // --- 5. Verificación de seguridad ---
            if (paisesComunes.length === 0) {
                message = "⚠️ No hay coincidencias exactas. ¿Cargaste los datos del G14?";
                return;
            }

            message = ""; // Éxito, ocultamos el mensaje de carga
            // 5. Pintamos el Highcharts Mixto
            Highcharts.chart(chartContainer, {
                chart: { backgroundColor: '#0f172a', borderRadius: 10 },
                title: { 
                    text: 'Alcohol vs Meteoritos Históricos', 
                    style: { color: '#ffffff', fontWeight: 'bold' } 
                },
                xAxis: { 
                    categories: paisesComunes, 
                    labels: { style: { color: '#94a3b8' } } 
                },
                yAxis: [{ // Eje primario (Alcohol)
                    title: { text: 'Consumo Alcohol (Litros)', style: { color: '#38bdf8' } },
                    labels: { style: { color: '#38bdf8' } }
                }, { // Eje secundario (Meteoritos)
                    title: { text: 'Nº Impactos de Meteoritos', style: { color: '#ef4444' } },
                    labels: { style: { color: '#ef4444' } },
                    opposite: true // Lo pone a la derecha
                }],
                tooltip: { shared: true },
                legend: { itemStyle: { color: '#ffffff' } },
                series: [{
                    name: 'Consumo Total Alcohol',
                    type: 'column',
                    yAxis: 0,
                    data: datosAlcohol,
                    color: '#38bdf8'
                }, {
                    name: 'Meteoritos Caídos',
                    type: 'spline',
                    yAxis: 1,
                    data: datosMeteoritos,
                    color: '#ef4444',
                    marker: { lineWidth: 2, lineColor: '#ef4444', fillColor: '#ffffff' }
                }]
            });

        } catch (e) {
            console.error("Error capturado:", e);
            message = e.message;
        }
    });
</script>

<main>
    <div class="header-nav">
        <a href="/integrations" class="back-btn">⬅ Volver al Panel</a>
    </div>

    <div class="card">
        {#if message}
            <p class="status-msg">{message}</p>
        {/if}

        <div class="chart-box" class:hidden={!!message}>
            <div bind:this={chartContainer} style="width:100%; height:500px;"></div>
        </div>
    </div>
</main>

<style>
    :global(body) { background: #0f172a; color: white; margin: 0; font-family: 'Segoe UI', sans-serif; }
    main { padding: 2rem; max-width: 1100px; margin: auto; }
    .header-nav { margin-bottom: 2rem; }
    .back-btn { color: #38bdf8; text-decoration: none; font-weight: bold; border: 1px solid #38bdf8; padding: 0.5rem 1rem; border-radius: 8px; transition: 0.3s; }
    .back-btn:hover { background: rgba(56, 189, 248, 0.2); }
    .card { background: #1e293b; padding: 1rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
    .status-msg { color: #facc15; font-size: 1.2rem; text-align: center; border: 2px dashed #facc15; padding: 1rem; border-radius: 8px; }
    .hidden { display: none; }
</style>