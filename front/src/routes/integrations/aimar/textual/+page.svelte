<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let message = $state("Cruzando turistas con datos de probabilidad nacional...");
    let results = $state([]);
    let isLoading = $state(true);

    async function safeJson(res) {
        try { return res.ok ? await res.json() : null; } catch { return null; }
    }

    onMount(async () => {
        if (!browser) return;

        try {
            // 1. Tus datos (Ruta absoluta a Render)
            const resMis = await fetch("https://sos2526-25.onrender.com/api/v2/international-tourist-arrivals");
            const misDatos = await safeJson(resMis);

            if (!misDatos || misDatos.length === 0) {
                message = "⚠️ No hay datos de turistas disponibles.";
                isLoading = false; return;
            }

            const unicos = new Map();
            misDatos.forEach(d => {
                let p = String(d.country || "").trim();
                let t = Number(d.air_arrival) || Number(d.arrivals_air) || 0;
                if (!unicos.has(p)) unicos.set(p, t);
                else unicos.set(p, unicos.get(p) + t);
            });

            const cruce = [];
            const listaPaises = Array.from(unicos.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6);

            for (const [pais, turistas] of listaPaises) {
                // 2. API EXTERNA: Nationalize.io (¡SIN PROXY Y SIN CORS!)
                // Analizamos la "nacionalidad" del nombre del país
                const resExt = await fetch(`https://api.nationalize.io/?name=${pais.toLowerCase()}`);
                const dataExt = await safeJson(resExt);

                if (dataExt && dataExt.country && dataExt.country.length > 0) {
                    // Cogemos la probabilidad más alta
                    const topProb = dataExt.country[0];
                    cruce.push({
                        pais: pais,
                        turistas: turistas,
                        probabilidad: (topProb.probability * 100).toFixed(1),
                        codigoIso: topProb.country_id
                    });
                } else {
                    cruce.push({
                        pais: pais,
                        turistas: turistas,
                        probabilidad: "N/A",
                        codigoIso: "--"
                    });
                }
            }

            results = cruce;
            isLoading = false;
            message = results.length === 0 ? "⚠️ Error al cruzar datos." : "";

        } catch (e) {
            console.error(e);
            message = "Error conectando con la API externa.";
            isLoading = false;
        }
    });
</script>

<main>
    <div class="header-nav">
        <a href="/integrations/aimar" class="back-btn">⬅ Volver al Panel</a>
    </div>

    <div class="card">
        <div class="top-bar">
            <h2>🆔 Análisis: Turismo vs Predicción de Origen</h2>
            <p class="desc">Cruce con <strong>Nationalize.io</strong>. Probabilidad de que el nombre del país sea detectado como origen propio.</p>
        </div>

        {#if isLoading}
            <div class="loading-state">
                <span class="spinner">🆔</span>
                <p>{message}</p>
            </div>
        {:else if message}
            <div class="error-msg">{message}</div>
        {:else}
            <div class="text-grid">
                {#each results as item}
                    <div class="text-item">
                        <div class="pais-header">
                            <span class="pais-name">{item.pais}</span>
                        </div>
                        <div class="stats">
                            <div class="stat-row">
                                <span class="label">🛬 Turistas:</span>
                                <span class="value">{item.turistas.toLocaleString()}</span>
                            </div>
                            <div class="stat-row">
                                <span class="label">🎯 Prob. Nombre:</span>
                                <span class="value highlight">{item.probabilidad}%</span>
                            </div>
                            <div class="example-box">
                                <span class="small-label">Código ISO Sugerido:</span>
                                <p class="capital-name">Origen: {item.codigoIso}</p>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</main>

<style>
    :global(body) { background: #0f172a; color: white; margin: 0; font-family: 'Segoe UI', sans-serif; }
    main { padding: 2rem; max-width: 1000px; margin: auto; }
    .card { background: #1e293b; padding: 2.5rem; border-radius: 24px; border: 1px solid #334155; }
    .top-bar h2 { color: #38bdf8; margin: 0; font-size: 1.8rem; }
    .desc { color: #94a3b8; margin-bottom: 2.5rem; }
    
    .text-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
    .text-item { background: #0b1120; padding: 1.5rem; border-radius: 16px; border: 1px solid #334155; }
    
    .pais-header { border-bottom: 1px solid #1e293b; padding-bottom: 0.8rem; margin-bottom: 1rem; }
    .pais-name { font-size: 1.4rem; font-weight: bold; color: #f8fafc; }
    
    .stat-row { display: flex; justify-content: space-between; margin: 0.8rem 0; }
    .label { color: #94a3b8; }
    .value { font-weight: bold; }
    .highlight { color: #facc15; font-size: 1.2rem; }
    
    .example-box { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px dashed #334155; }
    .small-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; }
    .capital-name { font-size: 0.9rem; color: #cbd5e1; font-style: italic; margin-top: 0.3rem; }

    .loading-state { text-align: center; padding: 5rem; color: #38bdf8; }
    .spinner { font-size: 3rem; display: inline-block; animation: pulse 1.5s infinite; }
    .error-msg { color: #ef4444; text-align: center; padding: 2rem; border: 1px dashed #ef4444; border-radius: 12px; }
    .back-btn { color: #38bdf8; text-decoration: none; border: 1px solid #38bdf8; padding: 0.5rem 1rem; border-radius: 8px; font-weight: bold; }
    
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>