<template>
  <NavBar v-show="showNavBar" :current="currentPath"/>
 
  <router-view v-slot="{ Component }">
  <keep-alive>
    <component :is="Component" />
  </keep-alive>
</router-view>
</template>

<script>

import NavBar from '@/components/ui/NavBar.vue';

export default {
  
  components:{NavBar},

  computed:{
    showNavBar(){
      let route = this.$router.currentRoute.value.name;
      return (route != 'Login' && route != 'NotFound');
    },

    currentPath(){
      return this.$router.currentRoute.value.name
    }
  },

  
}
</script>


<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  
}


</style>
