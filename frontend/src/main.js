
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
import TableLite from "vue3-table-lite";
import PrimeVue from 'primevue/config';
import VueCookies from 'vue3-cookies'

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup'; 
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import MultiSelect from 'primevue/multiselect';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Slider from 'primevue/slider';
import ProgressBar from 'primevue/progressbar';
import Button from 'primevue/button';
import 'primeflex/primeflex.css';
import 'primevue/resources/themes/saga-blue/theme.css'       
import 'primevue/resources/primevue.min.css'                
import 'primeicons/primeicons.css'

const app = createApp(App)

app.component('TreeItem', TreeItem) 
app.component('Error',Error);
app.component('Modal',Modal);
app.component('MetadataTree', MetadataTree) 
app.component('TableLite',TableLite)
app.component('DataTable',DataTable)
app.component('Column',Column)
app.component('ColumnGroup',ColumnGroup)
app.component('Dropdown',Dropdown)
app.component('Calendar',Calendar)
app.component('InputNumber',InputNumber)
app.component('InputText',InputText)
app.component('Slider',Slider)
app.component('ProgressBar',ProgressBar)
app.component('Button',Button)
app.component('MultiSelect',MultiSelect)


app.use(router);
app.use(PrimeVue);
app.use(VueCookies);

app.mount('#app')
