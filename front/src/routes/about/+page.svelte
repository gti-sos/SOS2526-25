<script>
    // Vista para cumplir con el requisito D03.A: Vídeos de presentación
</script>

<main>
    <a href="/" class="back-btn">⬅ Volver al Inicio</a>
    <h2>🎥 Presentaciones del Proyecto (D03)</h2>
    <p class="subtitle">Vídeos demostrativos de menos de 5 minutos requeridos para la entrega.</p>

    <div class="video-grid">
        <div class="card">
            <h3>Juan Luis Rodríguez</h3>
            <p>Datos: social-drinking-behaviors</p>
            <div class="video-container">
                <iframe src="https://www.youtube.com/embed/ID_DEL_VIDEO" title="Vídeo Juan Luis" allowfullscreen></iframe>
            </div>
            <a href="https://youtu.be/ID_DEL_VIDEO" target="_blank" class="btn">🔗 Ver en YouTube</a>
        </div>

        <div class="card">
            <h3>Aimar García</h3>
            <p>Datos: international-tourist-arrivals</p>
            <div class="video-container">
                <iframe src="https://www.youtube.com/embed/ID_DEL_VIDEO" title="Vídeo Aimar" allowfullscreen></iframe>
            </div>
            <a href="https://youtu.be/ID_DEL_VIDEO" target="_blank" class="btn">🔗 Ver en YouTube</a>
        </div>

        <div class="card">
            <h3>Pablo Seco</h3>
            <p>Datos: average-annual-temperatures</p>
            <div class="video-container">
                <iframe src="https://www.youtube.com/embed/ID_DEL_VIDEO" title="Vídeo Pablo" allowfullscreen></iframe>
            </div>
            <a href="https://youtu.be/ID_DEL_VIDEO" target="_blank" class="btn">🔗 Ver en YouTube</a>
        </div>
    </div>
</main>

<style>
    :global(body) { background-color: #0f172a; color: white; font-family: sans-serif; margin: 0; }
    main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h2 { text-align: center; color: #00f2fe; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 3rem; }
    .back-btn { color: #94a3b8; text-decoration: none; font-weight: bold; }
    
    .video-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
    .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 1.5rem; text-align: center; }
    .video-container { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin-bottom: 1.5rem; border-radius: 10px; }
    .video-container iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
    .btn { background: #00f2fe; color: black; padding: 0.5rem 1rem; border-radius: 5px; text-decoration: none; font-weight: bold; }
</style>