<template>
  <div class="nav-container">
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
      

      <a class="navbar-item" @click="moveTo('/usage')" :class="{'active-tab':currentTab == '/usage'}">
          <span class="icon">
          <i class="fas fa-sitemap"></i>
          </span>
          <span style="margin-left:10px">Impact Analysis </span>
      </a>

      <a  class="navbar-item"  @click="moveTo('/boundaries')" :class="{'active-tab':currentTab == '/boundaries'}">
        <span class="icon">
        <i class="fas fa-code-branch"></i>
        </span>
        <span style="margin-left:10px">Deployment Boundaries </span>
      </a>

      <a  class="navbar-item"  @click="moveTo('/layout-dictionary')" :class="{'active-tab':currentTab == '/layout-dictionary'}">
        <span class="icon">
        <i class="fas fa-book"></i>
        </span>
        <span style="margin-left:10px">Page Layout Dictionary </span> 
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
          <!--<router-link to="/configure">
          <a class="navbar-item">
            <span class="icon-text">
              <span class="icon">
               <i class="fas fa-user-cog"></i>
              </span>
              <span>Settings</span>
            </span>
          </a>
          </router-link>-->
          <router-link to="/session">
          <a class="navbar-item">
            <span class="icon-text">
              <span class="icon">
               <i class="fas fa-user-cog"></i>
              </span>
              <span>Session Data</span>
              <span style="color:red; padding-left:2px">   New!!</span>
            </span>
          </a>
          </router-link>
          <a class="navbar-item" :href="orgUrl" target="_blank">
            <span class="icon-text">
              <span class="icon">
                <i class="fas fa-server"></i>
              </span>
              <span>Go to Org</span>
            </span>
          </a>
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

  props:['current'],

  data(){
    return{
      username:'',
      showMobileMenu:false,
      currentTab:'/usage',
      orgUrl:''
    }
  },

  methods:{
    
    async logout(){
      await fetch('/oauth2/logout');
      this.deleteSessionCookie();
      this.$router.push('/');
    },

    async getUserDetails(){
      let response = await fetch('/api/identity');
      let {url,username} = await response.json();
      this.orgUrl = url;
      this.username = username;     
    },

    toggleMobileMenu(){
      this.showMobileMenu = !this.showMobileMenu;
    },

    deleteSessionCookie(){
      const { $cookies } = this.$router.app.config.globalProperties;
      $cookies.remove('connect.sid');
    },

    moveTo(path){
      this.$router.push(path);
      this.currentTab = path;
      //hide mobile menu
      if(this.showMobileMenu){
        this.showMobileMenu = false;
      }
    }

  },
  
  async mounted(){
    
    window.setTimeout(()=>{
      if(this.current != 'Login'){
        this.getUserDetails()
      }
    },500)
      ;
  }

}
</script>

<style lang="scss">

.nav-container{

  background-color: $background-color;

  .navbar{
    background-color: $background-color;
  }

  .navbar-item,.navbar-burger{
      color:white;
    }
  
  .navbar-item:hover{
    background-color: #111b22;
    color:white;
  }

  
}

@media screen and (max-width: 1023px){

  .navbar-menu {
      background-color: $background-color;
      box-shadow: 0 8px 16px rgb(10 10 10 / 10%);
      padding: 0.5rem 0;
  }

}


.active-tab{
  background-color: #111b22;
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