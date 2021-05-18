<template>
  This is the parent component 
  <Child recursive="true"/>
</template>

<script>
import Child from './Child.vue'

export default {
  components: { Child },

}
</script>

<style>

</style>