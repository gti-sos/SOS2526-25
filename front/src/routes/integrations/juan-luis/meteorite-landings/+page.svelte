<script>
    import { onMount } from 'svelte';

    // SVELTE 5 RUNES
    let message = $state("Geolocalizando impactos de meteoritos...");
    let chartElement;
    
    // No necesitamos actualizar por años para el mapa global inicial,
    // dibujaremos todos los puntos de impacto directamente.

    onMount(async () => {
        try {
            // Importamos Plotly
            const Plotly = (await import('plotly.js-dist-min')).default;

            const resMis = await fetch('/api/v2/social-drinking-behaviors');
            const resG14 = await fetch('https://sos2526-14.onrender.com/api/v2/meteorite-landings');

            if (!resMis.ok) throw new Error("Fallo en tu API de Alcohol.");
            if (!resG14.ok) throw new Error("Fallo en la API de Meteoritos (G14).");

            const misDatos = await resMis.json();
            const g14Datos = await resG14.json();

            let lat = [];
            let lon = [];
            let textoHover = [];
            let tamanosBurbuja = [];

            // Cruzamos los datos: Buscamos países y años en común
            misDatos.forEach(mi => {
                let meteoritosDelPais = g14Datos.filter(g => 
                    g.country && mi.country && 
                    String(mi.country).trim().toLowerCase() === String(g.country).trim().toLowerCase() &&
                    String(mi.year) === String(g.year) &&
                    g.geolocation // Solo los que tengan coordenadas
                );

                meteoritosDelPais.forEach(met => {
                    // Limpiamos el string "(lat, lon)" para sacar los números
                    let coordsStr = met.geolocation.replace(/[()]/g, '').split(',');
                    
                    if (coordsStr.length === 2) {
                        let latitude = parseFloat(coordsStr[0]);
                        let longitude = parseFloat(coordsStr[1]);

                        if (!isNaN(latitude) && !isNaN(longitude)) {
                            lat.push(latitude);
                            lon.push(longitude);

                            // SUS 3 DATOS: Nombre, Masa, y Año de caída
                            let masa = Number(met.mass) || 0;
                            // Hacemos que el circulito sea más grande según la masa (con un mínimo y un máximo)
                            let tamano = Math.max(6, Math.min(25, Math.sqrt(masa) / 2));
                            tamanosBurbuja.push(tamano);

                            // MIS 3 DATOS: Total, Cerveza, Vino
                            let miTotal = Number(mi.total_liter) || 0;
                            let miCerveza = Number(mi.beer_consumption || mi.beer) || 0;
                            let miVino = Number(mi.wine_consumption || mi.wine) || 0;

                            // Construimos la caja de información del mapa
                            textoHover.push(
                                `<b>☄️ ${met.name}</b><br>` +
                                `País: ${mi.country} (${met.year})<br>` +
                                `Masa: ${masa} g<br>` +
                                `------------------------<br>` +
                                `<b>📊 Consumo Alcohol ese año:</b><br>` +
                                `🍺 Total: ${miTotal} L<br>` +
                                `🍻 Cerveza: ${miCerveza} L<br>` +
                                `🍷 Vino: ${miVino} L`
                            );
                        }
                    }
                });
            });

            if (lat.length === 0) {
                message = "⚠️ No hay coincidencias con coordenadas válidas.";
                return;
            }

            message = ""; 

            // CONFIGURACIÓN DEL MAPAMUNDI DE PLOTLY
            const data = [{
                type: 'scattergeo',
                mode: 'markers',
                lat: lat,
                lon: lon,
                text: textoHover,
                hoverinfo: 'text',
                marker: {
                    size: tamanosBurbuja,
                    color: '#ef4444', // Color fuego
                    line: { color: '#ffffff', width: 1 },
                    opacity: 0.8
                }
            }];

            const layout = {
                title: { text: 'Mapa Global: Caída de Meteoritos vs Consumo de Alcohol', font: { color: '#ffffff', size: 20 } },
                geo: {
                    scope: 'world',
                    projection: { type: 'natural earth' }, // Da ese efecto de globo 3D achatado
                    showland: true,
                    landcolor: '#1e293b',    // Continentes oscuros
                    showocean: true,
                    oceancolor: '#0f172a',   // Océanos más oscuros
                    showcountries: true,
                    countrycolor: '#334155', // Bordes de países
                    bgcolor: 'transparent'
                },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                margin: { t: 50, b: 0, l: 0, r: 0 }
            };

            const config = { responsive: true, displayModeBar: false };

            Plotly.newPlot(chartElement, data, layout, config);

        } catch (e) {
            console.error("Error capturado:", e);
            message = e.message;
        }
    });
</script>

<main>
    <div class="header-nav">
        <a href="/integrations" class="back-btn">⬅ Volver al Panel</a>
    </div>

    <div class="card">
        {#if message}
            <p class="status-msg">{message}</p>
        {/if}

        <div class="chart-box" class:hidden={!!message}>
            <div bind:this={chartElement} style="width:100%; height:600px;"></div>
        </div>
    </div>
</main>

<style>
    :global(body) { background: #0f172a; color: white; margin: 0; font-family: 'Segoe UI', sans-serif; }
    main { padding: 2rem; max-width: 1100px; margin: auto; }
    
    .header-nav { margin-bottom: 2rem; }
    .back-btn { color: #ef4444; text-decoration: none; font-weight: bold; border: 1px solid #ef4444; padding: 0.5rem 1rem; border-radius: 8px; transition: 0.3s; }
    .back-btn:hover { background: rgba(239, 68, 68, 0.2); }
    
    .card { background: #1e293b; padding: 1rem; border-radius: 20px; border: 1px solid #334155; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
    
    .status-msg { color: #facc15; font-size: 1.2rem; text-align: center; border: 2px dashed #facc15; padding: 1rem; border-radius: 8px; }
    
    .chart-box { background: #0f172a; border-radius: 10px; overflow: hidden; }
    .hidden { display: none; }
</style>