<template>
  <section class="container">
    <div class="box">
      <form @submit.prevent="login" >
        <MetadataList />
        

        <div class="field">
          <div class="control">
            <label>
              <input v-model="privacyAccepted" type="checkbox" />
              I agree to the HappySoup.io <a  href="https://github.com/pgonzaleznetwork/sfdc-happy-soup#privacy-policy" target="_blank">Privacy Policy</a>
            </label>
          </div>
        </div>

        <div class="field">
          <div class="control">
            <button class="button is-info">
              <span class="icon">
                <i class="fas fa-search"></i>
              </span>
              <span>Show me where it's used</span>
            </button>
          </div>
        </div>
        <p><a  href="https://github.com/pgonzaleznetwork/sfdc-happy-soup#happysoupio" target="_blank">Documentation</a></p>
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