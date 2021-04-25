<template>
   <!--<section class="is-flex is-flex-direction-row  
      is-align-items-center is-justify-content-space-evenly">-->
  <section class="columns">
    <div class="column">
      <login-form/>
    </div>
    <div class="column infoSection">
      <info/>
    </div>
   </section>
</template>

<script>

import LoginForm from './components/LoginForm'
import Info from './components/Info'


export default {
  components:{LoginForm,Info}
}
</script>

<style lang="scss" scoped>

  section{
    height: 100vh;
  }

  .column{
    position: relative;
  }

  .infoSection{
    background:#34495e;
  }

</style>
