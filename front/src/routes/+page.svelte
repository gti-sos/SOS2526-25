<script>
    // Vista principal del equipo SOS2526-25 (SvelteKit 5)
</script>

<main>
    <header>
        <h1 class="title">Team SOS2526-25</h1>
        <div class="description">
            <p><strong>Project Description:</strong> Our project focuses on analyzing the correlation between alcohol consumption across different countries, environmental factors like temperatures (CO2 emissions), and global tourism arrivals.</p>
        </div>
        <div class="project-links">
            <a href="https://github.com/gti-sos/SOS2526-25" target="_blank" class="btn btn-github">📁 GitHub Repository</a>
            <a href="https://sos2526-25.onrender.com/" target="_blank" class="btn btn-api">🚀 Render Deployment</a>
            <a href="/analytics" class="btn btn-analytics">📈 Gráfica Grupal</a>
            <a href="/integrations" class="btn btn-analytics">📈 Integraciones grupales</a>
        </div>
    </header>

    <div class="grid-container">
        <div class="card">
            <img src="https://github.com/juarodart.png" alt="Juan Luis" class="avatar">
            <h3>Juan Luis Rodríguez Artiaga</h3>
            <p class="resource-name">Data: <strong>social-drinking-behaviors</strong></p>
            
            <div class="links-container">
                <a href="/social-drinking-behaviors" class="btn btn-frontend">🖥️ Front-End</a>
                <a href="/api/v1/social-drinking-behaviors" target="_blank" class="btn btn-api">⚙️ Base API</a>
                <a href="/api/v1/social-drinking-behaviors/docs" target="_blank" class="btn btn-postman">📚 Postman Docs</a>
                <a href="/analytics/social-drinking-behaviors" class="btn btn-analytics">📊 Analytics</a>
            </div>
        </div>

        <div class="card">
            <img src="https://github.com/aimargarcia.png" alt="Aimar" class="avatar">
            <h3>Aimar García Borrego</h3>
            <p class="resource-name">Data: <strong>international-tourist-arrivals</strong></p>
            
            <div class="links-container">
                <a href="/international-tourist-arrivals" class="btn btn-frontend">🖥️ Front-End</a>
                <a href="/api/v1/international-tourist-arrivals" target="_blank" class="btn btn-api">⚙️ Base API</a>
                <a href="/api/v1/international-tourist-arrivals/docs" target="_blank" class="btn btn-postman">📚 Postman Docs</a>
                <a href="/analytics/international-tourist-arrivals" class="btn btn-analytics">📊 Analytics</a>
            </div>
        </div>

        <div class="card">
            <img src="https://github.com/CJY2851.png" alt="Pablo" class="avatar">
            <h3>Pablo Seco Amores</h3>
            <p class="resource-name">Data: <strong>average-annual-temperatures</strong></p>
            
            <div class="links-container">
                <a href="/average-annual-temperatures" class="btn btn-frontend">🖥️ Front-End</a>
                <a href="/api/v1/average-annual-temperatures" target="_blank" class="btn btn-api">⚙️ Base API</a>
                <a href="/api/v1/average-annual-temperatures/docs" target="_blank" class="btn btn-postman">📚 Postman Docs</a>
                <a href="/analytics/average-annual-temperatures" class="btn btn-analytics">📊 Analytics</a>
            </div>
        </div>
    </div>
</main>

<style>
    /* Definimos variables en el scope global o local */
    :root {
        --primary: #00f2fe;
        --secondary: #4facfe;
        --bg-color: #0f172a;
        --card-bg: rgba(255, 255, 255, 0.05);
        --card-border: rgba(255, 255, 255, 0.1);
    }

    /* Usamos :global para que afecte al body de toda la página si esta es la vista principal */
    :global(body) {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: 'Inter', sans-serif;
        background: linear-gradient(-45deg, #0f172a, #1e293b, #020617);
        background-size: 400% 400%;
        animation: gradientBG 15s ease infinite;
        color: #ffffff;
        min-height: 100vh;
    }

    main {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 3rem 1.5rem;
    }

    @keyframes gradientBG {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }

    header {
        text-align: center;
        margin-bottom: 3rem;
        max-width: 800px;
    }

    .title {
        font-size: 3rem;
        font-weight: 800;
        background: linear-gradient(to right, var(--primary), var(--secondary));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 1rem;
    }

    .description {
        font-size: 1.1rem;
        color: #cbd5e1;
        line-height: 1.6;
        background: rgba(0, 0, 0, 0.2);
        padding: 1.5rem;
        border-radius: 15px;
        border: 1px solid var(--card-border);
        margin-bottom: 2rem;
        backdrop-filter: blur(10px);
    }

    .grid-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
        width: 100%;
        max-width: 1100px;
        margin-bottom: 3rem;
    }

    .card {
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        border-radius: 20px;
        padding: 2rem;
        text-align: center;
        transition: all 0.4s ease;
        backdrop-filter: blur(12px);
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .card:hover {
        transform: translateY(-5px);
        border-color: var(--primary);
        box-shadow: 0 10px 30px rgba(0, 242, 254, 0.15);
    }

    .avatar {
        width: 90px;
        height: 90px;
        border-radius: 50%;
        margin-bottom: 1rem;
        border: 3px solid var(--secondary);
        object-fit: cover;
        box-shadow: 0 0 15px rgba(79, 172, 254, 0.4);
    }

    .card h3 {
        font-size: 1.3rem;
        margin-bottom: 0.2rem;
        color: #f8fafc;
    }

    .resource-name {
        font-size: 0.85rem;
        color: #94a3b8;
        margin-bottom: 1.5rem;
    }

    .resource-name strong {
        color: var(--primary);
    }

    .links-container {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        width: 100%;
    }

    .btn {
        padding: 0.6rem 1rem;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.3s ease;
        text-align: center;
    }

    /* Colores específicos para cada tipo de botón */
    .btn-github {
        background: #333;
        color: white;
        border: 1px solid #444;
    }
    .btn-github:hover { background: #555; }

    .btn-frontend {
        background: rgba(79, 172, 254, 0.2);
        color: #fff;
        border: 1px solid var(--secondary);
    }
    .btn-frontend:hover { background: var(--secondary); }

    .btn-api {
        background: rgba(0, 242, 254, 0.1);
        color: var(--primary);
        border: 1px solid var(--primary);
    }
    .btn-api:hover {
        background: var(--primary);
        color: #000;
    }

    .btn-postman {
        background: rgba(255, 108, 55, 0.1); /* Naranja Postman */
        color: #ff6c37;
        border: 1px solid #ff6c37;
    }
    .btn-postman:hover {
        background: #ff6c37;
        color: white;
    }

    .project-links {
        display: flex;
        gap: 1.5rem;
        justify-content: center;
        flex-wrap: wrap;
    }
    .btn-analytics {
        background: rgba(168, 85, 247, 0.1); 
        color: #a855f7;
        border: 1px solid #a855f7;
    }
    .btn-analytics:hover {
        background: #a855f7;
        color: white;
    }
</style>

