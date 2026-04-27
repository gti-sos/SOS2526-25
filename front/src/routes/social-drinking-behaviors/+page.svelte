<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    let drinks = $state([]);
    let newEntry = $state({ country: "", year: "", total_liter: "", beer_share: "", wine_share: "", spirit_share: "" });
    
    // Filtros de búsqueda (incluyendo from y to)
    let searchParams = $state({ country: "", year: "", total_liter: "", beer_share: "", wine_share: "", spirit_share: "", from: "", to: "" });
    
    let message = $state(""); 

    // Paginación
    let offset = $state(0);
    const limit = 15; 

    const API_URL = "/api/v2/social-drinking-behaviors"; // 🚀 APUNTANDO A LA V2

    onMount(async () => {
        await loadData();
    });

    // Función unificada para cargar datos (sirve para carga normal y búsquedas)
    async function loadData() {
        const query = new URLSearchParams();
        let filtrosUsados = []; 

        if (searchParams.country) { query.append("country", searchParams.country); filtrosUsados.push(`país '${searchParams.country}'`); }
        if (searchParams.year) { query.append("year", searchParams.year); filtrosUsados.push(`año '${searchParams.year}'`); }
        if (searchParams.total_liter) { query.append("total_liter", searchParams.total_liter); filtrosUsados.push(`L. totales '${searchParams.total_liter}'`); }
        
        // 🚀 NUEVO: Conectamos los 3 filtros de bebidas al servidor
        if (searchParams.beer_share) { query.append("beer_share", searchParams.beer_share); filtrosUsados.push(`% cerveza '${searchParams.beer_share}'`); }
        if (searchParams.wine_share) { query.append("wine_share", searchParams.wine_share); filtrosUsados.push(`% vino '${searchParams.wine_share}'`); }
        if (searchParams.spirit_share) { query.append("spirit_share", searchParams.spirit_share); filtrosUsados.push(`% licores '${searchParams.spirit_share}'`); }
        
        // Rangos
        if (searchParams.from) { query.append("from", searchParams.from); filtrosUsados.push(`desde '${searchParams.from}'`); }
        if (searchParams.to) { query.append("to", searchParams.to); filtrosUsados.push(`hasta '${searchParams.to}'`); }

        // Paginación
        query.append("limit", limit);
        query.append("offset", offset);

        try {
            const res = await fetch(`${API_URL}?${query.toString()}`);
            
            if (res.ok) {
                const data = await res.json();
                if (data.length > 0) {
                    drinks = data;
                    if (filtrosUsados.length > 0) {
                        message = `✅ Búsqueda completada: Mostrando resultados.`;
                    } else {
                        // Si no hay filtros, borramos el mensaje para no molestar al paginar
                        if(message.includes("Búsqueda") || message.includes("Página")) message = ""; 
                    }
                } else {
                    if (offset > 0) {
                        message = "⚠️ No hay más datos en la siguiente página.";
                        offset -= limit; // Retrocedemos porque no hay datos
                    } else {
                        let textoFiltros = filtrosUsados.length > 0 ? filtrosUsados.join(', ') : "esos parámetros";
                        message = `⚠️ No existe un registro con ${textoFiltros}.`;
                        drinks = [];
                    }
                }
            } else if (res.status === 404) {
                let textoFiltros = filtrosUsados.length > 0 ? filtrosUsados.join(', ') : "esos parámetros";
                message = `⚠️ No existe un registro de Social Drinking con ${textoFiltros}.`;
                drinks = [];
            } else if (res.status === 400) {
                // RÚBRICA: Eliminada la referencia a "(Error 400)" para usuarios no técnicos
                message = "❌ Error: Los parámetros introducidos en la búsqueda no son válidos.";
            } else {
                message = "❌ Error al buscar los datos en el servidor.";
            }
        } catch (error) { 
            message = "⚠️ Error de conexión al intentar realizar la búsqueda."; 
        }
    }

    async function searchDrinks() {
        offset = 0; 
        await loadData();
    }

    async function clearSearch() {
        searchParams = { country: "", year: "", total_liter: "", beer_share: "", wine_share: "", spirit_share: "", from: "", to: "" };
        offset = 0;
        await loadData();
        message = "🔄 Filtros limpiados. Mostrando todos los datos.";
    }

    // Funciones de Paginación
    async function nextPage() {
        offset += limit;
        await loadData();
    }

    async function prevPage() {
        if (offset >= limit) {
            offset -= limit;
            await loadData();
        }
    }

    async function addDrink() {
        const dataToSend = {
            country: newEntry.country, year: parseInt(newEntry.year), total_liter: parseFloat(newEntry.total_liter),
            beer_share: parseFloat(newEntry.beer_share), wine_share: parseFloat(newEntry.wine_share), spirit_share: parseFloat(newEntry.spirit_share)
        };
        try {
            const res = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dataToSend) });
            if (res.status === 201) {
                message = "✅ Dato añadido correctamente.";
                offset = 0; // Volvemos al principio para ver el dato nuevo
                await loadData();
                newEntry = { country: "", year: "", total_liter: "", beer_share: "", wine_share: "", spirit_share: "" };
            } else if (res.status === 409) { message = `❌ Error: El registro del país '${newEntry.country}' en el año '${newEntry.year}' ya existe en el sistema.`; } 
            else if (res.status === 400) { message = "❌ Error: Faltan campos obligatorios o el formato de los números es incorrecto."; } 
            else { message = "❌ Error al guardar el dato en el servidor."; }
        } catch (error) { message = "⚠️ Error de conexión."; }
    }

    async function deleteDrink(country, year) {
        if (!confirm(`¿Borrar los datos de ${country} en ${year}?`)) return;
        try {
            const res = await fetch(`${API_URL}/${country}/${year}`, { method: "DELETE" });
            if (res.ok) {
                // TEST FIX: Eliminamos el dato de la tabla sin llamar a loadData() para que Playwright pueda leer el mensaje
                drinks = drinks.filter(d => d.country !== country || d.year !== year);
                message = `🗑️ Recurso borrado con éxito.`;
            } else if (res.status === 404) { message = `⚠️ No existe un registro de ${country} en el año ${year}.`; } 
            else message = "❌ Error al intentar borrar el registro.";
        } catch (error) { message = "⚠️ Error de conexión."; }
    }

    async function loadInitialData() {
        try {
            const res = await fetch(`${API_URL}/loadInitialData`, { method: "GET" });
            if (res.ok || res.status === 201) {
                message = "🔄 Datos iniciales cargados.";
                offset = 0;
                await loadData();
            } else if (res.status === 409) { message = "⚠️ Los datos iniciales ya estaban cargados en el sistema."; } 
            else { message = "⚠️ No se pudieron cargar los datos iniciales."; }
        } catch (error) { message = "⚠️ Error de conexión."; }
    }

    async function deleteAll() {
        if (!confirm("⚠️ ¿Estás SEGURO de que quieres borrar TODOS los datos?")) return;
        try {
            const res = await fetch(API_URL, { method: "DELETE" });
            if (res.ok) {
                // TEST FIX: Vaciamos el array localmente para que el mensaje no se sobreescriba
                drinks = [];
                offset = 0;
                message = "💥 Todos los datos han sido borrados";
            } else { message = "❌ Error al intentar borrar todos los datos."; }
        } catch (error) { message = "⚠️ Error de conexión."; }
    }
</script>

<main>
    <a href="/" class="back-btn">⬅ Volver al Inicio</a>
    <h2>🍺 Consumo del alcohol por paises (Juanlu)</h2>

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="global-actions">
        <button class="btn-load" onclick={loadInitialData}>🔄 Cargar Datos Iniciales</button>
        <button class="btn-delete-all" onclick={deleteAll}>🗑️ Borrar Todo</button>
    </div>

    <div class="card search-container">
        <h3>🔍 Buscar / Filtrar Registros</h3>
        <p class="subtitle">Rellena uno o varios campos para buscar combinándolos como quieras.</p>
        <form onsubmit={(e) => { e.preventDefault(); searchDrinks(); }}>
            <div class="input-group">
                <input type="text" placeholder="Buscar por País" bind:value={searchParams.country}>
                <input type="number" placeholder="Año exacto" bind:value={searchParams.year}>
                <input type="number" placeholder="Desde año (from)" bind:value={searchParams.from}>
                <input type="number" placeholder="Hasta año (to)" bind:value={searchParams.to}>
                
                <input type="number" step="0.1" placeholder="Litros exactos" bind:value={searchParams.total_liter}>
                <input type="number" step="0.1" placeholder="% Cerveza" bind:value={searchParams.beer_share}>
                <input type="number" step="0.1" placeholder="% Vino" bind:value={searchParams.wine_share}>
                <input type="number" step="0.1" placeholder="% Licores" bind:value={searchParams.spirit_share}>
                
                <button type="submit" class="btn-search">Buscar</button>
                <button type="button" class="btn-clear" onclick={clearSearch}>Limpiar Filtros</button>
            </div>
        </form>
    </div>

    <div class="card form-container">
        <h3>➕ Añadir nuevo registro</h3>
        <form onsubmit={(e) => { e.preventDefault(); addDrink(); }}>
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
                    <tr><td colspan="7" class="text-center">No hay datos para mostrar</td></tr>
                {/if}
                
                {#each drinks as drink}
                    <tr>
                        <td>{drink.country}</td><td>{drink.year}</td><td>{drink.total_liter}</td>
                        <td>{drink.beer_share}</td><td>{drink.wine_share}</td><td>{drink.spirit_share}</td>
                        <td>
                            <button class="btn-edit" onclick={() => goto(`/social-drinking-behaviors/${drink.country}/${drink.year}`)}>Editar</button>
                            <button class="btn-delete" onclick={() => deleteDrink(drink.country, drink.year)}>Borrar</button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
        
        <div class="pagination">
            <button class="btn-page" onclick={prevPage} disabled={offset === 0}>⬅ Anterior</button>
            <span class="page-info">Página {(offset / limit) + 1}</span>
            <button class="btn-page" onclick={nextPage} disabled={drinks.length < limit}>Siguiente ➡</button>
        </div>
    </div>
</main>

<style>
    /* Estilos base */
    :global(body) { margin: 0; background-color: #0f172a; color: white; font-family: sans-serif; }
    main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h2 { text-align: center; margin-bottom: 2rem; color: #00f2fe; }
    .subtitle { color: #94a3b8; font-size: 0.9rem; margin-top: -10px; margin-bottom: 15px; }
    .back-btn { display: inline-block; margin-bottom: 1rem; color: #94a3b8; text-decoration: none; font-weight: bold; }
    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 1.5rem; margin-bottom: 2rem; backdrop-filter: blur(10px); }
    .search-container { border-left: 4px solid #a855f7; }
    .alert { background: rgba(0, 242, 254, 0.2); border-left: 4px solid #00f2fe; padding: 1rem; margin-bottom: 1.5rem; border-radius: 5px; }
    .input-group { display: flex; flex-wrap: wrap; gap: 1rem; }
    input { flex: 1 1 120px; padding: 0.8rem; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(0, 0, 0, 0.3); color: white; }
    
    .btn-add { background: #00f2fe; color: #000; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: bold; }
    .btn-search { background: #a855f7; color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: bold; }
    .btn-clear { background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: bold; }
    
    .global-actions { display: flex; gap: 1rem; margin-bottom: 1.5rem; justify-content: flex-end; }
    .btn-load { background: #4facfe; color: black; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: bold; }
    .btn-delete-all { background: #ff5252; color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: bold; }

    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 1rem; text-align: left; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
    th { color: #00f2fe; font-weight: bold; }
    .text-center { text-align: center; color: #94a3b8; }
    .btn-delete { background: rgba(255, 50, 50, 0.2); color: #ff5252; border: 1px solid #ff5252; padding: 0.4rem 0.8rem; border-radius: 5px; cursor: pointer; }
    .btn-edit { background: rgba(255, 193, 7, 0.2); color: #ffc107; border: 1px solid #ffc107; padding: 0.4rem 0.8rem; border-radius: 5px; cursor: pointer; margin-right: 0.5rem; }

    /* ESTILOS DE PAGINACIÓN */
    .pagination { display: flex; justify-content: center; align-items: center; gap: 1.5rem; margin-top: 1.5rem; }
    .btn-page { background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: bold; }
    .btn-page:disabled { opacity: 0.3; cursor: not-allowed; }
    .page-info { color: #00f2fe; font-weight: bold; }
</style>