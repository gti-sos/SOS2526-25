<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment'; 

    let message = $state("Cargando tu base de datos...");
    let chartContainer;
    let chart; 
    let misDatosBase = $state([]);
    
    let selectedCountry = $state("");
    let numeroUniversidades = $state("...");
    let cuotaCerveza = $state(0);
    let isLoading = $state(false);

    let bbModule; 
    let gaugeModule; 

    async function safeJson(res) {
        try { return res.ok ? await res.json() : []; } catch { return []; }
    }

    onMount(async () => {
        if (!browser) return; 

        try {
            const billboard = await import('billboard.js');
            bbModule = billboard.default || billboard.bb; 
            gaugeModule = billboard.gauge; 

            // 2. Traemos tus datos
            const resMis = await fetch("/api/v2/social-drinking-behaviors");
            const datos = await safeJson(resMis);

            if (datos.length === 0) {
                message = "⚠️ No hay datos en tu API.";
                return;
            }

            let mapPaises = new Map();
            datos.forEach(d => mapPaises.set(d.country, d.beer_share));

            misDatosBase = Array.from(mapPaises, ([country, beer_share]) => ({ country, beer_share }))
                                .sort((a, b) => a.country.localeCompare(b.country));

            message = "";
            
            if (misDatosBase.length > 0) {
                selectedCountry = misDatosBase[0].country;
            }

        } catch (error) {
            console.error("Error inicial:", error);
            message = "Error al cargar los datos base.";
        }
    });

    $effect(() => {
        if (browser && selectedCountry && bbModule && gaugeModule) {
            cargarDatosUniversidadesYDibujar();
        }
    });

    async function cargarDatosUniversidadesYDibujar() {
        isLoading = true;
        numeroUniversidades = "Buscando...";

        const paisData = misDatosBase.find(d => d.country === selectedCountry);
        cuotaCerveza = paisData ? Number(paisData.beer_share) || 0 : 0;

        try {
            const resUni = await fetch(`http://universities.hipolabs.com/search?country=${selectedCountry}`);
            const uniDatos = await safeJson(resUni);

            numeroUniversidades = uniDatos.length;

            if (chart) {
                chart.load({
                    columns: [["Cerveza (%)", cuotaCerveza]]
                });
            } else {
                chart = bbModule.generate({
                    data: {
                        columns: [["Cerveza (%)", cuotaCerveza]],
                        // ¡LA MAGIA AQUÍ! Usamos la función importada en lugar del texto
                        type: gaugeModule() 
                    },
                    gauge: {
                        label: { format: function(value) { return value.toFixed(1) + "%"; } },
                        min: 0,
                        max: 100,
                        units: " de Cuota"
                    },
                    color: {
                        pattern: ["#10b981", "#facc15", "#f97316", "#ef4444"], 
                        threshold: { values: [20, 40, 60, 80] }
                    },
                    size: { height: 250 },
                    bindto: chartContainer
                });
            }
        } catch (error) {
            console.error("Error al cruzar datos:", error);
            numeroUniversidades = "Error API";
        } finally {
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <!-- Cargamos el CSS de la librería por CDN en el head. 
         Así nos saltamos cualquier problema de Vite con los archivos CSS locales -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/billboard.js/dist/billboard.min.css" />
</svelte:head>

<main>
    <div class="header-nav">
        <a href="/integrations/juan-luis" class="back-btn">⬅ Volver a Integraciones Juan Luis</a>
    </div>

    <div class="card">
        <div class="top-bar">
            <h2>🎓 Consumo vs Universidades (Billboard.js)</h2>
            <p class="desc">
                Cruce en tiempo real usando la <strong>Hipolabs Universities API</strong> pública. 
            </p>
        </div>

        {#if message}
            <p class="status-msg">{message}</p>
        {:else}
            <div class="selector-container">
                <label for="countrySelect">Selecciona un país a analizar:</label>
                <select id="countrySelect" bind:value={selectedCountry} disabled={isLoading}>
                    {#each misDatosBase as pais}
                        <option value={pais.country}>{pais.country}</option>
                    {/each}
                </select>
                {#if isLoading}
                    <span class="spinner">⏳ Consultando Hipolabs API...</span>
                {/if}
            </div>

            <div class="dashboard-panel">
                <div class="widget-col">
                    <h3>Velocímetro de Consumo</h3>
                    <div bind:this={chartContainer}></div>
                </div>

                <div class="info-col">
                    <div class="info-box">
                        <h3>Campus Universitarios</h3>
                        <div class="big-number" class:pulse={isLoading}>
                            {numeroUniversidades}
                        </div>
                        <p class="subtext">Universidades registradas activas en {selectedCountry}</p>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</main>

<style>
    :global(body) { background: #0f172a; color: white; margin: 0; font-family: 'Segoe UI', sans-serif; }
    main { padding: 2rem; max-width: 900px; margin: auto; }
    .header-nav { margin-bottom: 2rem; }
    
    .back-btn { color: #10b981; text-decoration: none; font-weight: bold; border: 1px solid #10b981; padding: 0.5rem 1rem; border-radius: 8px; transition: 0.3s; }
    .back-btn:hover { background: rgba(16, 185, 129, 0.2); }
    
    .card { background: #1e293b; padding: 2rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); border: 1px solid #334155;}
    
    .top-bar h2 { margin: 0 0 0.5rem 0; color: #10b981; }
    .desc { color: #94a3b8; margin-top: 0; margin-bottom: 1.5rem; }

    .selector-container { background: #0b1120; padding: 1.5rem; border-radius: 12px; border: 1px solid #334155; margin-bottom: 2rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .selector-container label { color: #cbd5e1; font-weight: bold; }
    select { background: #1e293b; color: #10b981; border: 1px solid #10b981; padding: 0.6rem 1rem; border-radius: 8px; font-size: 1rem; cursor: pointer; outline: none; }
    .spinner { color: #facc15; font-size: 0.9rem; animation: blink 1s infinite; }

    .dashboard-panel { display: flex; gap: 2rem; flex-wrap: wrap; }
    .widget-col { flex: 1; min-width: 300px; background: #0b1120; padding: 1.5rem; border-radius: 15px; border: 1px solid #334155; text-align: center; }
    .widget-col h3 { margin-top: 0; color: #94a3b8; }

    .info-col { flex: 1; min-width: 300px; display: flex; flex-direction: column; justify-content: center; }
    .info-box { background: linear-gradient(145deg, #1e293b, #0b1120); padding: 2rem; border-radius: 15px; border: 1px solid #38bdf8; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; }
    .info-box h3 { margin-top: 0; color: #38bdf8; font-size: 1.4rem; }
    
    .big-number { font-size: 5rem; font-weight: bold; color: #ffffff; text-shadow: 0 0 20px rgba(56, 189, 248, 0.5); margin: 1rem 0; }
    .pulse { opacity: 0.5; }
    .subtext { color: #94a3b8; margin: 0; }

    @keyframes blink { 50% { opacity: 0.5; } }

    /* Forzamos a Billboard.js a verse bien en modo oscuro */
    :global(.bb-gauge-value) { fill: #ffffff !important; font-weight: bold; }
    :global(.bb-chart-arcs-background) { fill: #334155 !important; }
    :global(.bb-text) { fill: #cbd5e1 !important; }
</style>