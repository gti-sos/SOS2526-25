<script>
    // 1. Importamos el componente Router
    import Router from "svelte-spa-router";

    // 2. Importamos nuestras vistas (componentes)
    import Home from "./routes/Home.svelte";
    import SocialDrinking from "./routes/SocialDrinking.svelte";
    import Arrivals from "./routes/Arrivals.svelte";
    import Temperatures from "./routes/Temperatures.svelte";

    // 3. Definimos el diccionario de rutas
    // La clave es la ruta en la URL, el valor es el componente que se carga
    const routes = {
        "/": Home,
        "/social-drinking-behaviors": SocialDrinking,
        "/international-tourist-arrivals": Arrivals,
        "/average-annual-temperatures": Temperatures,
        
        // (Opcional) Ruta comodín para mostrar un error 404 si escriben mal la URL
        // "*": NotFound 
    };
</script>

<Router {routes} />