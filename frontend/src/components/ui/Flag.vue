<template>
    <div class="field">
        <div class="control">
            <label class="checkbox">
            <input type="checkbox" v-model="ticked" @change="notify">
            <span class="tag-label">{{label}}</span> <span class="has-tooltip-arrow has-tooltip-info has-tooltip-right" :data-tooltip="description">
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

<style lang="scss" scoped>

    .tag-label{
        margin-left:5px;
        @extend .text-size
    }

</style>