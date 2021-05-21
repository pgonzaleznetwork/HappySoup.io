<template>
  
  <Panel>
    <template v-slot:title>
      Settings
    </template>

    <template v-slot:tip>
      <p>Change happysoup info</p>
    </template>

    <template v-slot:form>
      
      <form>
        <div class="field">
          <div class="control">
            <button class="button is-info">
              <span class="icon">
                <i class="fas fa-search"></i>
              </span>
              <span>Save</span>
            </button>
          </div>
        </div>
      </form>
    </template>

  </Panel>

</template>


<script>

import Panel from '@/components/Panel.vue'


export default {

  components:{Panel}

}
</script>

<style>

</style>