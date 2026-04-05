<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    let arrivals = $state([]);
    let newEntry = $state({ country: "", year: "", air_arrival: "", water_arrival: "", land_arrival: "" });
    
    // Filtros de búsqueda (incluyendo from y to)
    let searchParams = $state({ country: "", year: "", air_arrival: "", water_arrival: "", land_arrival: "", from: "", to: "" });
    
    let message = $state(""); 

    // Paginación
    let offset = $state(0);
    const limit = 50; 

    const API_URL = "/api/v2/international-tourist-arrivals"; // 🚀 APUNTANDO A TU V2

    onMount(async () => {
        await loadData();
    });

    // Función unificada para cargar datos (sirve para carga normal y búsquedas)
    async function loadData() {
        const query = new URLSearchParams();
        let filtrosUsados = []; 

        if (searchParams.country) { query.append("country", searchParams.country); filtrosUsados.push(`país '${searchParams.country}'`); }
        if (searchParams.year) { query.append("year", searchParams.year); filtrosUsados.push(`año '${searchParams.year}'`); }
        if (searchParams.air_arrival) { query.append("air_arrival", searchParams.air_arrival); filtrosUsados.push(`llegadas por aire '${searchParams.air_arrival}'`); }
        if (searchParams.water_arrival) { query.append("water_arrival", searchParams.water_arrival); filtrosUsados.push(`llegadas por agua '${searchParams.water_arrival}'`); }
        if (searchParams.land_arrival) { query.append("land_arrival", searchParams.land_arrival); filtrosUsados.push(`llegadas por tierra '${searchParams.land_arrival}'`); }
        
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
                    arrivals = data;
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
                        arrivals = [];
                    }
                }
            } else if (res.status === 404) {
                let textoFiltros = filtrosUsados.length > 0 ? filtrosUsados.join(', ') : "esos parámetros";
                message = `⚠️ No existe un registro de llegadas con ${textoFiltros}.`;
                arrivals = [];
            } else if (res.status === 400) {
                message = "❌ Error: Los parámetros introducidos en la búsqueda no son válidos.";
            } else {
                message = "❌ Error al buscar los datos en el servidor.";
            }
        } catch (error) { 
            message = "⚠️ Error de conexión al intentar realizar la búsqueda."; 
        }
    }

    async function searchArrivals() {
        offset = 0; 
        await loadData();
    }

    async function clearSearch() {
        searchParams = { country: "", year: "", air_arrival: "", water_arrival: "", land_arrival: "", from: "", to: "" };
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

    async function addArrival() {
        const dataToSend = {
            country: newEntry.country, 
            year: parseInt(newEntry.year), 
            air_arrival: parseInt(newEntry.air_arrival),
            water_arrival: parseInt(newEntry.water_arrival), 
            land_arrival: parseInt(newEntry.land_arrival)
        };
        try {
            const res = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dataToSend) });
            if (res.status === 201) {
                message = "✅ Dato añadido correctamente.";
                offset = 0; // Volvemos al principio para ver el dato nuevo
                await loadData();
                newEntry = { country: "", year: "", air_arrival: "", water_arrival: "", land_arrival: "" };
            } else if (res.status === 409) { message = `❌ Error: El registro del país '${newEntry.country}' en el año '${newEntry.year}' ya existe en el sistema.`; } 
            else if (res.status === 400) { message = "❌ Error: Faltan campos obligatorios o el formato de los números es incorrecto."; } 
            else { message = "❌ Error al guardar el dato en el servidor."; }
        } catch (error) { message = "⚠️ Error de conexión."; }
    }

    async function deleteArrival(country, year) {
        if (!confirm(`¿Borrar los datos de ${country} en ${year}?`)) return;
        try {
            const res = await fetch(`${API_URL}/${country}/${year}`, { method: "DELETE" });
            if (res.ok) {
                arrivals = arrivals.filter(d => d.country !== country || d.year !== year);
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
                arrivals = [];
                offset = 0;
                message = "💥 Todos los datos han sido borrados";
            } else { message = "❌ Error al intentar borrar todos los datos."; }
        } catch (error) { message = "⚠️ Error de conexión."; }
    }
</script>

<main>
    <a href="/" class="back-btn">⬅ Volver al Inicio</a>
    <h2>✈️ Llegadas de Turistas Internacionales (AGB)</h2>

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="global-actions">
        <button class="btn-load" onclick={loadInitialData}>🔄 Cargar Datos Iniciales</button>
        <button class="btn-delete-all" onclick={deleteAll}>🗑️ Borrar Todo</button>
    </div>

    <div class="card search-container">
        <h3>🔍 Buscar / Filtrar Registros</h3>
        <p class="subtitle">Rellena uno o varios campos para buscar.</p>
        <form onsubmit={(e) => { e.preventDefault(); searchArrivals(); }}>
            <div class="input-group">
                <input type="text" placeholder="Buscar por País" bind:value={searchParams.country}>
                <input type="number" placeholder="Año exacto" bind:value={searchParams.year}>
                <input type="number" placeholder="Desde año (from)" bind:value={searchParams.from}>
                <input type="number" placeholder="Hasta año (to)" bind:value={searchParams.to}>
                <button type="submit" class="btn-search">Buscar</button>
                <button type="button" class="btn-clear" onclick={clearSearch}>Limpiar Filtros</button>
            </div>
        </form>
    </div>

    <div class="card form-container">
        <h3>➕ Añadir nuevo registro</h3>
        <form onsubmit={(e) => { e.preventDefault(); addArrival(); }}>
            <div class="input-group">
                <input type="text" placeholder="País" bind:value={newEntry.country} required>
                <input type="number" placeholder="Año" bind:value={newEntry.year} required>
                <input type="number" placeholder="Llegadas (Aire)" bind:value={newEntry.air_arrival} required>
                <input type="number" placeholder="Llegadas (Agua)" bind:value={newEntry.water_arrival} required>
                <input type="number" placeholder="Llegadas (Tierra)" bind:value={newEntry.land_arrival} required>
                <button type="submit" class="btn-add">Añadir</button>
            </div>
        </form>
    </div>

    <div class="card table-container">
        <table>
            <thead>
                <tr>
                    <th>País</th><th>Año</th><th>Aire</th><th>Agua</th><th>Tierra</th><th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {#if arrivals.length === 0}
                    <tr><td colspan="6" class="text-center">No hay datos para mostrar</td></tr>
                {/if}
                
                {#each arrivals as arr}
                    <tr>
                        <td>{arr.country}</td><td>{arr.year}</td><td>{arr.air_arrival}</td>
                        <td>{arr.water_arrival}</td><td>{arr.land_arrival}</td>
                        <td>
                            <button class="btn-edit" onclick={() => goto(`/international-tourist-arrivals/${arr.country}/${arr.year}`)}>Editar</button>
                            <button class="btn-delete" onclick={() => deleteArrival(arr.country, arr.year)}>Borrar</button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
        
        <div class="pagination">
            <button class="btn-page" onclick={prevPage} disabled={offset === 0}>⬅ Anterior</button>
            <span class="page-info">Página {(offset / limit) + 1}</span>
            <button class="btn-page" onclick={nextPage} disabled={arrivals.length < limit}>Siguiente ➡</button>
        </div>
    </div>
</main>

<style>
    /* Estilos base (IDÉNTICOS a los de tu compañero para mantener coherencia visual) */
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