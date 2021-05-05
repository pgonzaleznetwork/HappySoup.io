<template>
  <section class="container">
    <div class="box">
      <div class="content">
        <p>Impact Analysis is about understanding where your metadata is used so that you can make informed decisions before making changes to it. Here are 
          some examples of when this is useful
        </p>
        <ul>
          <li>If you are changing the name of a picklist value, you should know where that value is used (apex, report filters, etc.)</li>
          <li>You could be</li>
        </ul>
      </div>
      <form @submit.prevent="login" >

        <div class="field">
          <MetadataList />
        </div>
        
        <div class="field">
          <div class="control">
            <button class="button is-info">
              <span class="icon">
                <i class="fas fa-search"></i>
              </span>
              <span>Where is this used</span>
            </button>
          </div>
        </div>
  </form>
    </div>
</section>
</template>

<script>

import NavBar from '@/components/NavBar.vue';
import MetadataList from '../../components/MetadataList.vue';


export default {

    components:{NavBar,MetadataList}

}
</script>

<style>

  .topX{
    background-color: green;;
  }

</style>