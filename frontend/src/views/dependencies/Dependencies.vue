<template>
  
  <Panel>
    <template v-slot:title>
      Impact Analysis
    </template>

    <template v-slot:tip>
      <h4>Tip</h4>
      <p>If you know where a piece of metadata is used (i.e what depends on it), you will know what could break if you make changes to it.</p>
      <p>You can also use this to answer questions like: <i>What automation (workflow/apex/etc.) is assigning this value to this field?</i> or 
      <i>What workflow is sending this email template?</i>.</p>
    </template>

    <template v-slot:form>
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
    </template>

  </Panel>

</template>

<script>


import MetadataList from '@/components/MetadataList.vue';
import Panel from '@/components/Panel.vue'


export default {

    components:{MetadataList,Panel}

}
</script>

<style lang="scss" scoped>


</style>