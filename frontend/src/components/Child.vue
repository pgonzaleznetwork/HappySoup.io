<template>
  This is the child component 
  <Parent v-if="recursive"/>
</template>

<script>

import Parent from '@/components/Parent.vue'

export default {

    components:{Parent},

    props:['recursive']
}
</script>

<style>

</style>