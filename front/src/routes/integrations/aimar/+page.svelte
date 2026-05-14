<script>
    // Panel principal de integraciones de Aimar
</script>

<main>
    <div class="header-nav">
        <a href="/" class="back-btn">⬅ Volver al Inicio</a>
    </div>

    <div class="header-title">
        <h1>🚀 Panel de Integraciones (Aimar)</h1>
        <p>Cruce de datos de Llegadas de Turistas Internacionales con otras APIs.</p>
    </div>

    <div class="integration-section">
        <h2 class="section-title">🤝 Integraciones Grupales (Compañeros SOS)</h2>
        <div class="grid">
            <a href="/integrations/aimar/earthquakes" class="card group-card">
                <span class="icon">🌋</span>
                <h3>Terremotos</h3>
                <p>SOS-19</p>
            </a>
            
            <a href="/integrations/aimar/wages" class="card group-card">
                <span class="icon">💰</span>
                <h3>Salarios</h3>
                <p>SOS-24</p>
            </a>
            
            <a href="/integrations/aimar/citys" class="card group-card">
                <span class="icon">🏙️</span>
                <h3>Ciudades</h3>
                <p>SOS-29</p>
            </a>

            <a href="/integrations/aimar/ozone" class="card group-card">
                <span class="icon">🌍</span>
                <h3>Ozono</h3>
                <p>SOS-22 (ZingChart Radar)</p>
            </a>

            <a href="/integrations/aimar/roads" class="card group-card">
                <span class="icon">🚗</span>
                <h3>Seguridad Vial</h3>
                <p>SOS-11 (ApexCharts Área)</p>
            </a>
        </div>
    </div>

    <div class="integration-section">
        <h2 class="section-title">🌐 Integraciones Externas (APIs Internet)</h2>
        <div class="grid">
            <a href="/integrations/aimar/textual" class="card ext-card">
                <span class="icon">✅</span>
                <h3>Turismo vs Predicción de Origen</h3>
                <p>Nationalize.io (Uso Textual)</p>
            </a>
            
            <a href="/integrations/aimar/books" class="card ext-card">
                <span class="icon">📚</span>
                <h3>Libros publicados por pais</h3>
                <p>Open Library(Chartist.js)</p>
            </a>
            
            <a href="/integrations/aimar/cloud" class="card ext-card">
                <span class="icon">☁️</span>
                <h3>Turismo vs Infraestructura</h3>
                <p>Zippopotam (AnyChart TagCloud)</p>
            </a>
        </div>
    </div>
</main>

<style>
    :global(body) { 
        background: #0f172a; 
        color: white; 
        margin: 0; 
        font-family: 'Segoe UI', system-ui, sans-serif; 
    }
    
    main { 
        padding: 2rem; 
        max-width: 1000px; 
        margin: auto; 
    }
    
    .header-nav { margin-bottom: 2rem; }
    
    .back-btn { 
        color: #94a3b8; 
        text-decoration: none; 
        font-weight: bold; 
        border: 1px solid #334155; 
        padding: 0.5rem 1rem; 
        border-radius: 8px; 
        transition: 0.3s; 
    }
    .back-btn:hover { background: #1e293b; color: white; }
    
    .header-title { 
        text-align: center; 
        margin-bottom: 3rem; 
    }
    .header-title h1 { 
        color: #38bdf8; 
        margin-bottom: 0.5rem; 
        font-size: 2.5rem; 
    }
    .header-title p { 
        color: #94a3b8; 
        font-size: 1.1rem; 
    }

    .integration-section { 
        background: #1e293b; 
        padding: 2rem; 
        border-radius: 24px; 
        border: 1px solid #334155; 
        margin-bottom: 2rem;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }

    .section-title {
        color: #f8fafc;
        margin-top: 0;
        margin-bottom: 1.5rem;
        border-bottom: 1px solid #334155;
        padding-bottom: 1rem;
        font-size: 1.5rem;
    }

    .grid { 
        display: grid; 
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); 
        gap: 1.5rem; 
    }

    .card { 
        background: #0b1120; 
        padding: 1.5rem; 
        border-radius: 16px; 
        border: 1px solid #334155; 
        text-align: center; 
        text-decoration: none;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .icon {
        font-size: 2.5rem;
        margin-bottom: 1rem;
    }

    .card h3 { 
        color: #e2e8f0; 
        margin: 0 0 0.5rem 0; 
        font-size: 1.2rem;
    }

    .card p { 
        color: #64748b; 
        margin: 0; 
        font-size: 0.9rem;
    }

    /* Efectos Hover Neón para las grupales (Azul) */
    .group-card:hover { 
        transform: translateY(-5px); 
        border-color: #38bdf8;
        box-shadow: 0 10px 20px rgba(56, 189, 248, 0.15);
    }
    .group-card:hover h3 { color: #38bdf8; }

    /* Efectos Hover Neón para las externas (Rosa) */
    .ext-card:hover { 
        transform: translateY(-5px); 
        border-color: #f43f5e;
        box-shadow: 0 10px 20px rgba(244, 63, 94, 0.15);
    }
    .ext-card:hover h3 { color: #f43f5e; }

</style>