import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/login/Login.vue';
import Usage from '../views/usage/Usage.vue';
import BulkUsage from '../views/bulk-usage/BulkUsage';
import Configure from '../views/configure/Configure.vue';
import Boundaries from '../views/boundaries/Boundaries.vue';
import LayoutDictionary from '../views/layout-dictionary/LayoutDictionary.vue';
import WorkflowInfo from '../views/workflows/WorkflowInfo.vue';
import Dreamforce from '../views/dreamforce/Dreamforce.vue';
import YamlGenerator from '../views/yaml-generator/YamlGenerator.vue';
import ApexBio from '../views/apex-bio/ApexBio.vue';
import NotFound from '../views/not-found/NotFound.vue';
import Session from '@/views/session/Session.vue';

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login,
  },
  {
    path: '/yaml',
    name: 'YamlGenerator',
    component: YamlGenerator,
  },
  {
    path: '/cicd',
    name: 'Dreamforce',
    component: Dreamforce,
  },
  {
    path: '/workflows',
    name: 'WorkflowInfo',
    component: WorkflowInfo,
    beforeEnter:requireAuth
  },
  {
    path: '/usage',
    name: 'Usage',
    component: Usage,
    beforeEnter:requireAuth
  },
  {
    path: '/bulk-usage',
    name: 'BulkUsage',
    component: BulkUsage,
    beforeEnter:requireAuth
  },
  {
    path: '/boundaries',
    name: 'Boundaries',
    component: Boundaries,
    beforeEnter:requireAuth
    
  },
  {
    path: '/layout-dictionary',
    name: 'LayoutDictionary',
    component: LayoutDictionary,
    beforeEnter:requireAuth
    
  },
  
  {
    path: '/session',
    name: 'Session',
    component: Session,
    beforeEnter:requireAuth
  },
  {
    path: '/configure',
    name: 'Configure',
    component: Configure,
    beforeEnter:requireAuth
  },
  {
    path: '/:catchAll(.*)',
    name: 'NotFound',
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

function requireAuth(to, from, next) {
  const { $cookies } = router.app.config.globalProperties

  if(!$cookies.get('connect.sid')){
    next('/?logout=true')
  }
  else{
    next()
  }


}



export default router
