<script>
    import { onMount } from 'svelte';

    // 1. Usamos $state() para que SvelteKit 5 actualice la pantalla cuando cambien
    let temperatures = $state([]);
    let newEntry = $state({ country: "", year: "", co2_emission: "", precipitation: "", temperature: "" });
    let message = $state(""); 
    
    // Variables para el PUT (Edición)
    let isEditing = $state(false);
    let originalCountry = $state("");
    let originalYear = $state("");

    const API_URL = "/api/v1/average-annual-temperatures";

    onMount(async () => {
        await getTemperatures();
    });

    async function getTemperatures() {
        try {
            const res = await fetch(API_URL);
            if (res.ok) temperatures = await res.json();
            else message = "⚠️ Error al cargar los datos.";
        } catch (error) { message = "⚠️ Error de red."; }
    }

    // Función unificada para POST y PUT
    async function handleSubmit() {
        const dataToSend = {
            country: newEntry.country,
            year: parseInt(newEntry.year),
            co2_emission: parseFloat(newEntry.co2_emission),
            precipitation: parseFloat(newEntry.precipitation),
            temperature: parseFloat(newEntry.temperature)
        };

        try {
            let res;
            if (isEditing) {
                res = await fetch(`${API_URL}/${originalCountry}/${originalYear}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(dataToSend)
                });
            } else {
                res = await fetch(API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(dataToSend)
                });
            }

            if (res.status === 201 || res.status === 200) {
                message = isEditing ? "✅ Dato actualizado correctamente." : "✅ Dato añadido correctamente.";
                await getTemperatures();
                cancelEdit();
            } else if (res.status === 409) {
                message = "❌ Error: Ese país y año ya existen.";
            } else {
                message = "❌ Error al guardar el dato. Revisa los campos.";
            }
        } catch (error) { message = "⚠️ Error de red."; }
    }

    function editTemperature(temp) {
        newEntry = { ...temp };
        originalCountry = temp.country;
        originalYear = temp.year;
        isEditing = true;
        message = "✏️ Modo edición. Cambia los datos y pulsa Actualizar.";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function cancelEdit() {
        newEntry = { country: "", year: "", co2_emission: "", precipitation: "", temperature: "" };
        isEditing = false;
        originalCountry = "";
        originalYear = "";
    }

    async function deleteTemperature(country, year) {
        if (!confirm(`¿Borrar los datos de ${country} en ${year}?`)) return;
        try {
            const res = await fetch(`${API_URL}/${country}/${year}`, { method: "DELETE" });
            if (res.ok) {
                message = "🗑️ Recurso borrado con éxito.";
                await getTemperatures();
            } else message = "❌ Error al borrar.";
        } catch (error) { message = "⚠️ Error de red."; }
    }
</script>

<main>
    <a href="/" class="back-btn">⬅ Volver al Inicio</a>
    
    <h2>📊 Average Annual Temperatures (Pablo Seco)</h2>

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="card form-container">
        <h3>{isEditing ? 'Actualizar registro' : 'Añadir nuevo registro'}</h3>
        <form on:submit|preventDefault={handleSubmit}>
            <div class="input-group">
                <input type="text" placeholder="País (Country)" bind:value={newEntry.country} required disabled={isEditing}>
                <input type="number" placeholder="Año (Year)" bind:value={newEntry.year} required disabled={isEditing}>
                <input type="number" step="0.01" placeholder="Emisiones CO2" bind:value={newEntry.co2_emission} required>
                <input type="number" step="0.01" placeholder="Precipitación" bind:value={newEntry.precipitation} required>
                <input type="number" step="0.01" placeholder="Temperatura" bind:value={newEntry.temperature} required>
                
                <button type="submit" class="btn-add">{isEditing ? 'Actualizar' : 'Añadir'}</button>
                {#if isEditing}
                    <button type="button" class="btn-cancel" on:click={cancelEdit}>Cancelar</button>
                {/if}
            </div>
        </form>
    </div>

    <div class="card table-container">
        <table>
            <thead>
                <tr>
                    <th>País</th>
                    <th>Año</th>
                    <th>Emisiones CO2</th>
                    <th>Precipitación</th>
                    <th>Temperatura</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {#if temperatures.length === 0}
                    <tr><td colspan="6" class="text-center">No hay datos.</td></tr>
                {/if}
                
                {#each temperatures as temp}
                    <tr>
                        <td>{temp.country}</td>
                        <td>{temp.year}</td>
                        <td>{temp.co2_emission}</td>
                        <td>{temp.precipitation}</td>
                        <td>{temp.temperature}</td>
                        <td>
                            <button class="btn-edit" on:click={() => editTemperature(temp)}>Editar</button>
                            <button class="btn-delete" on:click={() => deleteTemperature(temp.country, temp.year)}>Borrar</button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</main>

<style>
    /* Aplicamos global body color para que no tenga bordes blancos extraños */
    :global(body) {
        margin: 0;
        background-color: #0f172a;
        color: white;
        font-family: sans-serif;
    }
    
    main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h2 { text-align: center; margin-bottom: 2rem; color: #00f2fe; }
    
    .back-btn { display: inline-block; margin-bottom: 1rem; color: #94a3b8; text-decoration: none; font-weight: bold; transition: color 0.3s; }
    .back-btn:hover { color: #fff; }

    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 1.5rem; margin-bottom: 2rem; backdrop-filter: blur(10px); }
    .alert { background: rgba(0, 242, 254, 0.2); border-left: 4px solid #00f2fe; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; }

    .input-group { display: flex; flex-wrap: wrap; gap: 1rem; }
    input { flex: 1 1 150px; padding: 0.8rem; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(0, 0, 0, 0.3); color: white; }
    input:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .btn-add { background: #00f2fe; color: #000; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: bold; }
    
    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 1rem; text-align: left; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
    th { color: #00f2fe; font-weight: bold; }
    tr:hover { background: rgba(255, 255, 255, 0.05); }
    .text-center { text-align: center; color: #94a3b8; }
    
    .btn-delete { background: rgba(255, 50, 50, 0.2); color: #ff5252; border: 1px solid #ff5252; padding: 0.4rem 0.8rem; border-radius: 5px; cursor: pointer; }
    .btn-delete:hover { background: #ff5252; color: white; }

    .btn-edit { background: rgba(255, 193, 7, 0.2); color: #ffc107; border: 1px solid #ffc107; padding: 0.4rem 0.8rem; border-radius: 5px; cursor: pointer; margin-right: 0.5rem; }
    .btn-edit:hover { background: #ffc107; color: #000; }

    .btn-cancel { background: transparent; color: #94a3b8; border: 1px solid #94a3b8; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; }
    .btn-cancel:hover { background: rgba(148, 163, 184, 0.2); }
</style>