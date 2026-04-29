<script>
    import { onMount } from 'svelte';
    let remoteData = [];
    let message = "Cargando uso textual de API externa...";

    onMount(async () => {
        try {
            // API pública de Universidades del Mundo
            const res = await fetch('http://universities.hipolabs.com/search?country=Spain');
            const data = await res.json();
            remoteData = data.slice(0, 10); // Mostramos solo 10
            message = "";
        } catch (error) { message = "❌ Error al cargar."; }
    });
</script>

<main>
    <a href="/integrations" class="back-btn" style="color:#94a3b8; font-weight:bold;">⬅ Volver</a>
    <h2 style="color: #00f2fe;">🏛️ Uso Textual: Universidades (Pablo)</h2>
    <p style="color: #94a3b8; margin-bottom: 2rem;">Uso de API externa sin widget gráfico (Requisito D03.B)</p>

    {#if message}<p style="color: #facc15;">{message}</p>{/if}

    {#if remoteData.length > 0}
        <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 15px;">
            <table style="width: 100%; border-collapse: collapse; color: white;">
    <thead>
        <tr style="color: #a855f7; text-align: left;">
            <th>Universidad</th>
            <th>Sitio Web</th>
        </tr>
    </thead>
    
    <tbody>
        {#each remoteData as uni}
            <tr>
                </tr>
        {/each}
    </tbody>
</table>
        </div>
    {/if}
</main>