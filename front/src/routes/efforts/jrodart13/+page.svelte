<script>
    const githubUser = "jrodart13";
</script>

<main>
    <div class="header">
        <a href="/" class="back-btn">⬅ Volver al Inicio</a>
        <h1>⏳ Reporte de Esfuerzos</h1>
        <p class="subtitle">Panel de Control de Horas Registradas en Toggl</p>
    </div>

    <div class="grid-container">
        <!-- Tarjeta Hero -->
        <div class="card-link full-row">
            <div class="card hero-card">
                <span class="tag tag-use" style="align-self: center;">Información Anual</span>
                <h3 style="color: #00f2fe; font-size: 2rem;">Auditoría de {githubUser}</h3>
                <p style="font-size: 1.1rem;">A continuación se muestran los reportes exportados directamente desde Toggl. Puedes visualizarlos en pantalla o descargarlos para tu registro.</p>
            </div>
        </div>

        <!-- Tarjeta: Resumen de Horas -->
        <div class="card">
            <span class="tag tag-use">Resumen</span>
            <h3>Resumen de Horas</h3>
            <p>Informe consolidado del año actual.</p>
            
            <!-- Botón para Pantalla Completa -->
            <a href="/efforts/{githubUser}/summary.pdf" target="_blank" data-sveltekit-reload class="btn-fullscreen">
                🗖 Abrir a pantalla completa
            </a>
            
            <div class="preview-section">
                <span class="preview-label">Vista Previa</span>
                <div class="pdf-container">
                    <object 
                        data="/efforts/{githubUser}/summary.pdf" 
                        type="application/pdf">
                        <div style="padding: 2rem; text-align: center; color: #94a3b8;">
                            <p>Tu navegador no soporta la previsualización de PDFs.</p>
                        </div>
                    </object>
                </div>
            </div>

            <a href="/efforts/{githubUser}/summary.pdf" download target="_blank" data-sveltekit-reload class="arrow card-link-action">
                📥 Descargar Summary.pdf ➜
            </a>
        </div>

        <!-- Tarjeta: Detalle de Tareas -->
        <div class="card">
            <span class="tag tag-int">Detallado</span>
            <h3>Detalle de Tareas</h3>
            <p>Desglose completo por cada entrada de tiempo.</p>
            
            <!-- Botón para Pantalla Completa -->
            <a href="/efforts/{githubUser}/detailed.pdf" target="_blank" data-sveltekit-reload class="btn-fullscreen" style="border-color: rgba(168, 85, 247, 0.4); color: #a855f7;">
                🗖 Abrir a pantalla completa
            </a>
            
            <div class="preview-section">
                <span class="preview-label">Vista Previa</span>
                <div class="pdf-container">
                    <object 
                        data="/efforts/{githubUser}/detailed.pdf" 
                        type="application/pdf">
                        <div style="padding: 2rem; text-align: center; color: #94a3b8;">
                            <p>Tu navegador no soporta la previsualización de PDFs.</p>
                        </div>
                    </object>
                </div>
            </div>

            <a href="/efforts/{githubUser}/detailed.pdf" download target="_blank" data-sveltekit-reload class="arrow card-link-action" style="color: #00f2fe;">
                📥 Descargar Detailed.pdf ➜
            </a>
        </div>
    </div>
</main>

<style>
    :global(body) { 
        margin: 0; 
        background-color: #0f172a; 
        color: white; 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
    }

    main { 
        max-width: 1100px; 
        margin: 0 auto; 
        padding: 3rem 1rem; 
    }

    .header { text-align: center; margin-bottom: 4rem; }
    
    h1 { 
        font-size: 2.5rem; 
        color: #00f2fe; 
        text-shadow: 0 0 20px rgba(0, 242, 254, 0.3);
        margin: 1rem 0;
    }

    .subtitle { color: #94a3b8; font-size: 1.1rem; }

    .back-btn { 
        color: #94a3b8; 
        text-decoration: none; 
        font-weight: bold; 
        transition: 0.3s;
    }
    .back-btn:hover { color: #00f2fe; }

    .grid-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); 
        gap: 2.5rem;
        align-items: stretch; 
    }

    .full-row {
        grid-column: 1 / -1; 
    }

    .hero-card {
        background: linear-gradient(145deg, rgba(0, 242, 254, 0.1), rgba(168, 85, 247, 0.05));
        border: 2px solid rgba(0, 242, 254, 0.4) !important;
        align-items: center; 
        text-align: center;
        padding: 2rem !important; 
    }

    .hero-card:hover {
        background: linear-gradient(145deg, rgba(0, 242, 254, 0.15), rgba(168, 85, 247, 0.1));
        border-color: #00f2fe !important;
        box-shadow: 0 10px 40px rgba(0, 242, 254, 0.2) !important;
    }

    .card {
        width: 100%;
        box-sizing: border-box; 
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 2rem;
        transition: all 0.3s ease;
        position: relative;
        display: flex;
        flex-direction: column;
    }

    .card:hover {
        transform: translateY(-10px);
        background: rgba(255, 255, 255, 0.08);
        border-color: #a855f7;
        box-shadow: 0 10px 30px rgba(168, 85, 247, 0.2);
    }

    .tag {
        font-size: 0.75rem;
        font-weight: bold;
        padding: 0.3rem 0.8rem;
        border-radius: 50px;
        text-transform: uppercase;
        display: inline-block;
        margin-bottom: 1rem;
        align-self: flex-start;
    }

    .tag-int { background: rgba(168, 85, 247, 0.2); color: #a855f7; border: 1px solid #a855f7; }
    .tag-use { background: rgba(0, 242, 254, 0.2); color: #00f2fe; border: 1px solid #00f2fe; }

    h3 { margin: 0.5rem 0; font-size: 1.5rem; }
    p { color: #94a3b8; line-height: 1.5; }

    /* Estilos del botón de pantalla completa */
    .btn-fullscreen {
        display: inline-block;
        margin-top: 1rem;
        padding: 0.6rem 1rem;
        border: 1px solid rgba(0, 242, 254, 0.4);
        border-radius: 8px;
        color: #00f2fe;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.9rem;
        text-align: center;
        background: rgba(255, 255, 255, 0.02);
        transition: all 0.3s ease;
    }

    .btn-fullscreen:hover {
        background: rgba(0, 242, 254, 0.1);
        border-color: currentColor;
    }

    /* Estilos de la sección de vista previa */
    .preview-section {
        margin-top: 2rem;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
    }

    .preview-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #64748b;
        margin-bottom: 0.5rem;
        font-weight: bold;
    }

    .pdf-container {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.1);
        display: flex; 
        flex-grow: 1;
    }

    object {
        width: 100%;
        height: 350px; 
        border: none;
        display: block;
    }

    .arrow {
        margin-top: 1.5rem;
        font-weight: bold;
        color: #a855f7;
        font-size: 1rem;
        text-decoration: none;
        display: inline-block;
        transition: opacity 0.3s;
    }

    .card-link-action:hover {
        opacity: 0.8;
    }
</style>