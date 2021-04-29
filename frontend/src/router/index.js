import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/login/Login.vue';
import Dependencies from '../views/dependencies/Dependencies.vue';
import Configure from '../views/configure/Configure.vue';


const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login
  },
  {
    path: '/dependencies',
    name: 'Dependencies',
    component: Dependencies
  },
  {
    path: '/configure',
    name: 'Configure',
    component: Configure
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
