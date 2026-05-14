<main>
    <div class="header">
        <a href="/" class="back-btn">⬅ Volver al Inicio</a>
        <h1>🌐 Centro de Integraciones</h1>
        <p class="subtitle">Panel de Control de APIs Externas y Colaborativas</p>
    </div>

    <div class="grid-container">
        
        <!-- BOTÓN GIGANTE: JUAN LUIS -->
        <a href="integrations/juan-luis" class="card-link full-row">
            <div class="card hero-card juanlu-card">
                <span class="tag tag-juanlu" style="align-self: center;">Panel de Usuario</span>
                <h3 style="color: #00f2fe; font-size: 2rem;">Integraciones de Juan Luis</h3>
                <p style="font-size: 1.1rem;">Accede a todos mis análisis cruzados (Protestas, Meteoritos y APIs públicas).</p>
                <div class="arrow" style="color: #00f2fe; font-size: 1.1rem;">Entrar a mis integraciones ➜</div>
            </div>
        </a>

        <!-- BOTÓN GIGANTE: PABLO -->
        <a href="integrations/pablo" class="card-link full-row">
            <div class="card hero-card pablo-card">
                <span class="tag tag-pablo" style="align-self: center;">Panel de Usuario</span>
                <h3 style="color: #a855f7; font-size: 2rem;">Integraciones de Pablo</h3>
                <p style="font-size: 1.1rem;">Accede a todos mis análisis cruzados (Olimpiadas, ESG, Exportaciones y más).</p>
                <div class="arrow" style="color: #a855f7; font-size: 1.1rem;">Entrar a mis integraciones ➜</div>
            </div>
        </a>

        <!-- BOTÓN GIGANTE: AIMAR -->
        <a href="integrations/aimar" class="card-link full-row">
            <div class="card hero-card aimar-card">
                <span class="tag tag-aimar" style="align-self: center;">Panel de Usuario</span>
                <h3 style="color: #10b981; font-size: 2rem;">Integraciones de Aimar</h3>
                <p style="font-size: 1.1rem;">Accede a todos mis análisis cruzados y visualizaciones interactivas.</p>
                <div class="arrow" style="color: #10b981; font-size: 1.1rem;">Entrar a mis integraciones ➜</div>
            </div>
        </a>
        
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
        grid-template-columns: 1fr; /* Una sola columna para que ocupen todo el ancho */
        gap: 2.5rem;
        align-items: stretch; 
    }

    .full-row {
        grid-column: 1 / -1; 
    }

    .card-link { 
        display: flex; 
        text-decoration: none; 
        color: inherit; 
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
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    .hero-card {
        align-items: center; 
        text-align: center;
        padding: 3rem 2rem !important; 
    }

    /* --- ESTILOS ESPECÍFICOS JUAN LUIS (CIAN) --- */
    .juanlu-card {
        background: linear-gradient(145deg, rgba(0, 242, 254, 0.1), rgba(0, 242, 254, 0.02));
        border: 2px solid rgba(0, 242, 254, 0.4) !important;
    }
    .juanlu-card:hover {
        background: linear-gradient(145deg, rgba(0, 242, 254, 0.15), rgba(0, 242, 254, 0.05));
        border-color: #00f2fe !important;
        box-shadow: 0 10px 40px rgba(0, 242, 254, 0.2) !important;
        transform: translateY(-10px);
    }
    .tag-juanlu { background: rgba(0, 242, 254, 0.2); color: #00f2fe; border: 1px solid #00f2fe; }

    /* --- ESTILOS ESPECÍFICOS PABLO (MORADO) --- */
    .pablo-card {
        background: linear-gradient(145deg, rgba(168, 85, 247, 0.1), rgba(168, 85, 247, 0.02));
        border: 2px solid rgba(168, 85, 247, 0.4) !important;
    }
    .pablo-card:hover {
        background: linear-gradient(145deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.05));
        border-color: #a855f7 !important;
        box-shadow: 0 10px 40px rgba(168, 85, 247, 0.2) !important;
        transform: translateY(-10px);
    }
    .tag-pablo { background: rgba(168, 85, 247, 0.2); color: #a855f7; border: 1px solid #a855f7; }

    /* --- ESTILOS ESPECÍFICOS AIMAR (VERDE ESMERALDA) --- */
    .aimar-card {
        background: linear-gradient(145deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02));
        border: 2px solid rgba(16, 185, 129, 0.4) !important;
    }
    .aimar-card:hover {
        background: linear-gradient(145deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05));
        border-color: #10b981 !important;
        box-shadow: 0 10px 40px rgba(16, 185, 129, 0.2) !important;
        transform: translateY(-10px);
    }
    .tag-aimar { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981; }

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

    h3 { margin: 0.5rem 0; font-size: 1.5rem; }
    p { color: #94a3b8; line-height: 1.5; flex-grow: 1; margin-bottom: 0;}

    .arrow {
        margin-top: 1.5rem;
        font-weight: bold;
        font-size: 0.9rem;
    }
</style>
