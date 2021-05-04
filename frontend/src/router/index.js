import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/login/Login.vue';
import Dependencies from '../views/dependencies/Dependencies.vue';
import Configure from '../views/configure/Configure.vue';
import Boundaries from '../views/boundaries/Boundaries.vue';
import LayoutDictionary from '../views/layout-dictionary/LayoutDictionary.vue';
import ApexBio from '../views/apex-bio/ApexBio.vue';



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
    path: '/boundaries',
    name: 'Boundaries',
    component: Boundaries
  },
  {
    path: '/layout-dictionary',
    name: 'LayoutDictionary',
    component: LayoutDictionary
  },
  {
    path: '/apex-bio',
    name: 'ApexBio',
    component: ApexBio
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
