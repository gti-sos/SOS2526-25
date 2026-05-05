<main>
    <div class="header">
        <a href="/" class="back-btn">⬅ Volver al portal de integración</a>
        <h1>🌐 Centro de Integraciones de Juan Luis</h1>
        <p class="subtitle">Panel de Control de APIs Externas y Colaborativas</p>
    </div>

    <div class="grid-container">
        
        <a href="/integrations/juan-luis/protests" class="card-link">
            <div class="card">
                <span class="tag tag-int">Integración (Compañeros)</span>
                <h3>Protestas (G10)</h3>
                <p>Análisis: Consumo de Alcohol vs Conflictos Sociales.</p>
                <div class="arrow">Ver Gráfica ➜</div>
            </div>
        </a>

        <a href="/integrations/juan-luis/meteorite-landings" class="card-link">
            <div class="card">
                <span class="tag tag-int">Integración (Compañeros)</span>
                <h3>Meteoritos (G14)</h3>
                <p>Análisis: Impactos de meteoritos vs Consumo.</p>
                <div class="arrow">Ver Gráfica ➜</div>
            </div>
        </a>

        <a href="/integrations/juan-luis/poblation" class="card-link">
            <div class="card">
                <span class="tag tag-use">Uso Externo (Pública)</span>
                <h3>Economy</h3>
                <p>Base de datos con integracion sobre la economy mundial.</p>
                <div class="arrow">Ver Datos ➜</div>
            </div>
        </a>

        <a href="/integrations/juan-luis/beer-factorys" class="card-link">
            <div class="card">
                <span class="tag tag-use">Uso Externo (Pública)</span>
                <h3>BeersFactory</h3>
                <p>Estadísticas de fábricas de cerveza por el mundo.</p>
                <div class="arrow">Ver Gráfica ➜</div>
            </div>
        </a>

        <a href="/integrations/juan-luis/universitys" class="card-link">
            <div class="card">
                <span class="tag tag-use">Uso Externo (Pública)</span>
                <h3>Universitys</h3>
                <p>El acohol entre los jovenes. Alcohol y universidades</p>
                <div class="arrow">Ver Gráfica ➜</div>
            </div>
        </a>
        <a href="/integrations/juan-luis/alcoholic" class="card-link">
            <div class="card">
                <span class="tag tag-use">Uso Externo (Pública)</span>
                <h3>AlcoholicAPI</h3>
                <p>Esperanza de vida en funcion del alcohol de paises</p>
                <div class="arrow">Ver Gráfica ➜</div>
            </div>
        </a>
                <a href="/integrations/juan-luis/sinisters" class="card-link">
            <div class="card">
                <span class="tag tag-use">Uso Externo (Pública)</span>
                <h3>sinisters</h3>
                <p>Siniestros de coches y motos por paises</p>
                <div class="arrow">Ver Gráfica ➜</div>
            </div>
        </a>
        <a href="/integrations/juan-luis/poberty" class="card-link">
            <div class="card">
                <span class="tag tag-use">Uso Externo (Pública)</span>
                <h3>Poberty</h3>
                <p>Pobreza+Consumo de Alcohol</p>
                <div class="arrow">Ver Gráfica ➜</div>
            </div>
        </a>
        <a href="/integrations/juan-luis/unemployment" class="card-link">
            <div class="card">
                <span class="tag tag-use">Uso Externo (Pública)</span>
                <h3>Unemployment</h3>
                <p>Tasa de paro por pais</p>
                <div class="arrow">Ver Gráfica ➜</div>
            </div>
        </a>
        <a href="/integrations/juan-luis/urbanization" class="card-link">
            <div class="card">
                <span class="tag tag-use">Uso Externo (Pública)</span>
                <h3>Urbanization</h3>
                <p> Urbanizacion de los paises: numero de grandes ciudades del mapa</p>
                <div class="arrow">Ver Gráfica ➜</div>
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

    /* --- EL FIX DEFINITIVO DEL GRID --- */
    .grid-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2.5rem;
        align-items: stretch; /* Fuerza a que todas las tarjetas de la misma fila midan lo mismo */
    }

    .card-link { 
        display: flex; /* Hace que el enlace se expanda como un bloque flexible */
        text-decoration: none; 
        color: inherit; 
    }

    .card {
        width: 100%;
        box-sizing: border-box; /* Evita que el padding rompa la caja por fuera */
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
    /* ---------------------------------- */

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
    p { color: #94a3b8; line-height: 1.5; flex-grow: 1; }

    .arrow {
        margin-top: 1.5rem;
        font-weight: bold;
        color: #a855f7;
        font-size: 0.9rem;
    }
</style>