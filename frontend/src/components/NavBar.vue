<template>
  <div v-if="production" class="hero is-danger has-text-centered is-size-7 prod-warning"><b>You are using HappySoup from a PRODUCTION org. HappySoup does not need access to your data (only your metadata), so it's recommended to use it with a sandbox environment</b></div>
  <div class="hero is-info">
  <section class="container">
     <nav class="navbar" role="navigation" aria-label="main navigation">
  <div class="navbar-brand">
    <span class="navbar-item is-size-4 has-text-weight-semibold">HappySoup.io</span>

    <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" @click="toggleMobileMenu" :class="{'is-active':showMobileMenu}">
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
    </a>
  </div>

  <div class="navbar-menu" :class="{'is-active':showMobileMenu}">
    <div class="navbar-start">
      
      <a  class="navbar-item" @click="moveTo('/dependencies')">
        Impact Analysis 
      </a>
      

      <a  class="navbar-item"  @click="moveTo('/boundaries')">
        Deployment Boundaries
      </a>

      <a  class="navbar-item"  @click="moveTo('/layout-dictionary')">
        Page Layout Dictionary 
      </a>

      <a  class="navbar-item"  @click="moveTo('/apex-bio')">
        Apex Bio 
      </a>

      <a class="navbar-item">
        Documentation
      </a>
    </div>

    <div class="navbar-end">
      <div class="navbar-item has-dropdown is-hoverable">
        <a class="navbar-item">
          <span class="icon">
          <i class="fas fa-user"></i>
          </span>
          <span> {{username}}</span>
          <span class="icon">
            <i class="fas fa-caret-down"></i>
          </span>
        </a>

        <div class="navbar-dropdown">
          <router-link to="/configure" @click="setActive">
          <a class="navbar-item">
            <span class="icon-text">
              <span class="icon">
               <i class="fas fa-user-cog"></i>
              </span>
              <span>Settings</span>
            </span>
          </a>
          </router-link>
          <a  @click.prevent="logout" class="navbar-item">
            <span class="icon-text">
              <span class="icon">
                <i class="fas fa-sign-out-alt"></i>
              </span>
              <span >Logout</span>
            </span>
          </a>
        </div>
      </div>
    </div>
  </div>
</nav>
  </section>
  </div>
 
</template>

<script>
export default {

  data(){
    return{
      username:'',
      showMobileMenu:false,
      currentTab:'/dependencies',
      production:false
    }
  },

  methods:{
    
    async logout(){
      await fetch('/oauth2/logout');
      this.$router.push('/');
    },

    async getUserDetails(){
      let response = await fetch('/api/identity');
      let json = await response.json();
      this.username = json.username;    
      this.production = json.env == 'Production'; 
    },

    toggleMobileMenu(){
      this.showMobileMenu = !this.showMobileMenu;
    },

    moveTo(path){
      this.$router.push(path);
      //hide mobile menu
      if(this.showMobileMenu){
        this.showMobileMenu = false;
      }
    }

  },
  
  async mounted(){
      this.getUserDetails();
  }

}
</script>

<style lang="scss">


.prod-warning{
  background-color: red  !important;
}

.navbar-item{
  font-weight: bold;
  
}

.navbar-dropdown{
  background-color: white !important;

    .navbar-item{
      color:$text-color !important;
      background-color: white !important;
    }

    .navbar-item:hover{
      background-color: gainsboro !important;
    }
}

.router-link-active .router-link-exact-active{
  background-color: $primary-color !important;
}

</style>