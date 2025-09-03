import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { H } from 'highlight.run';
import axios from 'axios';
import { createPinia } from 'pinia';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import Dialog from 'primevue/dialog';
import '@/assets/styles.scss';

// Configure axios defaults
axios.defaults.withCredentials = true;

if(['staging', 'production'].includes(import.meta.env.VITE_NODE_ENV)) {
  H.init(import.meta.env.VITE_HIGHLIGHT_PROJECT_ID, {
    environment: import.meta.env.VITE_NODE_ENV,
    version: 'commit:abcdefg12345',
    networkRecording: {
      enabled: true,
      recordHeadersAndBody: true
    }
  });
}

const app = createApp(App);

// Create a Vue Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

app.use(router);
app.use(VueQueryPlugin, { queryClient });

const MyPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{indigo.50}',
            100: '{indigo.100}',
            200: '{indigo.200}',
            300: '{indigo.300}',
            400: '{indigo.400}',
            500: '{indigo.500}',
            600: '{indigo.600}',
            700: '{indigo.700}',
            800: '{indigo.800}',
            900: '{indigo.900}',
            950: '{indigo.950}'
        }
    }
});
app.use(PrimeVue, {
    theme: {
        preset: MyPreset,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(ToastService);
app.use(ConfirmationService);
const pinia = createPinia();
app.use(pinia);
app.component('Dialog', Dialog);
app.mount('#app');
