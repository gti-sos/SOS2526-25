<script>
    import { page } from '$app/stores'; // Para leer la URL
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    // Capturamos los parámetros de la URL gracias a las carpetas [country] y [year]
    let countryUrl = $page.params.country;
    let yearUrl = $page.params.year;

    let drink = $state({
        country: countryUrl,
        year: yearUrl,
        total_liter: "",
        beer_share: "",
        wine_share: "",
        spirit_share: ""
    });

    let message = $state("");

    const API_URL = `/api/v1/social-drinking-behaviors/${countryUrl}/${yearUrl}`;

    onMount(async () => {
        await getDrink();
    });

    async function getDrink() {
        try {
            const res = await fetch(API_URL);
            if (res.ok) {
                drink = await res.json();
            } else {
                message = "⚠️ No se encontró el registro. Quizás fue borrado.";
            }
        } catch (error) { message = "⚠️ Error de red."; }
    }

    async function updateDrink() {
        const dataToSend = {
            country: drink.country,
            year: parseInt(drink.year),
            total_liter: parseFloat(drink.total_liter),
            beer_share: parseFloat(drink.beer_share),
            wine_share: parseFloat(drink.wine_share),
            spirit_share: parseFloat(drink.spirit_share)
        };

        try {
            const res = await fetch(API_URL, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSend)
            });

            if (res.status === 200) {
                message = "✅ Dato actualizado correctamente. Volviendo a la tabla...";
                // Esperamos 1.5 segundos para que leas el mensaje y volvemos a la tabla
                setTimeout(() => {
                    goto('/social-drinking-behaviors');
                }, 1500);
            } else {
                message = "❌ Error al actualizar el dato. Revisa los campos.";
            }
        } catch (error) { message = "⚠️ Error de red."; }
    }
</script>

<main>
    <button class="back-btn" on:click={() => goto('/social-drinking-behaviors')}>⬅ Volver a la tabla</button>
    
    <h2>✏️ Editando: {countryUrl} ({yearUrl})</h2>

    {#if message}
        <div class="alert">{message}</div>
    {/if}

    <div class="card form-container">
        <form on:submit|preventDefault={updateDrink}>
            <div class="input-group">
                <div class="field">
                    <label>País (No editable)</label>
                    <input type="text" bind:value={drink.country} disabled>
                </div>
                <div class="field">
                    <label>Año (No editable)</label>
                    <input type="text" bind:value={drink.year} disabled>
                </div>
                <div class="field">
                    <label>Litros Totales</label>
                    <input type="number" step="0.1" bind:value={drink.total_liter} required>
                </div>
                <div class="field">
                    <label>% Cerveza</label>
                    <input type="number" step="0.1" bind:value={drink.beer_share} required>
                </div>
                <div class="field">
                    <label>% Vino</label>
                    <input type="number" step="0.1" bind:value={drink.wine_share} required>
                </div>
                <div class="field">
                    <label>% Licores</label>
                    <input type="number" step="0.1" bind:value={drink.spirit_share} required>
                </div>
            </div>
            
            <div class="actions">
                <button type="submit" class="btn-update">💾 Guardar Cambios</button>
            </div>
        </form>
    </div>
</main>

<style>
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