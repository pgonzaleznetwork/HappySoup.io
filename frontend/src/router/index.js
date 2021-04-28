import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/login/Login.vue';
import Dependencies from '../views/dependencies/Dependencies.vue';

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
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
