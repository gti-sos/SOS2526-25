import { mount } from 'svelte';
import App from './App.svelte';

// En Svelte 5 usamos "mount" y apuntamos al div que hemos creado
const app = mount(App, {
    target: document.getElementById('app')
});

export default app;