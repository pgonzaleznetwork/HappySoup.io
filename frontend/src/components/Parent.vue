<template>
  {{showData()}} 
  
</template>

<script>
import Child from './Child.vue'

export default {
  components: { Child },

  methods:{
      showData(){
          return 'hello'
      }
  }

}
</script>

<style>

</style>