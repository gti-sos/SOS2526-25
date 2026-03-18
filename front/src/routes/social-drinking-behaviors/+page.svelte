<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation'; // Para navegar a la página de edición

    let drinks = $state([]);
    let newEntry = $state({ country: "", year: "", total_liter: "", beer_share: "", wine_share: "", spirit_share: "" });
    let message = $state(""); 

    const API_URL = "/api/v1/social-drinking-behaviors";

    onMount(async () => {
        await getDrinks();
    });

    async function getDrinks() {
        try {
            const res = await fetch(API_URL);
            if (res.ok) drinks = await res.json();
            else message = "⚠️ Error al cargar los datos.";
        } catch (error) { message = "⚠️ Error de red."; }
    }

    async function addDrink() {
        const dataToSend = {
            country: newEntry.country,
            year: parseInt(newEntry.year),
            total_liter: parseFloat(newEntry.total_liter),
            beer_share: parseFloat(newEntry.beer_share),
            wine_share: parseFloat(newEntry.wine_share),
            spirit_share: parseFloat(newEntry.spirit_share)
        };

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSend)
            });

            if (res.status === 201) {
                message = "✅ Dato añadido correctamente.";
                await getDrinks();
                newEntry = { country: "", year: "", total_liter: "", beer_share: "", wine_share: "", spirit_share: "" };
            } else if (res.status === 409) {
                message = "❌ Error: Ese país y año ya existen.";
            } else {
                message = "❌ Error al guardar el dato.";
            }
        } catch (error) { message = "⚠️ Error de red."; }
    }

    async function deleteDrink(country, year) {
        if (!confirm(`¿Borrar los datos de ${country} en ${year}?`)) return;
        try {
            const res = await fetch(`${API_URL}/${country}/${year}`, { method: "DELETE" });
            if (res.ok) {
                message = "🗑️ Recurso borrado con éxito.";
                await getDrinks();
            } else message = "❌ Error al borrar.";
        } catch (error) { message = "⚠️ Error de red."; }
    }

    // --- NUEVOS BOTONES GLOBALES ---

    async function loadInitialData() {
        try {
            // Nota: Revisa si en tu Back-End la ruta es GET o POST para loadInitialData
            const res = await fetch(`${API_URL}/loadInitialData`, { method: "GET" });
            if (res.ok) {
                message = "🔄 Datos iniciales cargados.";
                await getDrinks();
            } else {
                message = "⚠️ No se pudieron cargar los datos iniciales.";
            }
        } catch (error) { message = "⚠️ Error de red."; }
    }

    async function deleteAll() {
        if (!confirm("⚠️ ¿Estás SEGURO de que quieres borrar TODOS los datos?")) return;
        try {
            const res = await fetch(API_URL, { method: "DELETE" });
            if (res.ok) {
                message = "💥 Todos los datos han sido borrados.";
                await getDrinks();
            } else {
                message = "❌ Error al borrar todos los datos.";
            }
        } catch (error) { message = "⚠️ Error de red."; }
    }
</script>

<main>
    <a href="/" class="back-btn">⬅ Volver al Inicio</a>
    <h2>🍺 Social Drinking Behaviors (Juanlu)</h2>

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="global-actions">
        <button class="btn-load" on:click={loadInitialData}>🔄 Cargar Datos Iniciales</button>
        <button class="btn-delete-all" on:click={deleteAll}>🗑️ Borrar Todo</button>
    </div>

    <div class="card form-container">
        <h3>Añadir nuevo registro</h3>
        <form on:submit|preventDefault={addDrink}>
            <div class="input-group">
                <input type="text" placeholder="País" bind:value={newEntry.country} required>
                <input type="number" placeholder="Año" bind:value={newEntry.year} required>
                <input type="number" step="0.1" placeholder="L. Totales" bind:value={newEntry.total_liter} required>
                <input type="number" step="0.1" placeholder="% Cerveza" bind:value={newEntry.beer_share} required>
                <input type="number" step="0.1" placeholder="% Vino" bind:value={newEntry.wine_share} required>
                <input type="number" step="0.1" placeholder="% Licores" bind:value={newEntry.spirit_share} required>
                <button type="submit" class="btn-add">Añadir</button>
            </div>
        </form>
    </div>

    <div class="card table-container">
        <table>
            <thead>
                <tr>
                    <th>País</th><th>Año</th><th>L. Totales</th><th>% Cerveza</th><th>% Vino</th><th>% Licores</th><th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {#if drinks.length === 0}
                    <tr><td colspan="7" class="text-center">No hay datos.</td></tr>
                {/if}
                
                {#each drinks as drink}
                    <tr>
                        <td>{drink.country}</td><td>{drink.year}</td><td>{drink.total_liter}</td>
                        <td>{drink.beer_share}</td><td>{drink.wine_share}</td><td>{drink.spirit_share}</td>
                        <td>
                            <button class="btn-edit" on:click={() => goto(`/social-drinking-behaviors/${drink.country}/${drink.year}`)}>Editar</button>
                            <button class="btn-delete" on:click={() => deleteDrink(drink.country, drink.year)}>Borrar</button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</main>

<style>
    :global(body) { margin: 0; background-color: #0f172a; color: white; font-family: sans-serif; }
    main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h2 { text-align: center; margin-bottom: 2rem; color: #00f2fe; }
    .back-btn { display: inline-block; margin-bottom: 1rem; color: #94a3b8; text-decoration: none; font-weight: bold; }
    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 1.5rem; margin-bottom: 2rem; backdrop-filter: blur(10px); }
    .alert { background: rgba(0, 242, 254, 0.2); border-left: 4px solid #00f2fe; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; }
    .input-group { display: flex; flex-wrap: wrap; gap: 1rem; }
    input { flex: 1 1 120px; padding: 0.8rem; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(0, 0, 0, 0.3); color: white; }
    .btn-add { background: #00f2fe; color: #000; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: bold; }
    
    /* Estilos nuevos para los botones globales */
    .global-actions { display: flex; gap: 1rem; margin-bottom: 1.5rem; justify-content: flex-end; }
    .btn-load { background: #4facfe; color: black; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: bold; }
    .btn-delete-all { background: #ff5252; color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: bold; }

    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 1rem; text-align: left; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
    th { color: #00f2fe; font-weight: bold; }
    .text-center { text-align: center; color: #94a3b8; }
    .btn-delete { background: rgba(255, 50, 50, 0.2); color: #ff5252; border: 1px solid #ff5252; padding: 0.4rem 0.8rem; border-radius: 5px; cursor: pointer; }
    .btn-edit { background: rgba(255, 193, 7, 0.2); color: #ffc107; border: 1px solid #ffc107; padding: 0.4rem 0.8rem; border-radius: 5px; cursor: pointer; margin-right: 0.5rem; }
</style>