<template>
  <span class="tag is-light has-tooltip-arrow has-tooltip has-tooltip-right" :class="typeClass" :data-tooltip="pill.description">{{pill.label}}</span>
</template>

<script>
export default {
    props:['pill'],

    computed:{

      typeClass(){
        return {
            'is-success': this.pill.type == 'success',
            'is-danger': this.pill.type == 'warning',
            'is-warning': this.pill.type == 'info'
        }
      }
    }
}
</script>

<style>

</style>