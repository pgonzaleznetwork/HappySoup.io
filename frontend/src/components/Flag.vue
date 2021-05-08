<template>
    <div class="field">
        <div class="control">
            <label class="checkbox">
            <input type="checkbox" v-model="ticked" @change="notify">
            {{label}} <span class="icon has-text-warning has-tooltip-arrow has-tooltip-info has-tooltip-right" :data-tooltip="description">
                <i class="far fa-question-circle"></i></span>
            </label>
        </div>
    </div>
</template>

<script>
export default {

    props:['label','value','description'],

    data(){
        return{
            ticked:false
        }
    },

    methods:{
        notify(){
            let ticked = this.ticked;
            let value = this.value;
            this.$emit('ticked',{ticked,value});
        }
    }

}
</script>

<style>

</style>