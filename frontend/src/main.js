
import '@/assets/main.scss';
import '@/assets/bulma-tooltip.css'
import '@fortawesome/fontawesome-free/css/all.css'
import '@fortawesome/fontawesome-free/js/all.js'
import TreeItem from '@/components/TreeItem.vue';
import MetadataTree from '@/components/MetadataTree.vue';
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

//createApp(App).use(router).mount('#app')

const app = createApp(App)

app.component('TreeItem', TreeItem) 
app.component('MetadataTree', MetadataTree) 
app.use(router);

app.mount('#app')