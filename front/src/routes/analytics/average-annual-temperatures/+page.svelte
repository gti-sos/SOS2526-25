<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let map;
    let mapContainer;
    let message = $state("🌍 Cargando mapa y datos espaciales...");

    // DICCIONARIO DE COORDENADAS (Basado en tu JSON exacto)
    const countryCoords = {
        "Germany": [51.16, 10.45], "Spain": [40.46, -3.74], "Japan": [36.20, 138.25],
        "Chad": [15.45, 18.73], "France": [46.22, 2.21], "Ethiopia": [9.14, 40.48],
        "Mongolia": [46.86, 103.84], "Turkey": [38.96, 35.24], "Equatorial Guinea": [1.65, 10.26],
        "Egypt": [26.82, 30.80], "Ukraine": [48.37, 31.16], "China": [35.86, 104.19],
        "Latvia": [56.87, 24.60], "Angola": [-11.20, 17.87], "Liberia": [6.42, -9.42],
        "USA": [37.09, -95.71], "Afghanistan": [33.93, 67.71], "Italy": [41.87, 12.56],
        "Mexico": [23.63, -102.55], "Greece": [39.07, 21.82], "Estonia": [58.59, 25.01],
        "Austria": [47.51, 14.55], "Nigeria": [9.08, 8.67], "El Salvador": [13.79, -88.89],
        "United Kingdom": [55.37, -3.43], "South Africa": [-30.55, 22.93], "Slovenia": [46.15, 14.99],
        "Belgium": [50.50, 4.46], "Algeria": [28.03, 1.65]
    };

    onMount(async () => {
        if (browser) {
            // 1. Inicializar mapa
            const L = await import('leaflet');
            map = L.map(mapContainer).setView([20, 0], 2);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(map);

            // 2. Cargar tus datos
            try {
                const res = await fetch('/api/v2/average-annual-temperatures');
                const data = await res.json();

                if (data.length > 0) {
                    data.forEach(item => {
                        const coords = countryCoords[item.country];
                        if (coords) {
                            // JITTER: Sumamos un pequeño error aleatorio para que si hay 
                            // varios registros del mismo país, se vean todos y no uno encima de otro.
                            const lat = coords[0] + (Math.random() - 0.5) * 2; 
                            const lng = coords[1] + (Math.random() - 0.5) * 2;

                            L.marker([lat, lng]).addTo(map)
                                .bindPopup(`
                                    <div style="color: #333">
                                        <b>${item.country} (${item.year})</b><br>
                                        🌡️ Temp: ${item.temperature} °C<br>
                                        ☁️ CO2: ${item.co2_emission}
                                    </div>
                                `);
                        }
                    });
                    message = ""; // Borramos el mensaje de carga si todo OK
                } else {
                    message = "⚠️ No hay datos en la base de datos.";
                }
            } catch (e) {
                message = "❌ Error al conectar con la API.";
                console.error(e);
            }
        }
    });
</script>

<svelte:head>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<main>
    <h2>🗺️ Mapa Geoespacial: Temperaturas</h2>
    
    {#if message}
        <div class="loading-bar">{message}</div>
    {/if}

    <div class="map-wrapper">
        <div id="map" bind:this={mapContainer}></div>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; margin: 0; font-family: sans-serif; }
    main { padding: 20px; max-width: 1200px; margin: 0 auto; }
    h2 { text-align: center; color: #38bdf8; }
    
    .loading-bar { 
        background: #854d0e; 
        color: #fef08a; 
        padding: 10px; 
        border-left: 5px solid #eab308;
        margin-bottom: 10px;
        text-align: center;
    }

    .map-wrapper {
        border: 2px solid rgba(255,255,255,0.1);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }

    #map { height: 600px; width: 100%; background: #1e293b; }
</style>