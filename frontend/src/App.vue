<template>
  <NavBar v-show="showNavBar" :current="currentPath"/>
  <router-view/>
</template>

<script>

import NavBar from '@/components/NavBar.vue';

export default {
  
  components:{NavBar},

  computed:{
    showNavBar(){
      return (this.$router.currentRoute.value.name != 'Login');
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
