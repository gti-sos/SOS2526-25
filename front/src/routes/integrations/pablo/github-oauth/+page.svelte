<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    // ─── Estado reactivo ───────────────────────────────────────────────────────
    let message = $state("Iniciando...");
    let authStep = $state("idle"); // idle | redirecting | loading | done | error
    let githubUser = $state(null);
    let githubRepos = $state([]);
    let cruzados = $state([]);
    let chartContainer;
    let vizzuChart = $state(null);

    // ─── GitHub OAuth — datos de tu App ────────────────────────────────────────
    // IMPORTANTE: Rellena estos valores con los de tu GitHub OAuth App:
    //   https://github.com/settings/developers → New OAuth App
    //   Homepage URL:    https://sos2526-25.onrender.com
    //   Callback URL:    https://sos2526-25.onrender.com/integrations/pablo/github-oauth
    const CLIENT_ID = "Ov23liWBusmOSmJz17Jr"; // ← sustituye por tu client_id real
    const PROXY_URL = "/api/proxy/pablo/github-token"; // proxy en tu backend para el intercambio de código → token

    // ─── Arranque ───────────────────────────────────────────────────────────────
    onMount(async () => {
        if (!browser) return;

        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const error = params.get("error");

        if (error) {
            authStep = "error";
            message = "❌ El usuario canceló el acceso en GitHub.";
            return;
        }

        if (code) {
            // Fase 2: Recibimos el código de GitHub, lo intercambiamos por un token via proxy
            await handleOAuthCallback(code);
        } else {
            // Fase 1: Mostramos el botón de inicio de sesión
            authStep = "idle";
            message = "";
        }
    });

    // ─── Fase 2: Intercambio del código por token ────────────────────────────────
    async function handleOAuthCallback(code) {
        authStep = "loading";
        message = "🔐 Intercambiando código OAuth con GitHub...";

        try {
            // Nuestro proxy backend intercambia code → access_token
            // (el client_secret NUNCA debe ir en el frontend)
            const tokenRes = await fetch(`${PROXY_URL}?code=${code}`);
            if (!tokenRes.ok) throw new Error("El proxy no devolvió un token válido.");
            const { access_token } = await tokenRes.json();

            message = "👤 Obteniendo tu perfil de GitHub...";
            await loadGithubData(access_token);

        } catch (err) {
            console.error(err);
            authStep = "error";
            message = "❌ Error en el flujo OAuth: " + err.message;
        }
    }

    // ─── Cargar datos de GitHub + cruzar con temperaturas ───────────────────────
    async function loadGithubData(token) {
        // 1. Perfil del usuario autenticado
        const userRes = await fetch("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!userRes.ok) throw new Error("No se pudo obtener el perfil de GitHub.");
        githubUser = await userRes.json();

        // 2. Repositorios del usuario (top 30 por estrellas)
        const reposRes = await fetch(
            `https://api.github.com/users/${githubUser.login}/repos?sort=stargazers_count&per_page=30`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const reposRaw = reposRes.ok ? await reposRes.json() : [];
        githubRepos = reposRaw.slice(0, 12);

        // 3. Temperaturas de Pablo (tu propia API)
        const tempRes = await fetch("/api/v2/average-annual-temperatures");
        const dataTemp = tempRes.ok ? await tempRes.json() : [];

        // 4. Cruce de datos: lenguas de los repos del usuario vs temperatura del país
        //    Si el usuario se llama "CJY2851" (Pablo), sus repos en Python → China (temperatura media)
        //    Para la demo, cruzamos el lenguaje principal con países reales
        const langToCountry = {
            "JavaScript": "United Kingdom",
            "TypeScript": "Germany",
            "Python":     "China",
            "Java":       "Austria",
            "C#":         "Belgium",
            "C++":        "Turkey",
            "PHP":        "Mexico",
            "Ruby":       "Italy",
            "Go":         "Austria",
            "Rust":       "Germany",
            "Kotlin":     "Belgium",
            "Swift":      "Italy",
            "HTML":       "China",
            "CSS":        "Turkey"
        };

        const langCount = {};
        githubRepos.forEach(r => {
            if (r.language) langCount[r.language] = (langCount[r.language] || 0) + 1;
        });

        const tempByCountry = {};
        dataTemp.forEach(d => { tempByCountry[d.country] = d.temperature; });

        cruzados = Object.entries(langCount)
            .map(([lang, count]) => {
                const pais = langToCountry[lang] || "Germany";
                return {
                    lenguaje: lang,
                    repos: count,
                    pais: pais,
                    temperatura: tempByCountry[pais] ?? 10.0
                };
            })
            .filter(d => d.repos > 0)
            .sort((a, b) => b.repos - a.repos)
            .slice(0, 10);

        authStep = "done";
        message = "";

        // 5. Dibujar con Vizzu
        await new Promise(resolve => setTimeout(resolve, 100)); // esperar a que el DOM se actualice
        await drawVizzu();
    }

    // ─── Dibujar gráfica con Vizzu ───────────────────────────────────────────────
    async function drawVizzu() {
        if (!chartContainer || cruzados.length === 0) return;

        try {
            const { default: Vizzu } = await import("vizzu");

            const data = {
                series: [
                    { name: "Lenguaje",    values: cruzados.map(d => d.lenguaje) },
                    { name: "País",        values: cruzados.map(d => d.pais) },
                    { name: "Repos",       values: cruzados.map(d => d.repos) },
                    { name: "Temperatura", values: cruzados.map(d => d.temperatura) }
                ]
            };

            const chart = new Vizzu(chartContainer, { data });

            // Animación 1: Barras apiladas por lenguaje y temperatura
            await chart.animate({
                data,
                config: {
                    channels: {
                        x:     { set: ["Lenguaje"] },
                        y:     { set: ["Repos"], range: { min: "0%", max: "110%" } },
                        color: { set: ["País"] },
                        label: { set: ["Repos"] }
                    },
                    title: `Repositorios de ${githubUser?.login ?? "..."} por Lenguaje`,
                    geometry: "rectangle",
                    legend:   "color"
                },
                style: {
                    title: { color: "#00f2fe", fontWeight: "bold", fontSize: "1.1em" },
                    plot: {
                        backgroundColor: "transparent",
                        paddingTop: 30
                    }
                }
            });

            vizzuChart = chart;

            // Animación 2 (tras 3s): Cambiar a punto para ver la temperatura
            setTimeout(async () => {
                try {
                    await chart.animate({
                        config: {
                            channels: {
                                x:     { set: ["Temperatura"] },
                                y:     { set: ["Repos"] },
                                color: { set: ["Lenguaje"] },
                                size:  { set: ["Repos"] },
                                label: { set: ["Lenguaje"] }
                            },
                            title: "Temperatura del país relacionado vs nº de Repos",
                            geometry: "circle",
                            legend:   "color"
                        }
                    });
                } catch { /* si el usuario ya salió */ }
            }, 3500);

        } catch (err) {
            console.error("Vizzu error:", err);
            message = "⚠️ Error al renderizar Vizzu: " + err.message;
        }
    }

    // ─── Iniciar flujo OAuth ─────────────────────────────────────────────────────
    function startOAuth() {
        authStep = "redirecting";
        const scope = "read:user,public_repo";
        const redirectUri = encodeURIComponent(window.location.href.split("?")[0]);
        window.location.href =
            `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=${scope}&redirect_uri=${redirectUri}`;
    }

    // ─── Helper: formatea fecha GitHub ──────────────────────────────────────────
    function fmtDate(iso) {
        return iso ? new Date(iso).toLocaleDateString("es-ES") : "—";
    }
</script>

<main>
    <a href="/integrations" class="back-btn">⬅ Volver al Panel de Pablo</a>
    <h2>🐙 GitHub OAuth + Vizzu (Pablo)</h2>
    <p class="subtitle">
        Autenticación real con <b>GitHub OAuth 2.0</b> para obtener tus repositorios y cruzarlos
        con temperaturas de países usando <b>Vizzu</b> (gráfica animada con transiciones fluidas).
    </p>

    <!-- ── Paso 1: Botón de login ─────────────────────────────────── -->
    {#if authStep === "idle"}
        <div class="login-card">
            <div class="github-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="64" height="64">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/>
                </svg>
            </div>
            <h3>Conecta con GitHub</h3>
            <p>Autoriza el acceso de solo lectura a tu perfil y repositorios públicos para ver el análisis cruzado.</p>
            <button class="btn-login" onclick={startOAuth}>
                🔐 Iniciar sesión con GitHub
            </button>
            <p class="oauth-note">
                Solo se solicitarán permisos de <code>read:user</code> y <code>public_repo</code>.<br>
                No se accede a datos privados ni se almacena ningún token.
            </p>
        </div>

    <!-- ── Cargando ────────────────────────────────────────────────── -->
    {:else if authStep === "loading" || authStep === "redirecting"}
        <div class="loading-card">
            <div class="spinner-ring"></div>
            <p class="loading-text">{message}</p>
        </div>

    <!-- ── Error ──────────────────────────────────────────────────── -->
    {:else if authStep === "error"}
        <div class="error-card">
            <p>{message}</p>
            <button class="btn-retry" onclick={() => { authStep = "idle"; message = ""; }}>
                🔄 Volver a intentarlo
            </button>
        </div>

    <!-- ── Datos cargados ──────────────────────────────────────────── -->
    {:else if authStep === "done" && githubUser}
        <div class="dashboard">

            <!-- Tarjeta de perfil -->
            <div class="profile-card">
                <img src={githubUser.avatar_url} alt="Avatar" class="avatar" />
                <div class="profile-info">
                    <h3>{githubUser.name ?? githubUser.login}</h3>
                    <p class="handle">@{githubUser.login}</p>
                    <p class="bio">{githubUser.bio ?? "Sin descripción."}</p>
                    <div class="stats-row">
                        <span>📦 {githubUser.public_repos} repos públicos</span>
                        <span>👥 {githubUser.followers} seguidores</span>
                        <span>📍 {githubUser.location ?? "—"}</span>
                    </div>
                </div>
            </div>

            <!-- Gráfica Vizzu -->
            <div class="chart-card">
                <h4>📊 Análisis Vizzu: Lenguajes × Repos × Temperatura del País</h4>
                <p class="chart-desc">
                    La gráfica anima automáticamente entre dos vistas: primero barras (repos por lenguaje),
                    luego burbujas (temperatura del país relacionado vs número de repos).
                    Biblioteca: <strong>Vizzu</strong> — combinación única en este proyecto.
                </p>
                <div bind:this={chartContainer} class="vizzu-canvas"></div>
            </div>

            <!-- Tabla de datos cruzados -->
            <div class="table-card">
                <h4>🌡️ Datos Cruzados: Lenguaje → País → Temperatura</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Lenguaje</th>
                            <th>Repos</th>
                            <th>País Asociado</th>
                            <th>Temp. Media (ºC)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each cruzados as fila}
                            <tr>
                                <td><span class="lang-badge">{fila.lenguaje}</span></td>
                                <td class="num">{fila.repos}</td>
                                <td>{fila.pais}</td>
                                <td class="num temp">{fila.temperatura} ºC</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>

            <!-- Repositorios en tarjetas -->
            <div class="repos-section">
                <h4>🗂️ Tus repositorios más populares</h4>
                <div class="repos-grid">
                    {#each githubRepos as repo}
                        <a href={repo.html_url} target="_blank" rel="noopener" class="repo-card">
                            <div class="repo-name">{repo.name}</div>
                            <div class="repo-meta">
                                {#if repo.language}
                                    <span class="repo-lang">{repo.language}</span>
                                {/if}
                                <span>⭐ {repo.stargazers_count}</span>
                                <span>🍴 {repo.forks_count}</span>
                            </div>
                            {#if repo.description}
                                <p class="repo-desc">{repo.description.slice(0, 80)}{repo.description.length > 80 ? "…" : ""}</p>
                            {/if}
                            <div class="repo-date">Actualizado: {fmtDate(repo.updated_at)}</div>
                        </a>
                    {/each}
                </div>
            </div>

            <!-- Explicación técnica -->
            <div class="tech-card">
                <h4>🔒 Detalles del flujo OAuth 2.0 implementado</h4>
                <ol>
                    <li>El usuario pulsa "Iniciar sesión" → se redirige a <code>github.com/login/oauth/authorize</code> con el <code>client_id</code> y el scope mínimo (<code>read:user, public_repo</code>).</li>
                    <li>GitHub redirige de vuelta a esta página con un código temporal en la URL (<code>?code=…</code>).</li>
                    <li>El código se envía al <strong>proxy propio del backend</strong> (<code>/api/proxy/pablo/github-token</code>) que hace el intercambio seguro <code>code → access_token</code> usando el <code>client_secret</code> (que nunca sale del servidor).</li>
                    <li>Con el token se consultan <code>api.github.com/user</code> y <code>api.github.com/users/:login/repos</code>.</li>
                    <li>Los datos de repositorios se cruzan con las temperaturas de tu API propia (<code>/api/v2/average-annual-temperatures</code>) usando el lenguaje principal del repo como clave de correlación con el país.</li>
                    <li>La visualización se realiza con <strong>Vizzu</strong>, una biblioteca de animación de datos con transiciones morfológicas fluidas, no usada por ningún otro miembro del grupo.</li>
                </ol>
            </div>
        </div>
    {/if}
</main>

<style>
    :global(body) { margin: 0; background: #0f172a; color: white; font-family: 'Segoe UI', sans-serif; }
    main { max-width: 1100px; margin: 0 auto; padding: 2rem; }

    h2 { color: #00f2fe; text-align: center; margin-bottom: 0.5rem; font-size: 1.9rem; }
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 2.5rem; line-height: 1.6; }
    .back-btn { display: inline-block; margin-bottom: 1.5rem; color: #94a3b8; text-decoration: none; font-weight: bold; transition: color 0.2s; }
    .back-btn:hover { color: #00f2fe; }

    /* ── Login card ──────────────────────────── */
    .login-card {
        max-width: 480px;
        margin: 0 auto;
        background: linear-gradient(135deg, rgba(0,242,254,0.08), rgba(168,85,247,0.08));
        border: 1px solid rgba(0,242,254,0.3);
        border-radius: 20px;
        padding: 3rem 2rem;
        text-align: center;
    }
    .github-icon { margin-bottom: 1.5rem; }
    .login-card h3 { font-size: 1.6rem; color: #e2e8f0; margin-bottom: 0.8rem; }
    .login-card p { color: #94a3b8; margin-bottom: 2rem; line-height: 1.5; }

    .btn-login {
        background: linear-gradient(135deg, #238636, #1a7f37);
        color: white;
        border: none;
        padding: 0.9rem 2.5rem;
        border-radius: 10px;
        cursor: pointer;
        font-size: 1.1rem;
        font-weight: bold;
        transition: all 0.3s;
        box-shadow: 0 4px 20px rgba(35,134,54,0.4);
    }
    .btn-login:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(35,134,54,0.6); }

    .oauth-note { font-size: 0.8rem; color: #475569; margin-top: 1.5rem; line-height: 1.6; }
    .oauth-note code { background: rgba(255,255,255,0.1); padding: 0.1rem 0.4rem; border-radius: 4px; }

    /* ── Loading ─────────────────────────────── */
    .loading-card { text-align: center; padding: 4rem 2rem; }
    .spinner-ring {
        width: 60px; height: 60px;
        border: 4px solid rgba(0,242,254,0.2);
        border-top-color: #00f2fe;
        border-radius: 50%;
        margin: 0 auto 2rem;
        animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-text { color: #94a3b8; font-size: 1.1rem; }

    /* ── Error ───────────────────────────────── */
    .error-card {
        background: rgba(239,68,68,0.1);
        border: 1px solid #ef4444;
        border-radius: 12px;
        padding: 2rem;
        text-align: center;
    }
    .btn-retry {
        background: #ef4444; color: white; border: none;
        padding: 0.7rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: bold; margin-top: 1rem;
    }

    /* ── Dashboard ───────────────────────────── */
    .dashboard { display: flex; flex-direction: column; gap: 2rem; }

    /* Perfil */
    .profile-card {
        display: flex; gap: 2rem; align-items: flex-start;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px; padding: 1.8rem;
    }
    .avatar { width: 90px; height: 90px; border-radius: 50%; border: 3px solid #00f2fe; flex-shrink: 0; }
    .profile-info { flex: 1; }
    .profile-info h3 { margin: 0 0 0.3rem; font-size: 1.5rem; color: #e2e8f0; }
    .handle { color: #94a3b8; margin: 0 0 0.5rem; }
    .bio { color: #cbd5e1; margin: 0 0 1rem; font-style: italic; }
    .stats-row { display: flex; gap: 1.5rem; flex-wrap: wrap; font-size: 0.9rem; color: #94a3b8; }

    /* Gráfica */
    .chart-card {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(0,242,254,0.2);
        border-radius: 16px; padding: 1.8rem;
    }
    .chart-card h4, .table-card h4, .repos-section h4, .tech-card h4 {
        color: #00f2fe; margin: 0 0 0.7rem; font-size: 1.1rem;
    }
    .chart-desc { color: #94a3b8; font-size: 0.9rem; margin-bottom: 1rem; line-height: 1.5; }
    .vizzu-canvas { width: 100%; height: 480px; border-radius: 10px; overflow: hidden; background: #0b1120; }

    /* Tabla */
    .table-card {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px; padding: 1.8rem;
    }
    table { width: 100%; border-collapse: collapse; }
    th { color: #00f2fe; padding: 0.8rem 1rem; text-align: left; border-bottom: 2px solid rgba(0,242,254,0.2); font-size: 0.9rem; }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.07); color: #e2e8f0; font-size: 0.9rem; }
    tr:last-child td { border-bottom: none; }
    td.num { text-align: center; font-family: monospace; }
    td.temp { color: #f59e0b; }
    .lang-badge {
        background: rgba(168,85,247,0.2); color: #c084fc;
        border: 1px solid #a855f7; border-radius: 20px;
        padding: 0.2rem 0.7rem; font-size: 0.8rem;
    }

    /* Repos */
    .repos-section {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px; padding: 1.8rem;
    }
    .repos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-top: 1rem; }
    .repo-card {
        background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 1rem;
        text-decoration: none; color: white; transition: all 0.2s;
        display: flex; flex-direction: column; gap: 0.4rem;
    }
    .repo-card:hover { border-color: #00f2fe; background: #243448; transform: translateY(-2px); }
    .repo-name { font-weight: bold; color: #38bdf8; font-size: 0.95rem; }
    .repo-meta { display: flex; gap: 0.8rem; font-size: 0.8rem; color: #94a3b8; flex-wrap: wrap; }
    .repo-lang { background: rgba(0,242,254,0.15); color: #00f2fe; padding: 0.1rem 0.5rem; border-radius: 10px; font-size: 0.75rem; }
    .repo-desc { color: #94a3b8; font-size: 0.82rem; margin: 0; line-height: 1.4; }
    .repo-date { font-size: 0.75rem; color: #475569; margin-top: auto; }

    /* Explicación técnica */
    .tech-card {
        background: rgba(168,85,247,0.06);
        border: 1px solid rgba(168,85,247,0.3);
        border-radius: 16px; padding: 1.8rem;
    }
    .tech-card h4 { color: #a855f7; }
    .tech-card ol { color: #cbd5e1; line-height: 1.8; padding-left: 1.5rem; }
    .tech-card code { background: rgba(255,255,255,0.1); padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.85rem; color: #00f2fe; }
</style>