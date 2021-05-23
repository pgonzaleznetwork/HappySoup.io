
import '@/assets/main.scss';
import '@/assets/bulma-tooltip.css'
import '@fortawesome/fontawesome-free/css/all.css'
import '@fortawesome/fontawesome-free/js/all.js'
import TreeItem from '@/components/TreeItem.vue';
import MetadataTree from '@/components/MetadataTree.vue';
import Error from '@/components/Error';
import Modal from '@/components/Modal';
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createStore } from 'vuex'

const app = createApp(App)

app.component('TreeItem', TreeItem) 
app.component('Error',Error);
app.component('Modal',Modal);
app.component('MetadataTree', MetadataTree) 
app.use(router);

app.mount('#app')