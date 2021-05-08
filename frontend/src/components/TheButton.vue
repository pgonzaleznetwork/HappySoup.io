<template>
    <div class="field">
        <div class="control">
            <button @click="emitClick" class="button is-success" :disabled="disabled">
            <span class="icon">
                <i class="fas fa-search"></i>
            </span>
            <span>{{title}}</span>
            </button>
        </div>
    </div>
</template>

<script>
export default {
    props:['title','disabled'],

    methods:{
        emitClick(){
            this.$emit('clicked');
        }
    }
}
</script>

<style>

</style>