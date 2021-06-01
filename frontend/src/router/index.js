import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/login/Login.vue';
import Dependencies from '../views/dependencies/Dependencies.vue';
import Configure from '../views/configure/Configure.vue';
import Boundaries from '../views/boundaries/Boundaries.vue';
import LayoutDictionary from '../views/layout-dictionary/LayoutDictionary.vue';
import ApexBio from '../views/apex-bio/ApexBio.vue';
import NotFound from '../views/not-found/NotFound.vue';

function requireAuth(to,from,next){
  console.log(this);
  console.log(this.$cookies.get('_ga'))
  next();
}



const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login,
    beforeEnter:requireAuth
  },
  {
    path: '/dependencies',
    name: 'Dependencies',
    component: Dependencies,
    
  },
  {
    path: '/boundaries',
    name: 'Boundaries',
    component: Boundaries,
    
  },
  {
    path: '/layout-dictionary',
    name: 'LayoutDictionary',
    component: LayoutDictionary,
    
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

router.beforeEach((to,from,next) => {
  console.log(router.app);
});

function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  console.log('decoded',document.cookie)
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

export default router
