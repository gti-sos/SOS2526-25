<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Cargando nueva librería (ApexCharts)...");
    let chartContainer;
    let isLoading = $state(true);

    async function safeJson(res) {
        try { return res.ok ? await res.json() : []; } catch { return []; }
    }

    onMount(async () => {
        if (!browser) return;

        try {
            // Importamos la nueva librería ApexCharts
            const ApexCharts = (await import('apexcharts')).default;

            const resMis = await fetch("/api/v2/international-tourist-arrivals");
            const misDatos = await safeJson(resMis);

            const resCompi = await fetch("https://sos2526-11.onrender.com/api/v2/road-fatalities");
            const compiDatos = await safeJson(resCompi);

            if (misDatos.length === 0 || compiDatos.length === 0) {
                message = "⚠️ Error al conectar con las APIs.";
                isLoading = false; return;
            }

            const traductor = {
                "spain": "espana", "germany": "alemania", "india": "india",
                "italy": "italia", "mexico": "mexico", "france": "francia",
                "thailand": "tailandia", "japan": "japon", "nepal": "nepal",
                "sri lanka": "sri lanka"
            };

            const roadsMap = new Map();
            compiDatos.forEach(item => {
                if (item.nation) {
                    let pais = item.nation.toLowerCase().trim();
                    let muertes = item.total_death || 0;
                    if (!roadsMap.has(pais)) roadsMap.set(pais, muertes);
                }
            });

            // Agrupamos para evitar duplicados
            const paisesUnicos = new Map();
            misDatos.forEach(d => {
                let nombrePais = d.country;
                let paisKey = nombrePais.toLowerCase().trim();
                let paisBusqueda = traductor[paisKey] || paisKey;
                let muertes = roadsMap.get(paisKey) || roadsMap.get(paisBusqueda);

                if (muertes !== undefined) {
                    if (!paisesUnicos.has(nombrePais)) {
                        paisesUnicos.set(nombrePais, {
                            value: muertes,
                            name: nombrePais,
                            myTourists: d.air_arrival || 0
                        });
                    } else {
                        let datosGuardados = paisesUnicos.get(nombrePais);
                        datosGuardados.myTourists += (d.air_arrival || 0);
                    }
                }
            });

            let chartData = Array.from(paisesUnicos.values()).slice(0, 10);

            if (chartData.length === 0) {
                message = "⚠️ No hay coincidencias de países.";
                isLoading = false; return;
            }

            // Preparamos las 3 listas de datos que necesita el gráfico mixto
            let labels = chartData.map(d => d.name);
            let seriesTuristas = chartData.map(d => d.myTourists);
            let seriesMuertes = chartData.map(d => d.value);
            
            isLoading = false;
            message = "";

            // Configuración de ApexCharts (Gráfico Mixto con Doble Eje)
            const options = {
                series: [
                    { name: 'Tus Turistas', type: 'column', data: seriesTuristas },
                    { name: 'Fallecidos Tráfico', type: 'line', data: seriesMuertes }
                ],
                chart: {
                    height: 500,
                    type: 'line',
                    background: 'transparent',
                    toolbar: { show: false },
                    fontFamily: 'Segoe UI, sans-serif'
                },
                stroke: {
                    width: [0, 4], // 0 grosor para las columnas, 4 para la línea
                    curve: 'smooth'
                },
                colors: ['#38bdf8', '#f43f5e'], // Azul neón para turistas, Rosa neón para muertes
                theme: { mode: 'dark' },
                dataLabels: {
                    enabled: true,
                    enabledOnSeries: [1], // Solo mostrar los números encima de la línea roja
                    background: { foreColor: '#0f172a', borderRadius: 4, padding: 4 }
                },
                labels: labels,
                xaxis: {
                    type: 'category',
                    labels: { style: { colors: '#cbd5e1', fontSize: '13px' } },
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                },
                yaxis: [
                    {
                        // Eje Y Izquierdo (Turistas)
                        title: { text: 'Nº de Turistas', style: { color: '#38bdf8', fontSize: '14px', fontWeight: 600 } },
                        labels: { style: { colors: '#38bdf8' } }
                    },
                    {
                        // Eje Y Derecho (Muertes)
                        opposite: true,
                        title: { text: 'Fallecidos (SOS-11)', style: { color: '#f43f5e', fontSize: '14px', fontWeight: 600 } },
                        labels: { style: { colors: '#f43f5e' } }
                    }
                ],
                legend: {
                    position: 'top',
                    horizontalAlign: 'center',
                    fontSize: '15px',
                    markers: { radius: 12 }
                },
                grid: {
                    borderColor: '#334155',
                    strokeDashArray: 4, // Líneas de fondo punteadas
                    padding: { top: 10, bottom: 10 }
                }
            };

            const chart = new ApexCharts(chartContainer, options);
            chart.render();

        } catch (error) {
            message = "Error en la carga de ApexCharts.";
            isLoading = false;
        }
    });
</script>

<main>
    <div class="header-nav">
        <a href="/integrations/aimar" class="back-btn">⬅ Volver a Integraciones Aimar</a>
    </div>

    <div class="card">
        <div class="top-bar">
            <h2>📊 Seguridad Vial vs Turistas (ApexCharts)</h2>
            <p class="desc">Gráfico Mixto con doble escala: Barras (Eje izquierdo) y Línea (Eje derecho).</p>
        </div>

        {#if isLoading}
            <div class="loading-state"><span class="spinner">⏳ {message}</span></div>
        {:else if message}
            <p class="status-msg">{message}</p>
        {/if}

        <div class="chart-box" class:hidden={isLoading || !!message}>
            <div bind:this={chartContainer} style="width: 100%;"></div>
        </div>
    </div>
</main>

<style>
    :global(body) { background: #0f172a; color: white; margin: 0; font-family: 'Segoe UI', sans-serif; }
    main { padding: 2rem; max-width: 1100px; margin: auto; }
    .header-nav { margin-bottom: 2rem; }
    .back-btn { color: #38bdf8; text-decoration: none; font-weight: bold; border: 1px solid #38bdf8; padding: 0.5rem 1rem; border-radius: 8px; transition: 0.3s; }
    .back-btn:hover { background: rgba(56, 189, 248, 0.2); }
    .card { background: #1e293b; padding: 2rem; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); border: 1px solid #334155;}
    .top-bar h2 { margin: 0 0 0.5rem 0; color: #38bdf8; }
    .desc { color: #94a3b8; margin-top: 0; margin-bottom: 2rem; }
    .loading-state { text-align: center; padding: 3rem; }
    .spinner { color: #facc15; font-size: 1.2rem; animation: pulse 1.5s infinite; font-weight: bold; }
    .status-msg { color: #ef4444; font-size: 1.2rem; text-align: center; padding: 1rem; }
    .chart-box { background: #0b1120; border-radius: 16px; padding: 1.5rem; border: 1px solid #334155; }
    .hidden { display: none !important; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>