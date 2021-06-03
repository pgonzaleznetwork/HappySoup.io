<template>
  <section class="entire-screen columns">
    <div class="login column is-flex 
    is-flex-direction-column 
    is-justify-content-center
    is-align-items-center">

      <login-form/>

    </div>

    <div class="column infoSection is-flex 
    is-flex-direction-row 
    is-justify-content-center
    is-align-items-center">

      <info/>
      
    </div>
   </section>
</template>

<script>

import LoginForm from './components/LoginForm'
import Info from './components/Info'


export default {
  components:{LoginForm,Info},

  mounted(){
    console.log('login view is mounted');
  
  }
}
</script>

<style lang="scss" scoped>

  .login{
    border-right: thin solid black;
  }

  .column{
    padding:50px
  }

  .infoSection{
    background-color: #f1f1f1;;
  }

</style>
