<template>
  
  <Panel>
    <template v-slot:title>
      Page Layout Dictionary
    </template>

    <template v-slot:tip>
      <p>See fields on layout</p>
    </template>

    <template v-slot:form>
      <form>
        <div class="field">
          <div class="control">
            <button class="button is-info">
              <span class="icon">
                <i class="fas fa-search"></i>
              </span>
              <span>See dictonary</span>
            </button>
          </div>
        </div>
      </form>
    </template>

     <template v-slot:results>
      <p>Table goes here</p>
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