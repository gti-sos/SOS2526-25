<script>
    import { onMount } from 'svelte';

    let mapElement;
    let message = "Cargando mapa y datos espaciales...";

    // Diccionario de coordenadas para los países que tiene Pablo en su API
    // (Latitud, Longitud)
    const countryCoords = {
        "Germany": [51.1657, 10.4515],
        "Austria": [47.5162, 14.5501],
        "Belgium": [50.5039, 4.4699],
        "Italy": [41.8719, 12.5674],
        "Turkey": [38.9637, 35.2433],
        "Mexico": [23.6345, -102.5528],
        "United Kingdom": [55.3781, -3.4360],
        "China": [35.8617, 104.1954]
    };

    onMount(async () => {
        try {
            // IMPORTANTE: Importamos Leaflet dinámicamente solo en el navegador (onMount)
            // Esto evita el típico error de "window is not defined" en SvelteKit (SSR)
            const L = await import('leaflet');

            const res = await fetch('/api/v2/average-annual-temperatures');
            const data = await res.json();
            message = "";

            // Inicializamos el mapa centrado en el mundo
            const map = L.map(mapElement).setView([35, 0], 2);

            // Cargamos la capa visual del mapa usando OpenStreetMap (Gratis y sin API Key)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Forzamos los iconos por defecto apuntando a un CDN para que no haya fallos de rutas
            const defaultIcon = L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                iconAnchor: [12, 41], // Punto exacto donde la chincheta toca el suelo
                popupAnchor: [1, -34] // Donde sale el cartelito
            });

            // Recorremos los datos de Pablo y ponemos una chincheta por cada uno
            data.forEach(d => {
                const coords = countryCoords[d.country];
                
                if (coords) {
                    // Si el país está en nuestro diccionario, añadimos el marcador
                    L.marker(coords, { icon: defaultIcon })
                        .addTo(map)
                        .bindPopup(`
                            <div style="text-align: center; color: black;">
                                <strong>🌍 ${d.country} (${d.year})</strong><br>
                                🌡️ Temp: <b>${d.temperature} ºC</b><br>
                                ☁️ CO2: ${d.co2_emission}<br>
                                🌧️ Precip: ${d.precipitation}
                            </div>
                        `);
                }
            });
        } catch (error) {
            message = "⚠️ Error al cargar el mapa o la API de Temperaturas.";
            console.error(error);
        }
    });
</script>

<svelte:head>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<main>
    <a href="/analytics/average-annual-temperatures" class="back-btn">⬅ Volver a la Gráfica de Pablo</a>
    
    <h2>🗺️ Mapa Geoespacial: Temperaturas</h2>
    <p class="subtitle">Haz clic en los marcadores para ver los detalles de cada registro.</p>

    {#if message}
        <p class="alert">{message}</p>
    {/if}

    <div class="map-container">
        <div bind:this={mapElement} class="leaflet-map"></div>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0;}
    main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h2 { text-align: center; color: #00f2fe; margin-bottom: 0.5rem;}
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 2rem;}
    
    .back-btn { display: inline-block; margin-bottom: 1rem; color: #94a3b8; text-decoration: none; font-weight: bold; }
    .back-btn:hover { color: #00f2fe; }
    .alert { background: rgba(255, 193, 7, 0.2); border-left: 4px solid #ffc107; padding: 1rem; color: white;}
    
    .map-container {
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 15px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0, 242, 254, 0.1);
    }

    .leaflet-map {
        width: 100%;
        height: 600px;
        background-color: #e5e5e5; /* Color de fondo mientras carga */
    }
</style>