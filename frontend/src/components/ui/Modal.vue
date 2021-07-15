<template>
  <div class="modal" :class="cssProps">
  <div class="modal-background"></div>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title"><slot name="title"></slot></p>
      <button class="delete" aria-label="close" @click="closeModal"></button>
    </header>
    <section class="modal-card-body">
      <slot name="content"></slot>
    </section>
    <footer class="modal-card-foot">
    </footer>
  </div>
</div>
</template>

<script>
export default {

    props:['isActive'],

    methods:{
        closeModal(){
            this.$emit('closeModal');
        }
    },

    computed:{
        cssProps () {
            if(this.isActive){
                return 'is-active';
            }
      }
    }

}
</script>

<style lang="scss" scoped>

    .modal-card-head,.modal-card-foot{
        background-color: $background-color;
        
    }

    .modal-card-title{
        color:white;
    }

</style>


