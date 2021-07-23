<template>
  <div class="notification is-light" :class="type" :style="cssProps">
  <button @click="emitClose" class="delete"></button>
    <slot></slot>
</div>
</template>

<script>
export default {

    props: {
        type: {default: 'is-danger'},
        maxWidth:{}
    },

    methods:{
        emitClose(){
            this.$emit('close');
        }
    },

    computed:{
        cssProps () {
        return `max-width:${this.maxWidth}`
      }
    }

}
</script>

<style scoped>

    .notification{
        text-align: center;
    }

</style>