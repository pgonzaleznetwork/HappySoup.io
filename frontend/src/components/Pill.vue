<template>
  <span class="tag is-light has-tooltip-arrow has-tooltip has-tooltip-right" :data-tooltip="pill.description">{{pill.label}}</span>
</template>

<script>
export default {
    props:['type','pill']
}
</script>

<style>

</style>