<template>
  <div class="hero">
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

  props:['current'],

  data(){
    return{
      username:'',
      showMobileMenu:false,
      currentTab:'/dependencies',
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

.hero{

  background-color: #2c4b60;

  .navbar-item{
      color:white;
    }
  
  .navbar-item:hover{
    background-color: #243a4a;
    color:white;
  }
}


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