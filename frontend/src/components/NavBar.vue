<template>
  <div class="hero is-info">
  <section class="container">
     <nav class="navbar" role="navigation" aria-label="main navigation">
  <div class="navbar-brand">
    <span class="navbar-item is-size-4 has-text-weight-semibold">HappySoup.io</span>

    <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
    </a>
  </div>

  <div id="navbarBasicExample" class="navbar-menu">
    <div class="navbar-start">
      <a class="navbar-item">
        Impact Analysis
      </a>

      <a class="navbar-item">
        Deployment Boundaries
      </a>

      <a class="navbar-item">
        Page Layout Dictionary
      </a>

      <a class="navbar-item">
        Apex Bio
      </a>

      <a class="navbar-item">
        Documentation
      </a>
    </div>

    <div class="navbar-end">
      <div class="navbar-item has-dropdown is-hoverable">
        <a class="navbar-item">
          <span>{{username}}</span>
          <span class="icon">
            <i class="fas fa-caret-down"></i>
          </span>
        </a>

        <div class="navbar-dropdown">
          <router-link to="/configure">
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
      username:''
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
    }

  },
  
  async mounted(){
      this.getUserDetails();
  }

}
</script>

<style lang="scss">
.navbar-item{
  font-weight: bold;
}

.navbar-dropdown{
  background-color: white;

    .navbar-item{
      color:$text-color !important;
    }

    .navbar-item:hover{
      background-color: gainsboro !important;
    }
}

</style>