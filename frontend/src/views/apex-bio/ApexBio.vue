<template>
  
  <Panel>
    <template v-slot:title>
      Apex Bio
    </template>

    <template v-slot:tip>
      <p>Get intimate with your apex classes</p>
    </template>

    <template v-slot:form>
      <form>
        <div class="field">
          <div class="control">
            <button class="button is-info">
              <span class="icon">
                <i class="fas fa-search"></i>
              </span>
              <span>Get Bio</span>
            </button>
          </div>
        </div>
      </form>
    </template>

     <template v-slot:results>
      <p>Awesome info</p>
    </template>

  </Panel>

</template>


<script>

import Panel from '@/components/ui/Panel.vue'

export default {

  components:{Panel}

}
</script>

<style>

</style>