
import '@/assets/main.scss';
import '@/assets/bulma-tooltip.css'
import '@fortawesome/fontawesome-free/css/all.css'
import '@fortawesome/fontawesome-free/js/all.js'
import TreeItem from '@/components/TreeItem.vue';
import MetadataTree from '@/components/MetadataTree.vue';
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createStore } from 'vuex'

const store = createStore({
  state () {
    return {
      isDependencyTreeOpen: false,
      isUsageTreeOpen:false,
    }
  },
  mutations: {
    toggleDependencyTree (state) {
      state.isDependencyTreeOpen = !state.isDependencyTreeOpen;
    },

    toggleUsageTree (state) {
        state.isUsageTreeOpen = !state.isUsageTreeOpen;
      },
  }
})

const app = createApp(App)

app.component('TreeItem', TreeItem) 
app.component('MetadataTree', MetadataTree) 
app.use(store);
app.use(router);

app.mount('#app')