<script>
    import { page } from '$app/stores'; 
    import { goto } from '$app/navigation';

    let countryUrl = $derived($page.params.country);
    let yearUrl = $derived($page.params.year);
    
    // Apuntamos a la V2
    let API_URL = $derived(`/api/v2/average-annual-temperatures/${countryUrl}/${yearUrl}`);

    let temp = $state({
        country: "", year: "", co2_emission: "", precipitation: "", temperature: ""
    });

    let message = $state("");
    let dataFound = $state(false); 

    $effect(() => {
        async function getTemperature() {
            try {
                const res = await fetch(API_URL);
                if (res.ok) {
                    temp = await res.json();
                    dataFound = true;
                    message = ""; 
                } else if (res.status === 404) {
                    message = `⚠️ No existe un registro de Temperaturas para '${countryUrl}' en el año ${yearUrl}.`;
                    dataFound = false;
                } else {
                    message = "⚠️ Error al cargar los datos en la vista de edición.";
                    dataFound = false;
                }
            } catch (error) { 
                message = "⚠️ Error de red al conectar con el servidor."; 
                dataFound = false;
            }
        }
        getTemperature();
    });

    async function updateTemperature(event) {
        event.preventDefault(); 
        const dataToSend = {
            country: temp.country, 
            year: parseInt(temp.year), 
            co2_emission: parseFloat(temp.co2_emission),
            precipitation: parseFloat(temp.precipitation), 
            temperature: parseFloat(temp.temperature)
        };

        try {
            const res = await fetch(API_URL, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSend)
            });

            if (res.status === 200) {
                message = "✅ Dato actualizado correctamente. Volviendo a la tabla...";
                setTimeout(() => { goto('/average-annual-temperatures'); }, 1500);
            } else if (res.status === 404) {
                message = `❌ No se puede actualizar: El registro no existe en la base de datos.`;
            } else if (res.status === 400) {
                message = "❌ Error al actualizar: Los datos proporcionados no tienen un formato válido.";
            } else {
                message = "❌ Error inesperado al intentar guardar los cambios.";
            }
        } catch (error) { message = "⚠️ Error de conexión."; }
    }
</script>

<main>
    <button class="back-btn" onclick={() => goto('/average-annual-temperatures')}>⬅ Volver a la tabla</button>
    
    <h2>✏️ Editando: {countryUrl} ({yearUrl})</h2>

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    {#if dataFound}
        <div class="card form-container">
            <form onsubmit={updateTemperature}>
                <div class="input-group">
                    <div class="field"><label>País</label><input type="text" bind:value={temp.country} disabled></div>
                    <div class="field"><label>Año</label><input type="text" bind:value={temp.year} disabled></div>
                    <div class="field"><label>Emisiones CO2</label><input type="number" step="0.01" bind:value={temp.co2_emission} required></div>
                    <div class="field"><label>Precipitación</label><input type="number" step="0.01" bind:value={temp.precipitation} required></div>
                    <div class="field"><label>Temperatura</label><input type="number" step="0.01" bind:value={temp.temperature} required></div>
                </div>
                
                <div class="actions">
                    <button type="submit" class="btn-update">💾 Guardar Cambios</button>
                </div>
            </form>
        </div>
    {/if}
</main>

<style>
    :global(body) { margin: 0; background-color: #0f172a; color: white; font-family: sans-serif; }
    main { max-width: 800px; margin: 0 auto; padding: 2rem; color: white; }
    h2 { text-align: center; margin-bottom: 2rem; color: #ffc107; }
    .back-btn { background: none; border: none; color: #94a3b8; text-decoration: none; font-weight: bold; cursor: pointer; font-size: 1rem; margin-bottom: 1rem;}
    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 2rem; }
    .alert { background: rgba(255, 193, 7, 0.2); border-left: 4px solid #ffc107; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; color: white;}
    .input-group { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
    .field { display: flex; flex-direction: column; gap: 0.5rem; }
    label { color: #00f2fe; font-weight: bold; font-size: 0.9rem; }
    input { padding: 0.8rem; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(0, 0, 0, 0.3); color: white; font-size: 1rem;}
    input:disabled { opacity: 0.5; cursor: not-allowed; }
    .actions { display: flex; justify-content: center; }
    .btn-update { background: #ffc107; color: #000; border: none; padding: 1rem 2rem; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1.1rem; transition: transform 0.2s; }
    .btn-update:hover { transform: scale(1.05); }
</style>