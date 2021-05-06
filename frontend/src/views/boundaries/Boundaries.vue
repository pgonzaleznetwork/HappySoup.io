<template>
  
  <Panel>
    <template v-slot:title>
      Deployment Boundaries
    </template>

    <template v-slot:tip>
      <p>Deployment boundaries are awesome</p>
    </template>

    <template v-slot:form>
      <form>
        <div class="field">
          <div class="control">
            <button class="button is-info">
              <span class="icon">
                <i class="fas fa-search"></i>
              </span>
              <span>See boundary</span>
            </button>
          </div>
        </div>
      </form>
    </template>

     <template v-slot:results>
      <p>Deployment boundaries are awesome</p>
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